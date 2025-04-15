import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";

import { HealthController } from "../health.controller.js";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = app.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/health/check", () => {
    test("should check properly", () => {
      const isRunning = controller.check();

      expect(isRunning).toBe(true);
    });
  });
});
