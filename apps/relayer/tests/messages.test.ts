import { jest } from "@jest/globals";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import hardhat from "hardhat";
import { genProof } from "maci-circuits";
import { deploy, deployPoll, deployVkRegistryContract, joinPoll, setVerifyingKeys, signup } from "maci-cli";
import { formatProofForVerifierContract, genMaciStateFromContract } from "maci-contracts";
import { Keypair } from "maci-domainobjs";
import request from "supertest";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

import {
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  pollJoinedZkey,
  pollJoiningZkey,
  processMessagesZkeyPathNonQv,
  tallyVotesZkeyPathNonQv,
  pollWasm,
  pollWitgen,
  rapidsnark,
  pollJoinedWitgen,
  pollJoinedWasm,
} from "./constants";

jest.unmock("maci-contracts/typechain-types");

describe("Integration messages", () => {
  let app: INestApplication;
  let circuitInputs: Record<string, string>;
  let stateLeafIndex: number;
  let maciContractAddress: string;

  const coordinatorKeypair = new Keypair();
  const user = new Keypair();

  beforeAll(async () => {
    const [signer] = await hardhat.ethers.getSigners();

    const vkRegistry = await deployVkRegistryContract({ signer });
    await setVerifyingKeys({
      quiet: true,
      vkRegistry,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      processMessagesZkeyPathNonQv,
      tallyVotesZkeyPathNonQv,
      pollJoiningZkeyPath: pollJoiningZkey,
      pollJoinedZkeyPath: pollJoinedZkey,
      useQuadraticVoting: false,
      signer,
    });

    const maciAddresses = await deploy({ stateTreeDepth: 10, signer });

    maciContractAddress = maciAddresses.maciAddress;

    await deployPoll({
      pollDuration: 30,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
      useQuadraticVoting: false,
      signer,
    });

    await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });

    const { pollStateIndex, timestamp, voiceCredits } = await joinPoll({
      maciAddress: maciAddresses.maciAddress,
      pollId: 0n,
      privateKey: user.privKey.serialize(),
      stateIndex: 1n,
      pollJoiningZkey,
      pollWasm,
      pollWitgen,
      rapidsnark,
      signer,
      useWasm: true,
      quiet: true,
    });

    const maciState = await genMaciStateFromContract(
      signer.provider,
      maciAddresses.maciAddress,
      coordinatorKeypair,
      0n,
    );

    const poll = maciState.polls.get(0n);

    poll!.updatePoll(BigInt(maciState.pubKeys.length));

    stateLeafIndex = Number(pollStateIndex);

    circuitInputs = poll!.joinedCircuitInputs({
      maciPrivKey: user.privKey,
      stateLeafIndex: BigInt(pollStateIndex),
      voiceCreditsBalance: BigInt(voiceCredits),
      joinTimestamp: BigInt(timestamp),
    }) as unknown as typeof circuitInputs;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/v1/messages/publish", () => {
    const keypair = new Keypair();

    const defaultSaveMessagesArgs = {
      maciContractAddress,
      poll: 0,
      stateLeafIndex,
      messages: [
        {
          data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
          publicKey: keypair.pubKey.serialize(),
        },
      ],
    };

    test("should throw an error if there is no valid proof", async () => {
      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
          ...defaultSaveMessagesArgs,
          maciContractAddress,
          stateLeafIndex,
          poll: 0,
          proof: ["0", "0", "0", "0", "0", "0", "0", "0"],
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(result.body).toStrictEqual({
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
      });
    });

    test("should throw an error if dto is invalid", async () => {
      const { proof } = await genProof({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        useWasm: true,
        rapidsnarkExePath: rapidsnark,
        witnessExePath: pollJoinedWitgen,
        wasmPath: pollJoinedWasm,
      });

      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
          stateLeafIndex,
          proof: formatProofForVerifierContract(proof),
          maciContractAddress: "invalid",
          poll: "-1",
          messages: [],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "poll must not be less than 0",
          "poll must be an integer number",
          "maciContractAddress must be an Ethereum address",
          "messages must contain at least 1 elements",
        ],
      });
    });

    test("should throw an error if messages dto is invalid", async () => {
      const { proof } = await genProof({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        useWasm: true,
        rapidsnarkExePath: rapidsnark,
        witnessExePath: pollJoinedWitgen,
        wasmPath: pollJoinedWasm,
      });

      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
          ...defaultSaveMessagesArgs,
          maciContractAddress,
          stateLeafIndex,
          proof: formatProofForVerifierContract(proof),
          messages: [{ data: [], publicKey: "invalid" }],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["messages.0.data must contain at least 10 elements", "messages.0.Public key (invalid) is invalid"],
      });
    });

    test("should publish user messages properly", async () => {
      const { proof } = await genProof({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        useWasm: true,
        rapidsnarkExePath: rapidsnark,
        witnessExePath: pollJoinedWitgen,
        wasmPath: pollJoinedWasm,
      });

      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
          ...defaultSaveMessagesArgs,
          maciContractAddress,
          stateLeafIndex,
          proof: formatProofForVerifierContract(proof),
        })
        .expect(HttpStatus.CREATED);

      expect(result.status).toBe(HttpStatus.CREATED);
    });
  });
});
