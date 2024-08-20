import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
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
  mergeSignups,
  joinPoll,
} from "maci-cli";
import { Keypair } from "maci-domainobjs";
import request from "supertest";

import fs from "fs";
import { homedir } from "os";
import path from "path";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";
import { ErrorCodes } from "../ts/common";
import { CryptoService } from "../ts/crypto/crypto.service";
import { FileModule } from "../ts/file/file.module";

const STATE_TREE_DEPTH = 10;
const INT_STATE_TREE_DEPTH = 1;
const VOTE_OPTION_TREE_DEPTH = 2;
const MESSAGE_BATCH_SIZE = 20;

describe("AppController (e2e)", () => {
  const coordinatorKeypair = new Keypair();
  let app: INestApplication;
  let signer: Signer;
  let maciAddresses: DeployedContracts;
  let pollContracts: PollContracts;

  const cryptoService = new CryptoService();

  const getAuthorizationHeader = async () => {
    const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
    const signature = await signer.signMessage("message");
    const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
    return `Bearer ${cryptoService.encrypt(publicKey, `${signature}:${digest}`)}`;
  };

  beforeAll(async () => {
    [signer] = await hardhat.ethers.getSigners();

    process.env.COORDINATOR_ADDRESSES = await signer.getAddress();

    await deployVkRegistryContract({ signer });
    await setVerifyingKeys({
      quiet: true,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      pollJoiningZkeyPath: path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey"),
      processMessagesZkeyPathNonQv: path.resolve(
        __dirname,
        "../zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test.0.zkey",
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
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
      useQuadraticVoting: false,
      signer,
    });
  });

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, FileModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  describe("validation /v1/proof/generate POST", () => {
    beforeAll(async () => {
      const user = new Keypair();
      const pollKeys = new Keypair();

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        pollPrivKey: pollKeys.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey"),
        useWasm: true,
        pollWasm: path.resolve(
          __dirname,
          "../zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
        ),
        pollWitgen: path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test"),
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        signer,
        newVoiceCreditBalance: 10n,
        quiet: true,
      });
      await publish({
        pubkey: pollKeys.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: 0n,
        privateKey: pollKeys.privKey.serialize(),
        signer,
      });
    });

    test("should throw an error if poll id is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
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

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["poll must not be less than 0", "poll must be an integer number"],
      });
    });

    test("should throw an error if encrypted key is invalid", async () => {
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey: "",
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["encryptedCoordinatorPrivateKey must be longer than or equal to 1 characters"],
      });
    });

    test("should throw an error if maci address is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: "wrong",
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["maciContractAddress must be an Ethereum address"],
      });
    });

    test("should throw an error if tally address is invalid", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey,
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: "invalid",
          useQuadraticVoting: false,
        })
        .expect(400);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["tallyContractAddress must be an Ethereum address"],
      });
    });
  });

  describe("/v1/proof/publicKey GET", () => {
    test("should get public key properly", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);

      const result = await request(app.getHttpServer() as App)
        .get("/v1/proof/publicKey")
        .expect(200);

      expect(result.body).toStrictEqual({ publicKey: publicKey.toString() });
    });
  });

  describe("/v1/proof/generate POST", () => {
    beforeAll(async () => {
      const user = new Keypair();
      const pollKeys = new Keypair();

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        pollPrivKey: pollKeys.privKey.serialize(),
        stateIndex: 2n,
        pollId: 0n,
        pollJoiningZkey: path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey"),
        useWasm: true,
        pollWasm: path.resolve(
          __dirname,
          "../zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
        ),
        pollWitgen: path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test"),
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        signer,
        newVoiceCreditBalance: 10n,
        quiet: true,
      });
      await publish({
        pubkey: pollKeys.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: 0n,
        privateKey: pollKeys.privKey.serialize(),
        signer,
      });
    });

    test("should throw an error if poll is not over", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
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

      expect(result.body).toStrictEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ErrorCodes.NOT_MERGED_STATE_TREE,
      });
    });

    test("should throw an error if signups are not merged", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
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

      expect(result.body).toStrictEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ErrorCodes.NOT_MERGED_STATE_TREE,
      });
    });

    test("should throw an error if coordinator key decryption is failed", async () => {
      await timeTravel({ seconds: 30, signer });
      await mergeSignups({ pollId: 0n, signer });

      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
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

      expect(result.body).toStrictEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ErrorCodes.DECRYPTION,
      });
    });

    test("should throw an error if there is no such poll", async () => {
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
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

      expect(result.body).toStrictEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ErrorCodes.POLL_NOT_FOUND,
      });
    });

    test("should throw an error if there is no authorization header", async () => {
      const result = await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(403);

      expect(result.body).toStrictEqual({
        error: "Forbidden",
        message: "Forbidden resource",
        statusCode: HttpStatus.FORBIDDEN,
      });
    });

    test("should throw error if coordinator key cannot be decrypted", async () => {
      const encryptedHeader = await getAuthorizationHeader();

      const result = await request(app.getHttpServer() as App)
        .post("/v1/proof/generate")
        .set("Authorization", encryptedHeader)
        .send({
          poll: 0,
          encryptedCoordinatorPrivateKey: "unknown",
          maciContractAddress: maciAddresses.maciAddress,
          tallyContractAddress: pollContracts.tally,
          useQuadraticVoting: false,
        })
        .expect(400);

      expect(result.body).toStrictEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ErrorCodes.DECRYPTION,
      });
    });

    test("should generate proofs properly", async () => {
      const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
      const encryptedCoordinatorPrivateKey = cryptoService.encrypt(publicKey, coordinatorKeypair.privKey.serialize());
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
