import { jest } from "@jest/globals";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Test } from "@nestjs/testing";
import { Keypair } from "maci-domainobjs";
import { formatProofForVerifierContract, genProofSnarkjs, getDefaultSigner, getPollContracts } from "maci-sdk";
import request from "supertest";

import type { JsonRpcProvider } from "ethers";

import { AppModule } from "../ts/app.module.js";

import { pollJoinedWasm, pollJoinedZkey, type TApp } from "./constants.js";

jest.unmock("maci-sdk");

describe("Integration message publishing", () => {
  let app: INestApplication<TApp>;
  let circuitInputs: Record<string, string>;
  let stateLeafIndex: number;
  let maciContractAddress: string;
  let schedulerRegistry: SchedulerRegistry;

  beforeAll(async () => {
    const { TestDeploy } = await import("./deploy.js");
    await TestDeploy.sleep(20_000);
    const testDeploy = await TestDeploy.getInstance();
    const poll = testDeploy.contractsData.maciState!.polls.get(0n);

    poll!.updatePoll(BigInt(testDeploy.contractsData.maciState!.pubKeys.length));

    stateLeafIndex = Number(testDeploy.contractsData.stateLeafIndex);

    maciContractAddress = testDeploy.contractsData.maciContractAddress!;

    circuitInputs = poll!.joinedCircuitInputs({
      maciPrivKey: testDeploy.contractsData.user!.privKey,
      stateLeafIndex: BigInt(testDeploy.contractsData.stateLeafIndex!),
      voiceCreditsBalance: BigInt(testDeploy.contractsData.voiceCredits!),
      joinTimestamp: BigInt(testDeploy.contractsData.timestamp!),
    }) as unknown as typeof circuitInputs;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3003);

    schedulerRegistry = moduleFixture.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterAll(async () => {
    const { TestDeploy } = await import("./deploy.js");

    jest.restoreAllMocks();
    TestDeploy.clean();
    await app.close();
  });

  test("should publish user messages properly", async () => {
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

    const { proof } = await genProofSnarkjs({
      inputs: circuitInputs,
      zkeyPath: pollJoinedZkey,
      wasmPath: pollJoinedWasm,
    });

    const cronJob = schedulerRegistry.getCronJob("publishMessages");
    expect(cronJob).toBeDefined();

    const result = await request(app.getHttpServer())
      .post("/v1/messages/publish")
      .send({
        ...defaultSaveMessagesArgs,
        maciContractAddress,
        stateLeafIndex,
        proof: formatProofForVerifierContract(proof),
      })
      .expect(HttpStatus.CREATED);

    expect(result.status).toBe(HttpStatus.CREATED);

    cronJob.fireOnTick();

    const signer = await getDefaultSigner();
    await (signer.provider as unknown as JsonRpcProvider).send("evm_increaseTime", [100]);
    await (signer.provider as unknown as JsonRpcProvider).send("evm_mine", []);

    const { TestDeploy } = await import("./deploy.js");
    const { poll: pollContract } = await getPollContracts({ maciAddress: maciContractAddress, pollId: 0, signer });

    await Promise.race([
      new Promise((resolve) => {
        pollContract.once(pollContract.filters.IpfsHashAdded(), (ipfsHash: string) => {
          expect(ipfsHash).toBeDefined();
          resolve(true);
        });
      }),
      TestDeploy.sleep(30_000).then(() => {
        throw new Error("Timeout error");
      }),
    ]);
  });
});
