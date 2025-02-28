// To only run this file: pnpm exec jest --testPathPattern=tests/e2e.deploy.test.ts

import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import dotenv from "dotenv";
import { type Signer } from "ethers";
import hardhat from "hardhat";
import { Keypair } from "maci-domainobjs";
import { signup } from "maci-sdk";
import { Socket, io } from "socket.io-client";
import { Hex, zeroAddress } from "viem";

import { AppModule } from "../ts/app.module";
import { ESupportedNetworks } from "../ts/common";
import { getPublicClient } from "../ts/common/accountAbstraction";
import { testMaciDeploymentConfig, testPollDeploymentConfig } from "../ts/deployer/__tests__/utils";
import { IDeployMaciArgs, IDeployPollArgs } from "../ts/deployer/types";
import { FileModule } from "../ts/file/file.module";
import { generateApproval, getKernelAccount } from "../ts/sessionKeys/__tests__/utils";
import { IGenerateSessionKeyReturn } from "../ts/sessionKeys/types";
import { IDeploySubgraphArgs } from "../ts/subgraph/types";

import { zeroUint256Encoded } from "./constants";
import { getAuthorizationHeader, rechargeGasIfNeeded } from "./utils";

dotenv.config();

const LOCALHOST = "http://localhost:3000";
const NUM_USERS = 3;

describe("E2E Deployment Tests", () => {
  let signer: Signer;
  let encryptedHeader: string;
  let coordinatorKeypair: Keypair;
  let sessionKeyAddress: Hex;
  let approval: string;

  let app: INestApplication;
  let socket: Socket;
  const publicClient = getPublicClient(ESupportedNetworks.OPTIMISM_SEPOLIA);

  let maciAddress: Hex;

  // set up coordinator address
  beforeAll(async () => {
    [signer] = await hardhat.ethers.getSigners();
    encryptedHeader = await getAuthorizationHeader(signer);
    coordinatorKeypair = new Keypair();
    process.env.COORDINATOR_ADDRESSES = await signer.getAddress();
    await rechargeGasIfNeeded(process.env.COORDINATOR_ADDRESSES as Hex, "0.007", "0.007");
  });

  // set up NestJS app
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule, FileModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await app.listen(3000);
  });
  afterAll(async () => {
    await app.close();
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
  test("should retrieve the session key address", async () => {
    const response = await fetch(`${LOCALHOST}/v1/session-keys/generate`, {
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
    const response = await fetch(`${LOCALHOST}/v1/deploy/maci`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        approval,
        sessionKeyAddress,
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
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
    config.coordinatorPubkey = coordinatorKeypair.pubKey.serialize();
    config.voteOptions = config.voteOptions.toString();
    const response = await fetch(`${LOCALHOST}/v1/deploy/poll`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        approval,
        sessionKeyAddress,
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        config,
      } as IDeployPollArgs),
    });
    const body = (await response.json()) as { pollId: string };
    expect(response.status).toBe(201);
    expect(body.pollId).toBeDefined();
  });

  test("should deploy a subgraph correctly", async () => {
    const blockNumber = Number(await publicClient.getBlockNumber());
    const response = await fetch(`${LOCALHOST}/v1/subgraph/deploy`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maciContractAddress: maciAddress,
        startBlock: blockNumber,
        network: ESupportedNetworks.OPTIMISM_SEPOLIA,
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

  test("should allow voting on a poll", async () => {
    for (let i = 0; i < NUM_USERS; i += 1) {
      const keypairUser = new Keypair();
      const pubkeyUser = keypairUser.pubKey.serialize();
      // make users sign up to MACI
      // eslint-disable-next-line no-await-in-loop
      await signup({
        maciAddress,
        maciPubKey: pubkeyUser,
        sgData: zeroUint256Encoded,
        signer,
      });
    }
  });
});
