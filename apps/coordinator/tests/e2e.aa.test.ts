import { sleep } from "@maci-protocol/sdk";
import { Hex, zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../ts/common";
import { testMaciDeploymentConfig, testPollDeploymentConfig } from "../ts/deployer/__tests__/utils";
import { DeployerService } from "../ts/deployer/deployer.service";
import { FileService } from "../ts/file/file.service";
import { ProofGeneratorService } from "../ts/proof/proof.service";
import { ENTRY_POINT, generateApproval, KERNEL_VERSION } from "../ts/sessionKeys/__tests__/utils";
import { SessionKeysService } from "../ts/sessionKeys/sessionKeys.service";

describe("E2E Account Abstraction Tests", () => {
  const fileService = new FileService();
  const sessionKeyService = new SessionKeysService(fileService);
  const proofService = new ProofGeneratorService(fileService, sessionKeyService);
  const deployerService = new DeployerService(sessionKeyService, fileService);

  // using an already deployed maci contract
  let maciContract = "";
  let pollId: number;

  let approval: string;
  let sessionKeyAddress: Hex;

  beforeAll(async () => {
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
    approval = await generateApproval(sessionKeyAddress);
  });

  describe("deploy", () => {
    describe("deployMaci", () => {
      it("should deploy all maci related contracts", async () => {
        const { address: maciAddress } = await deployerService.deployMaci({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          config: testMaciDeploymentConfig,
        });

        maciContract = maciAddress;
        expect(maciAddress).not.toBe(zeroAddress);
      });
    });

    describe("deployPoll", () => {
      it("should deploy a poll", async () => {
        const { pollId: poll } = await deployerService.deployPoll({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          config: {
            ...testPollDeploymentConfig,
            startDate: Math.floor(Date.now() / 1000) + 50,
            endDate: Math.floor(Date.now() / 1000) + 85,
          },
        });

        expect(poll).toBeDefined();
        pollId = Number.parseInt(poll, 10);
      });
    });
  });

  describe("merge", () => {
    test("should return true when there are no errors", async () => {
      // wait until we can complete a poll
      await sleep(90 * 1000); // 50 start + 35 end + 5 seconds of grace time

      const merged = await proofService.merge({
        maciContractAddress: maciContract,
        pollId,
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
      });

      expect(merged).toBe(true);
    });

    test("should throw when given an invalid pollId", async () => {
      const invalidPollId = 50000;
      await expect(
        proofService.merge({
          maciContractAddress: maciContract,
          pollId: invalidPollId,
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        }),
      ).rejects.toThrow(`MACI contract doesn't have any deployed poll ${invalidPollId}`);
    });
  });

  describe("sessionKeys", () => {
    it("should create a client from a session key and an approval", async () => {
      const client = await sessionKeyService.generateClientFromSessionKey(
        sessionKeyAddress,
        approval,
        ESupportedNetworks.OPTIMISM_SEPOLIA,
      );

      expect(client).toBeDefined();
      expect(client.transport.key).toBe("http");
      expect(client.key).toBe("Account");
      expect(client.account.address).not.toBe(zeroAddress);
      expect(client.account.kernelVersion).toBe(KERNEL_VERSION);
      expect(client.account.entryPoint.version).toBe(ENTRY_POINT.version);
      // this is an account with limited permissions so no sudo validator
      expect(client.account.kernelPluginManager.address).toBe(zeroAddress);
      expect(client.account.kernelPluginManager.sudoValidator).toBe(undefined);

      // send a transaction
      const tx = await client.sendTransaction({
        to: zeroAddress,
        value: 0n,
        data: "0x",
      });

      expect(tx.length).toBeGreaterThan(0);
    });

    it("should not allow to create a client after the session key has been deactivated", async () => {
      sessionKeyService.deactivateSessionKey(sessionKeyAddress);

      await expect(
        sessionKeyService.generateClientFromSessionKey(
          sessionKeyAddress,
          approval,
          ESupportedNetworks.OPTIMISM_SEPOLIA,
        ),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });
  });
});
