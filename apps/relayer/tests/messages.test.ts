import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";
import request from "supertest";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

describe("Integration messages", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/v1/messages/publish", () => {
    const keypair = new Keypair();

    const defaultSaveMessagesArgs = {
      maciContractAddress: ZeroAddress,
      poll: 0,
      messages: [
        {
          data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
          publicKey: keypair.pubKey.serialize(),
        },
      ],
    };

    test("should throw an error if dto is invalid", async () => {
      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
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
      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send({
          ...defaultSaveMessagesArgs,
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
      const result = await request(app.getHttpServer() as App)
        .post("/v1/messages/publish")
        .send(defaultSaveMessagesArgs)
        .expect(HttpStatus.CREATED);

      expect(result.status).toBe(HttpStatus.CREATED);
    });
  });
});
