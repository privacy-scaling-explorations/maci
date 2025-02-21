import { jest } from "@jest/globals";
import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Keypair } from "maci-domainobjs";
import { formatProofForVerifierContract, genProofSnarkjs } from "maci-sdk";
import { TestDeploy } from "maci-testing";
import request from "supertest";

import { AppModule } from "../ts/app.module.js";

import { pollJoinedWasm, pollJoinedZkey, type TApp } from "./constants.js";

jest.unmock("maci-sdk");

describe("Integration message batches", () => {
  let app: INestApplication<TApp>;
  let stateLeafIndex: number;
  let maciContractAddress: string;
  let user: Keypair;

  beforeAll(async () => {
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

    await request(app.getHttpServer())
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
      const result = await request(app.getHttpServer())
        .get("/v1/messageBatches/get")
        .send({
          limit: 0,
          skip: -1,
          poll: -1,
          maciContractAddress: "invalid",
          publicKeys: ["invalid"],
          ipfsHashes: ["invalid1", "invalid2"],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(result.body).toStrictEqual({
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "limit must be a positive number",
          "skip must not be less than 0",
          "poll must not be less than 0",
          "maciContractAddress must be an Ethereum address",
          "IPFS hash is invalid",
          "Public key is invalid",
        ],
      });
    });

    test("should get message batches properly", async () => {
      const result = await request(app.getHttpServer())
        .get("/v1/messageBatches/get")
        .send({
          limit: 10,
          skip: 0,
          poll: 0,
          maciContractAddress,
          publicKeys: [user!.pubKey.serialize()],
        })
        .expect(HttpStatus.OK);

      expect(result.status).toBe(HttpStatus.OK);
    });
  });
});
