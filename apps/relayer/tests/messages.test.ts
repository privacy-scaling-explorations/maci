import { jest } from "@jest/globals";
import { Keypair } from "@maci-protocol/domainobjs";
import { formatProofForVerifierContract, generateProofSnarkjs } from "@maci-protocol/sdk";
import { TestingClass } from "@maci-protocol/testing";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

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

describe("Integration messages", () => {
  let app: INestApplication<TApp>;
  let circuitInputs: Record<string, string>;
  let stateLeafIndex: number;
  let maciContractAddress: string;

  beforeAll(async () => {
    await TestingClass.sleep(10_000);
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
    await app.listen(3002);
  });

  afterAll(async () => {
    TestingClass.clean();
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
          publicKey: keypair.publicKey.serialize(),
        },
      ],
    };

    test("should throw an error if there is no valid proof", async () => {
      const result = await request(app.getHttpServer())
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
      const { proof } = await generateProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        wasmPath: pollJoinedWasm,
      });

      const result = await request(app.getHttpServer())
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
      const { proof } = await generateProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        wasmPath: pollJoinedWasm,
      });

      const result = await request(app.getHttpServer())
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
        message: ["messages.0.data must contain at least 10 elements", "messages.0.Public key is invalid"],
      });
    });

    test("should publish user messages properly", async () => {
      const { proof } = await generateProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
        wasmPath: pollJoinedWasm,
      });

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
    });
  });
});
