import { Hex, zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../ts/common";
import { CryptoService } from "../ts/crypto/crypto.service";
import { testMaciDeploymentConfig, testPollDeploymentConfig } from "../ts/deployer/__tests__/utils";
import { DeployerService } from "../ts/deployer/deployer.service";
import { IDeployPollConfig } from "../ts/deployer/types";
import { FileService } from "../ts/file/file.service";
import { ProofGeneratorService } from "../ts/proof/proof.service";
import { ENTRY_POINT, generateApproval, KERNEL_VERSION } from "../ts/sessionKeys/__tests__/utils";
import { SessionKeysService } from "../ts/sessionKeys/sessionKeys.service";

describe("E2E Account Abstraction Tests", () => {
  const fileService = new FileService();
  const sessionKeyService = new SessionKeysService(fileService);
  const cryptoService = new CryptoService();
  const proofService = new ProofGeneratorService(cryptoService, fileService, sessionKeyService);
  const deployerService = new DeployerService(sessionKeyService, fileService);

  // using an already deployed maci contract
  const maciContract = "0xf281870519822f302B13c07252d0f6A71E8D023e";
  const pollId = 2;

  let approval: string;
  let sessionKeyAddress: Hex;

  beforeAll(async () => {
    approval = await generateApproval(sessionKeyAddress);
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
  });

  describe("deploy", () => {
    describe("deployMaci", () => {
      it("should deploy all maci related contracts", async () => {
        const { address: maciAddress } = await deployerService.deployMaci({
          approval,
          sessionKeyAddress,
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          config: testMaciDeploymentConfig,
        });

        expect(maciAddress).not.toBe(zeroAddress);
      });
    });

    describe("deployPoll", () => {
      it("should deploy a poll", async () => {
        // Serialize the config with the custom serializer
        const serializedConfig = JSON.stringify(testPollDeploymentConfig);
        const pollConfig = JSON.parse(serializedConfig) as IDeployPollConfig;
        const { pollId: poll } = await deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          config: pollConfig,
        });

        expect(poll).toBeDefined();
      });
    });
  });

  describe("merge", () => {
    test("should return true when there are no errors", async () => {
      const { sessionKeyAddress: sessionKey } = await sessionKeyService.generateSessionKey();
      const generatedApproval = await generateApproval(sessionKey);

      const merged = await proofService.merge({
        maciContractAddress: maciContract,
        pollId,
        sessionKeyAddress: sessionKey,
        approval: generatedApproval,
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
      });

      expect(merged).toBe(true);
    });

    test("should throw when given an invalid pollId", async () => {
      const { sessionKeyAddress: sessionKey } = await sessionKeyService.generateSessionKey();
      const generatedApproval = await generateApproval(sessionKey);

      await expect(
        proofService.merge({
          maciContractAddress: maciContract,
          pollId: 50000,
          sessionKeyAddress: sessionKey,
          approval: generatedApproval,
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        }),
      ).rejects.toThrow(ErrorCodes.POLL_NOT_FOUND.toString());
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
      expect(client.account.entryPoint).toBe(ENTRY_POINT);
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
