import { Keypair } from "@maci-protocol/domainobjs";
import { joinPoll, signup, sleep } from "@maci-protocol/sdk";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import dotenv from "dotenv";
import { type Signer } from "ethers";
import { Socket, io } from "socket.io-client";
import { Hex, zeroAddress } from "viem";

import { AppModule } from "../ts/app.module";
import { ESupportedNetworks, getSigner } from "../ts/common";
import { getPublicClient } from "../ts/common/accountAbstraction";
import {
  coordinatorMACIKeyPair,
  pollStartDateExtraSeconds,
  testMaciDeploymentConfig,
  testPollDeploymentConfig,
} from "../ts/deployer/__tests__/utils";
import { DeployerModule } from "../ts/deployer/deployer.module";
import { IDeployMaciArgs, IDeployPollArgs } from "../ts/deployer/types";
import { FileModule } from "../ts/file/file.module";
import { IGetPublicKeyData } from "../ts/file/types";
import { ProofModule } from "../ts/proof/proof.module";
import { IGenerateArgs, IGenerateData, IMergeArgs, ISubmitProofsArgs } from "../ts/proof/types";
import { generateApproval, getKernelAccount } from "../ts/sessionKeys/__tests__/utils";
import { SessionKeysModule } from "../ts/sessionKeys/sessionKeys.module";
import { IGenerateSessionKeyReturn } from "../ts/sessionKeys/types";
import { IDeploySubgraphArgs } from "../ts/subgraph/types";

import {
  pollJoiningTestZkeyPath,
  testPollJoiningWasmPath,
  testPollJoiningWitnessPath,
  testRapidsnarkPath,
  zeroUint256Encoded,
} from "./constants";
import { encryptWithCoordinatorRSAPubKey, getAuthorizationHeader, rechargeGasIfNeeded } from "./utils";

dotenv.config();

jest.setTimeout(400000); // Sets timeout to 400 seconds

const TEST_URL = "http://localhost:3000/v1";
const CHAIN = ESupportedNetworks.OPTIMISM_SEPOLIA;
const NUM_USERS = 1;
const voteOptions: Record<string, number> = {
  "0": 0,
  "1": 0,
};

