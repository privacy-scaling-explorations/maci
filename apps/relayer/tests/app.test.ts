import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import type { TApp } from "./constants.js";

import { AppModule } from "../ts/app.module.js";

describe("Integration", () => {
  let app: INestApplication<TApp>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
  });

  test("should throw an error if api is not found", async () => {
    const result = await request(app.getHttpServer()).get("/unknown").send().expect(404);

    expect(result.body).toStrictEqual({
      error: "Not Found",
      statusCode: HttpStatus.NOT_FOUND,
      message: "Cannot GET /unknown",
    });
  });

  test("should check health properly", async () => {
    await request(app.getHttpServer()).get("/v1/health/check").send().expect(200);
  });
});
