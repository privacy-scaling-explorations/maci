import { jest } from "@jest/globals";
import { Keypair } from "@maci-protocol/domainobjs";
import {
  formatProofForVerifierContract,
  generateProofSnarkjs,
  getDefaultSigner,
  getPollContracts,
} from "@maci-protocol/sdk";
import { TestingClass } from "@maci-protocol/testing";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { Test } from "@nestjs/testing";
import request from "supertest";

import type { JsonRpcProvider } from "ethers";

import { AppModule } from "../ts/app.module.js";

import {
  pollJoinedWasm,
  pollJoinedZkey,
  pollJoiningWasm,
  type TApp,
  voteTallyZkeyPathNonQv,
  pollJoiningZkey,
  messageProcessorZkeyPathNonQv,
  pollWitnessGenerator,
  rapidsnark,
} from "./constants.js";

jest.unmock("@maci-protocol/sdk");

describe("Integration message publishing", () => {
  let app: INestApplication<TApp>;
  let circuitInputs: Record<string, string>;
  let stateLeafIndex: number;
  let maciContractAddress: string;
  let schedulerRegistry: SchedulerRegistry;

  beforeAll(async () => {
    await TestingClass.sleep(20_000);
    const testDeploy = await TestingClass.getInstance({
      pollJoiningZkeyPath: pollJoiningZkey,
      pollJoinedZkeyPath: pollJoinedZkey,
      messageProcessorZkeyPath: messageProcessorZkeyPathNonQv,
      voteTallyZkeyPath: voteTallyZkeyPathNonQv,
      pollJoiningWasm,
      pollWitnessGenerator,
      rapidsnark,
    });
    const poll = testDeploy.contractsData.maciState!.polls.get(0n);

    poll!.updatePoll(BigInt(testDeploy.contractsData.maciState!.publicKeys.length));

    const [user] = testDeploy.contractsData.users!;

    stateLeafIndex = Number(user.stateLeafIndex);

    maciContractAddress = testDeploy.contractsData.maciContractAddress!;

    circuitInputs = poll!.joinedCircuitInputs({
      maciPrivateKey: user.keypair.privateKey,
      stateLeafIndex: user.stateLeafIndex!,
      voiceCreditsBalance: user.voiceCreditBalance,
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
    jest.restoreAllMocks();
    TestingClass.clean();
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
          publicKey: keypair.publicKey.serialize(),
        },
      ],
    };

    const { proof } = await generateProofSnarkjs({
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

    const { poll: pollContract } = await getPollContracts({ maciAddress: maciContractAddress, pollId: 0, signer });

    await Promise.race([
      new Promise((resolve) => {
        pollContract.once(pollContract.filters.IpfsHashAdded(), (ipfsHash: string) => {
          expect(ipfsHash).toBeDefined();
          resolve(true);
        });
      }),
      TestingClass.sleep(30_000).then(() => {
        throw new Error("Timeout error");
      }),
    ]);
  });
});