describe("E2E Deployment Tests", () => {
  let signer: Signer;
  let encryptedHeader: string;
  let sessionKeyAddress: Hex;
  let approval: string;

  let app: INestApplication;
  let socket: Socket;
  const publicClient = getPublicClient(CHAIN);

  let maciAddress: Hex;
  let pollId: bigint;

  const pollDuration = 600;

  // set up coordinator address
  beforeAll(async () => {
    signer = getSigner(CHAIN);
    encryptedHeader = await getAuthorizationHeader(signer);
    process.env.COORDINATOR_ADDRESSES = await signer.getAddress();
    await rechargeGasIfNeeded(process.env.COORDINATOR_ADDRESSES as Hex, "0.007", "0.007");
  });

  // set up NestJS app
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, FileModule, DeployerModule, ProofModule, SessionKeysModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
    /*
    const storageInstance = ContractStorage.getInstance(path.join(process.cwd(), "deployed-contracts.json"));
    storageInstance.cleanup(CHAIN);
    */
  });

  // set up auth header in WS connection
  beforeEach(async () => {
    const authorization = await getAuthorizationHeader(signer);

    await new Promise((resolve) => {
      app.getUrl().then((url) => {
        socket = io(url, {
          extraHeaders: {
            authorization,
          },
        });
        socket.on("connect", () => {
          resolve(true);
        });
      });
    });
  });
  afterEach(() => {
    socket.disconnect();
  });

  // run tests
  test("should retrieve RSA public key", async () => {
    const response = await fetch(`${TEST_URL}/proof/publicKey`, {
      method: "GET",
    });
    const body = (await response.json()) as IGetPublicKeyData;
    expect(response.status).toBe(200);
    expect(body.publicKey).toBeDefined();

    // this RSA should be used in the encrypted auth header and the encrypted coordinator maci private key
  });

  test("should retrieve the session key address", async () => {
    const response = await fetch(`${TEST_URL}/session-keys/generate`, {
      method: "GET",
      headers: {
        Authorization: encryptedHeader,
      },
    });
    const body = (await response.json()) as IGenerateSessionKeyReturn;
    expect(response.status).toBe(200);
    expect(body.sessionKeyAddress).not.toBe(zeroAddress);

    // save them for next tests
    sessionKeyAddress = body.sessionKeyAddress;
    approval = await generateApproval(sessionKeyAddress);
    const sessionKeyAccount = await getKernelAccount(sessionKeyAddress);
    await rechargeGasIfNeeded(sessionKeyAccount.address, "0.03", "0.03");
  });

  test("should deploy MACI correctly", async () => {
    const config = testMaciDeploymentConfig;
    config.VkRegistry.args.stateTreeDepth = config.VkRegistry.args.stateTreeDepth.toString();
    config.VkRegistry.args.intStateTreeDepth = config.VkRegistry.args.intStateTreeDepth.toString();
    config.VkRegistry.args.voteOptionTreeDepth = config.VkRegistry.args.voteOptionTreeDepth.toString();
    const response = await fetch(`${TEST_URL}/deploy/maci`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: CHAIN,
        config,
      } as IDeployMaciArgs),
    });
    const body = (await response.json()) as { address: string };

    expect(response.status).toBe(201);
    expect(body.address).not.toBe(zeroAddress);

    // save them for next tests
    maciAddress = body.address as Hex;
  });

  test("should deploy a poll correctly", async () => {
    const config = testPollDeploymentConfig;
    config.voteOptions = config.voteOptions.toString();

    const startDate = Math.floor(Date.now() / 1000) + pollStartDateExtraSeconds;
    config.startDate = startDate;
    config.endDate = startDate + pollDuration;

    const response = await fetch(`${TEST_URL}/deploy/poll`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: CHAIN,
        config,
      } as IDeployPollArgs),
    });
    const body = (await response.json()) as { pollId: string };
    expect(response.status).toBe(201);
    expect(body.pollId).toBeDefined();

    // save them for next tests
    pollId = BigInt(body.pollId);
  });

  test("should allow voting on a poll", async () => {
    await sleep(pollStartDateExtraSeconds * 2000);
    for (let i = 0; i < NUM_USERS; i += 1) {
      const keypairUser = new Keypair();
      const pubkeyUser = keypairUser.pubKey.serialize();
      const privkeyUser = keypairUser.privKey.serialize();

      const vote = i % 2;
      voteOptions[String(vote)] += 1;

      // user signs up to MACI
      // eslint-disable-next-line no-await-in-loop
      await signup({
        maciAddress,
        maciPubKey: pubkeyUser,
        sgData: zeroUint256Encoded,
        signer,
      });

      // user joins the poll
      // eslint-disable-next-line no-await-in-loop
      await joinPoll({
        maciAddress,
        privateKey: privkeyUser,
        stateIndex: 1n,
        pollId: BigInt(pollId),
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        sgDataArg: zeroUint256Encoded,
        ivcpDataArg: zeroUint256Encoded,
        signer,
      });

      /*
      // user publishes a vote
      // eslint-disable-next-line no-await-in-loop
      const publishData = await publish({
        pubkey: pubkeyUser,
        stateIndex: 1n,
        voteOptionIndex: BigInt(vote),
        nonce: 1n,
        pollId: BigInt(pollId),
        newVoteWeight: 1n,
        maciAddress,
        salt: genRandomSalt(),
        privateKey: privkeyUser,
        signer,
      });

      expect(publishData.hash).not.toBe(zeroAddress);
      */
    }
  });

  test.skip("should deploy a subgraph correctly", async () => {
    const blockNumber = Number(await publicClient.getBlockNumber());
    const response = await fetch(`${TEST_URL}/subgraph/deploy`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maciContractAddress: maciAddress,
        startBlock: blockNumber,
        network: CHAIN,
        name: process.env.SUBGRAPH_NAME,
        tag: `v0.0.${blockNumber}`, // different versions per test using block number
      } as IDeploySubgraphArgs),
    });
    const body = (await response.json()) as { url: string };
    const { url } = body;
    const regex = /^https:\/\/api\.studio\.thegraph\.com\/query\/\d+\/maci-subgraph\/v0\.0\.\d+$/;
    expect(response.status).toBe(201);
    expect(body.url).toBeDefined();
    expect(regex.test(url)).toBe(true);
  });

  test("should merge correctly", async () => {
    await sleep(pollDuration * 2000);
    const response = await fetch(`${TEST_URL}/proof/merge`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maciContractAddress: maciAddress,
        pollId: Number(pollId),
        approval,
        sessionKeyAddress,
        chain: CHAIN,
      } as IMergeArgs),
    });

    expect(response.status).toBe(201);
  });

  test("should generate proofs correctly", async () => {
    const blockNumber = await publicClient.getBlockNumber();
    const encryptedCoordinatorPrivKey = await encryptWithCoordinatorRSAPubKey(
      coordinatorMACIKeyPair.privKey.serialize(),
    );

    const response = await fetch(`${TEST_URL}/proof/generate`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        poll: Number(pollId),
        maciContractAddress: maciAddress,
        useQuadraticVoting: testPollDeploymentConfig.useQuadraticVoting,
        encryptedCoordinatorPrivateKey: encryptedCoordinatorPrivKey,
        startBlock: Number(blockNumber) - 100,
        endBlock: Number(blockNumber) + 100,
        blocksPerBatch: 20,
        approval,
        sessionKeyAddress,
        chain: CHAIN,
      } as IGenerateArgs),
    });
    const body = (await response.json()) as IGenerateData;

    expect(response.status).toBe(201);
    expect(body.processProofs).toBeDefined();
    expect(body.processProofs.length).toBeGreaterThan(0);
    expect(body.tallyProofs).toBeDefined();
    expect(body.tallyProofs.length).toBeGreaterThan(0);
    expect(body.tallyData).toBeDefined();
    expect(body.tallyData.results).toBeDefined();
  });

  test("should submit results on-chain correctly", async () => {
    const response = await fetch(`${TEST_URL}/proof/submit`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pollId: Number(pollId),
        maciContractAddress: maciAddress,
        approval,
        sessionKeyAddress,
        chain: CHAIN,
      } as ISubmitProofsArgs),
    });

    expect(response.status).toBe(201);
  });
});
