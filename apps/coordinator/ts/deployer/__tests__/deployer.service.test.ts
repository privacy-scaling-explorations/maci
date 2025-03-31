import {
  InitialVoiceCreditProxy__factory as VoiceCreditProxyFactory,
  ContractStorage,
  EContracts,
  EInitialVoiceCreditProxies,
  EPolicies,
  FreeForAllPolicy__factory as FreeForAllPolicyFactory,
  EASPolicy__factory as EASPolicyFactory,
  ZupassPolicy__factory as ZupassPolicyFactory,
  SemaphorePolicy__factory as SemaphorePolicyFactory,
  HatsPolicy__factory as HatsPolicyFactory,
  GitcoinPassportPolicy__factory as GitcoinPassportPolicyFactory,
  MACI__factory as MACIFactory,
  Verifier__factory as VerifierFactory,
} from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { BaseContract, zeroPadBytes } from "ethers";
import { Hex, zeroAddress } from "viem";

import path from "path";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { generateApproval } from "../../sessionKeys/__tests__/utils";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { DeployerService } from "../deployer.service";
import { estimateExtraGasLimit } from "../utils";

import { testMaciDeploymentConfig, testPollDeploymentConfig } from "./utils";

dotenv.config();

describe("DeployerService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const chain = ESupportedNetworks.OPTIMISM_SEPOLIA;

  const fileService = new FileService();

  const storageInstance = ContractStorage.getInstance(path.join(process.cwd(), "deployed-contracts.json"));
  const sessionKeyService = new SessionKeysService(fileService);
  const deployerService = new DeployerService(sessionKeyService, fileService);

  let approval: string;
  let sessionKeyAddress: Hex;

  beforeAll(async () => {
    approval = await generateApproval(sessionKeyAddress);
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
  });

  describe("getVoiceCreditProxyData", () => {
    test("should return the voice credit proxy data", () => {
      const voiceCreditProxyData = deployerService.getVoiceCreditProxyData(EInitialVoiceCreditProxies.Constant, chain, {
        amount: "50",
      });

      expect(voiceCreditProxyData).toBeDefined();
      expect(voiceCreditProxyData.alreadyDeployed).toBe(false);
      expect(voiceCreditProxyData.abi).toBeDefined();
      expect(voiceCreditProxyData.bytecode).toBeDefined();
    });

    test("should return the voice credit proxy data and that the voice credit proxy is already deployed", async () => {
      await storageInstance.register({
        id: EInitialVoiceCreditProxies.Constant as unknown as EContracts,
        contract: new BaseContract("0x", VoiceCreditProxyFactory.abi),
        network: chain,
        args: ["50"],
      });
      const voiceCreditProxyData = deployerService.getVoiceCreditProxyData(EInitialVoiceCreditProxies.Constant, chain, {
        amount: "50",
      });

      expect(voiceCreditProxyData).toBeDefined();
      expect(voiceCreditProxyData.alreadyDeployed).toBe(true);
      expect(voiceCreditProxyData.abi).toBeDefined();
      expect(voiceCreditProxyData.bytecode).toBeDefined();

      storageInstance.cleanup(chain);
    });

    it("should throw when the voice credits proxy is not existent", () => {
      expect(() =>
        deployerService.getVoiceCreditProxyData("NotExistent" as unknown as EInitialVoiceCreditProxies, chain, {
          amount: "50",
        }),
      ).toThrow(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY.toString());
    });
  });

  describe("getPolicyData", () => {
    // we cleanup after each test so we don't have leftover saved contracts
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    it("should throw when the policy is not existent", () => {
      expect(() => deployerService.getPolicyData("NotExistent" as unknown as EPolicies, chain)).toThrow(
        ErrorCodes.UNSUPPORTED_POLICY.toString(),
      );
    });

    describe("FreeForAllPolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.FreeForAll, chain);
        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.FreeForAll as unknown as EContracts,
          contract: new BaseContract("0x", FreeForAllPolicyFactory.abi),
          network: chain,
          args: [],
        });
        const policyData = deployerService.getPolicyData(EPolicies.FreeForAll, chain);
        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });

    describe("EASPolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.EAS, chain);
        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.EAS as unknown as EContracts,
          contract: new BaseContract("0x", EASPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, zeroPadBytes("0x", 32), zeroAddress],
        });

        const policyData = deployerService.getPolicyData(EPolicies.EAS, chain, {
          easAddress: zeroAddress,
          schema: zeroPadBytes("0x", 32),
          attester: zeroAddress,
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return that the policy is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EPolicies.EAS as unknown as EContracts,
          contract: new BaseContract("0x", EASPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, zeroPadBytes("0x", 32), zeroAddress.replace("0x0", "0x1")],
        });

        const policyData = deployerService.getPolicyData(EPolicies.EAS, chain, {
          easAddress: zeroAddress,
          schema: zeroPadBytes("0x", 32),
          attester: zeroAddress,
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });

    describe("ZupassPolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });
        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.Zupass as unknown as EContracts,
          contract: new BaseContract("0x", ZupassPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, zeroAddress, "0x", zeroAddress],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return that the policy is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EPolicies.Zupass as unknown as EContracts,
          contract: new BaseContract("0x", ZupassPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, zeroAddress, "0x", zeroAddress.replace("0x0", "0x1")],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });

    describe("SemaphorePolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "0",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.Semaphore as unknown as EContracts,
          contract: new BaseContract("0x", SemaphorePolicyFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "0",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return that the policy is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EPolicies.Semaphore as unknown as EContracts,
          contract: new BaseContract("0x", SemaphorePolicyFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "1",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });

    describe("HatsPolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.Hats, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: [zeroAddress],
        });
        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.Hats as unknown as EContracts,
          contract: new BaseContract("0x", HatsPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, [zeroAddress]],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Hats, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: [zeroAddress],
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return that the policy is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EPolicies.Hats as unknown as EContracts,
          contract: new BaseContract("0x", HatsPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, ["0x"]],
        });

        const policyData = deployerService.getPolicyData(EPolicies.Hats, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: ["0x1"],
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });

    describe("GitcoinPassportPolicy", () => {
      it("should return the policy data and that the policy is not deployed", () => {
        const policyData = deployerService.getPolicyData(EPolicies.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "0",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return the policy data and that the policy is already deployed", async () => {
        await storageInstance.register({
          id: EPolicies.GitcoinPassport as unknown as EContracts,
          contract: new BaseContract("0x", GitcoinPassportPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const policyData = deployerService.getPolicyData(EPolicies.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "0",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(true);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });

      it("should return that the policy is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EPolicies.GitcoinPassport as unknown as EContracts,
          contract: new BaseContract("0x", GitcoinPassportPolicyFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const policyData = deployerService.getPolicyData(EPolicies.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "1",
        });

        expect(policyData).toBeDefined();
        expect(policyData.alreadyDeployed).toBe(false);
        expect(policyData.abi).toBeDefined();
        expect(policyData.bytecode).toBeDefined();
      });
    });
  });

  describe("deployMaci", () => {
    test("should throw when passing a non existent session key address", async () => {
      await expect(
        deployerService.deployMaci({
          config: testMaciDeploymentConfig,
          chain,
          approval,
          sessionKeyAddress: "0x5",
        }),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });

    test("should throw when the approval is not valid", async () => {
      await expect(
        deployerService.deployMaci({
          config: testMaciDeploymentConfig,
          chain,
          approval: "0x",
          sessionKeyAddress,
        }),
      ).rejects.toThrow(ErrorCodes.INVALID_APPROVAL.toString());
    });

    test("should deploy all new contracts", async () => {
      const mockDeployMaci = jest.fn().mockResolvedValue({ address: zeroAddress });
      jest.spyOn(DeployerService.prototype, "deployMaci").mockImplementation(mockDeployMaci);

      const { address: maciAddress } = await deployerService.deployMaci({
        config: testMaciDeploymentConfig,
        chain,
        approval,
        sessionKeyAddress,
      });

      expect(maciAddress).toBe(zeroAddress);
    });
  });

  describe("deployPoll", () => {
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    test("should throw when there is no maci contract deployed", async () => {
      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.MACI_NOT_DEPLOYED.toString());
    });

    test("should throw when there is no maci contract deployed to this specific chain", async () => {
      await storageInstance.register({
        id: EContracts.MACI,
        contract: new BaseContract("0x", MACIFactory.abi),
        network: ESupportedNetworks.ARBITRUM_ONE,
        args: [],
      });
      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.MACI_NOT_DEPLOYED.toString());
    });

    it("should throw when there is no verifier deployed", async () => {
      await storageInstance.register({
        id: EContracts.MACI,
        contract: new BaseContract("0x", MACIFactory.abi),
        network: chain,
        args: [],
      });

      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.VERIFIER_NOT_DEPLOYED.toString());
    });

    it("should throw when there is no vk registry deployed", async () => {
      await storageInstance.register({
        id: EContracts.MACI,
        contract: new BaseContract("0x", MACIFactory.abi),
        network: chain,
        args: [],
      });

      await storageInstance.register({
        id: EContracts.Verifier,
        contract: new BaseContract("0x", VerifierFactory.abi),
        network: chain,
        args: [],
      });

      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.VK_REGISTRY_NOT_DEPLOYED.toString());
    });

    test("should deploy a poll", async () => {
      const mockDeployPoll = jest.fn().mockResolvedValue({ pollId: "0" });
      jest.spyOn(DeployerService.prototype, "deployPoll").mockImplementation(mockDeployPoll);

      const { pollId } = await deployerService.deployPoll({
        config: testPollDeploymentConfig,
        chain,
        approval,
        sessionKeyAddress,
      });

      expect(pollId).toBe("0");
    });
  });

  describe("estimateExtraGasLimit", () => {
    it("should return the extra gas limit", () => {
      const extraGasLimit = estimateExtraGasLimit(100n);
      expect(extraGasLimit.toString()).toBe("5");
    });
  });
});
