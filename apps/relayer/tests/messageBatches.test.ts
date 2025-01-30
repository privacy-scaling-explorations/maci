import { jest } from "@jest/globals";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { formatProofForVerifierContract, genProofSnarkjs } from "maci-contracts";
import { Keypair } from "maci-domainobjs";
import request from "supertest";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

import { pollJoinedWasm, pollJoinedZkey } from "./constants";

jest.unmock("maci-contracts/typechain-types");

describe("Integration message batches", () => {
  let app: INestApplication;
  let stateLeafIndex: number;
  let maciContractAddress: string;
  let user: Keypair;

  beforeAll(async () => {
    const { TestDeploy } = await import("./deploy");
    await TestDeploy.sleep(1_000);
    const testDeploy = await TestDeploy.getInstance();
    const poll = testDeploy.contractsData.maciState!.polls.get(0n);

    poll!.updatePoll(BigInt(testDeploy.contractsData.maciState!.pubKeys.length));

    stateLeafIndex = Number(testDeploy.contractsData.stateLeafIndex);
    maciContractAddress = testDeploy.contractsData.maciContractAddress!;
    user = testDeploy.contractsData.user!;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3001);

    const circuitInputs = poll!.joinedCircuitInputs({
      maciPrivKey: testDeploy.contractsData.user!.privKey,
      stateLeafIndex: BigInt(testDeploy.contractsData.stateLeafIndex!),
      voiceCreditsBalance: BigInt(testDeploy.contractsData.voiceCredits!),
      joinTimestamp: BigInt(testDeploy.contractsData.timestamp!),
    });

    const { proof } = await genProofSnarkjs({
      inputs: circuitInputs as unknown as Record<string, bigint>,
      zkeyPath: pollJoinedZkey,
      wasmPath: pollJoinedWasm,
    });

    const keypair = new Keypair();

    await request(app.getHttpServer() as App)
      .post("/v1/messages/publish")
      .send({
        messages: [
          {
            data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
            publicKey: keypair.pubKey.serialize(),
          },
        ],
        poll: 0,
        maciContractAddress,
        stateLeafIndex,
        proof: formatProofForVerifierContract(proof),
      })
      .expect(HttpStatus.CREATED);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/v1/messageBatches/get", () => {
    test("should throw an error if dto is invalid", async () => {
      const result = await request(app.getHttpServer() as App)
        .get("/v1/messageBatches/get")
        .send({
          limit: 0,
          poll: -1,
          maciContractAddress: "invalid",
          publicKey: "invalid",
          ipfsHashes: ["invalid1", "invalid2"],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "limit must be a positive number",
          "poll must not be less than 0",
          "maciContractAddress must be an Ethereum address",
          "IPFS hash is invalid",
          "Public key (invalid) is invalid",
        ],
      });
    });

    test("should get message batches properly", async () => {
      const result = await request(app.getHttpServer() as App)
        .get("/v1/messageBatches/get")
        .send({
          limit: 10,
          poll: 0,
          maciContractAddress,
          publicKey: user!.pubKey.serialize(),
        })
        .expect(HttpStatus.OK);

      expect(result.status).toBe(HttpStatus.OK);
    });
  });
});
