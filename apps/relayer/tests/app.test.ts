import { HttpStatus, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

describe("e2e", () => {
  let app: INestApplication;

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
    const result = await request(app.getHttpServer() as App)
      .get("/unknown")
      .send()
      .expect(404);

    expect(result.body).toStrictEqual({
      error: "Not Found",
      statusCode: HttpStatus.NOT_FOUND,
      message: "Cannot GET /unknown",
    });
  });
});
