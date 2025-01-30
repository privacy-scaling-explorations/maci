import { jest } from "@jest/globals";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Keypair } from "maci-domainobjs";
import { formatProofForVerifierContract, genProofSnarkjs } from "maci-sdk";
import request from "supertest";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

import { pollJoinedWasm, pollJoinedZkey } from "./constants";

jest.unmock("maci-contracts/typechain-types");

describe("Integration messages", () => {
  let app: INestApplication;
  let circuitInputs: Record<string, string>;
  let stateLeafIndex: number;
  let maciContractAddress: string;

  beforeAll(async () => {
    const { TestDeploy } = await import("./deploy");
    await TestDeploy.sleep(5_000);
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
    await app.listen(3002);
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
      const { proof } = await genProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
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
      const { proof } = await genProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
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
      const { proof } = await genProofSnarkjs({
        inputs: circuitInputs,
        zkeyPath: pollJoinedZkey,
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
