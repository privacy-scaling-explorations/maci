import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getBytes, hashMessage, type Signer } from "ethers";
import hardhat from "hardhat";
import {
  type DeployedContracts,
  type PollContracts,
  deploy,
  deployPoll,
  deployVkRegistryContract,
  setVerifyingKeys,
  signup,
  publish,
  timeTravel,
  mergeMessages,
  mergeSignups,
} from "maci-cli";
import { Keypair } from "maci-domainobjs";
import request from "supertest";

import fs from "fs";
import path from "path";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";
import { CryptoService } from "../ts/crypto/crypto.service";

const STATE_TREE_DEPTH = 10;
const INT_STATE_TREE_DEPTH = 1;
const MSG_TREE_DEPTH = 2;
const VOTE_OPTION_TREE_DEPTH = 2;
const MSG_BATCH_DEPTH = 1;

describe("AppController (e2e)", () => {
  const coordinatorKeypair = new Keypair();
  let app: INestApplication;
  let signer: Signer;
  let maciAddresses: DeployedContracts;
  let pollContracts: PollContracts;

  const getAuthorizationHeader = async () => {
    const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
    const signature = await signer.signMessage("message");
    const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
    return CryptoService.getInstance().encrypt(publicKey, `${signature}:${digest}`);
  };

  beforeAll(async () => {
    [signer] = await hardhat.ethers.getSigners();

    process.env.COORDINATOR_ADDRESS = await signer.getAddress();

    await deployVkRegistryContract({ signer });
    await setVerifyingKeys({
      quiet: true,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchDepth: MSG_BATCH_DEPTH,
      processMessagesZkeyPathNonQv: path.resolve(
        __dirname,
        "../zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey",
      ),
      tallyVotesZkeyPathNonQv: path.resolve(
        __dirname,
        "../zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey",
      ),
      useQuadraticVoting: false,
      signer,
    });

    maciAddresses = await deploy({ stateTreeDepth: 10, signer });

    pollContracts = await deployPoll({
      pollDuration: 30,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeSubDepth: MSG_BATCH_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
      useQuadraticVoting: false,
      signer,
    });
  });

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  describe("validation /v1/proof/generate POST", () => {
    beforeAll(async () => {
      const user = new Keypair();

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      await publish({
        pubkey: user.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: 0n,
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    test("should throw an error if poll id is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: "-1",
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if encrypted key is invalid", async () => {
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: "0",
          encryptedCoordinatorPrivateKey: "",
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if maci address is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: "0",
          encryptedCoordinatorPrivateKey,
          maciContractAddress: "wrong",
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if tally address is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: "0",
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: "invalid",
          useQuadraticVoting: false,
        })
        .expect(400);
    });
  });

  describe("/v1/proof/generate POST", () => {
    beforeAll(async () => {
      const user = new Keypair();

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      await publish({
        pubkey: user.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: 0n,
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    test("should throw an error if poll is not over", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if messages are not merged", async () => {
      await timeTravel({ seconds: 30, signer });

      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if signups are not merged", async () => {
      await mergeMessages({ pollId: 0n, signer });

      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if coordinator key decryption is failed", async () => {
      await mergeMessages({ pollId: 0n, signer });

      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if there is no such poll", async () => {
      await mergeMessages({ pollId: 0n, signer });

      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 9000,
          encryptedCoordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);
    });

    test("should throw an error if there is no authorization header", async () => {
      await mergeMessages({ pollId: 0n, signer });

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(403);
    });

    test("should generate proofs properly", async () => {
      await mergeSignups({ pollId: 0n, signer });

      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = CryptoService.getInstance().encrypt(
        publicKey,
        coordinatorKeypair.privKey.serialize(),
      );
      const encryptedHeader = await getAuthorizationHeader();

      await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(201);

      const proofData = await Promise.all([
        fs.promises.readFile("./proofs/process_0.json"),
        fs.promises.readFile("./proofs/tally_0.json"),
        fs.promises.readFile("./tally.json"),
      ])
        .then((files) => files.map((item) => JSON.parse(item.toString()) as Record<string, unknown>))
        .then((data) => ({
          processProofs: [data[0]],
          tallyProofs: [data[1]],
          tallyData: [data[2]],
        }));

      expect(proofData.processProofs).toHaveLength(1);
      expect(proofData.tallyData).toHaveLength(1);
      expect(proofData.tallyData).toBeDefined();
    });
  });
});
