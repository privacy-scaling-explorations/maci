import { zeroAddress } from "viem";

import { FileService } from "../../file/file.service";
import { RedisService } from "../../redis/redis.service";
import { HealthController } from "../health.controller";
import { HealthService } from "../health.service";

describe("HealthController", () => {
  const redisService = new RedisService();
  const healthController = new HealthController(new HealthService(new FileService(), redisService));

  beforeAll(async () => {
    await redisService.onModuleInit();
  });

  describe("v1/health/check", () => {
    it("should return health check response", async () => {
      const { rapidsnark, zkeysDirectory, coordinatorWalletFunds, isRedisOpen } = await healthController.check();

      const { availableZkeys } = zkeysDirectory;

      const allZkeysAreSet = Object.values(availableZkeys).reduce((acc, zkey) => acc && typeof zkey === "object", true);

      expect(rapidsnark.rapidsnarkExecutablePath).toBe(process.env.COORDINATOR_RAPIDSNARK_EXE);
      expect(rapidsnark.rapidsnarkIsAccessible).toBe(true);
      expect(rapidsnark.rapidsnarkIsExecutable).toBe(true);

      expect(zkeysDirectory.zkeysDirectoryExists).toBe(true);
      expect(allZkeysAreSet).toBe(true);

      expect(coordinatorWalletFunds.address).toBeDefined();
      expect(coordinatorWalletFunds.address).not.toBe(zeroAddress);

      expect(isRedisOpen).toBe(true);
    });
  });
});
