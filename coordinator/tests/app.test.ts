import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import type { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";

import { AppModule } from "../ts/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  test("should get index page properly (/ GET)", () =>
    request(app.getHttpServer() as App)
      .get("/")
      .expect(200)
      .expect("Hello World!"));
});
