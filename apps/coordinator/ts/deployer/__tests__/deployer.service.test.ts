import {
  ContractStorage,
  EContracts,
  EInitialVoiceCreditProxies,
  EPolicies,
  MACI__factory as MACIFactory,
  Verifier__factory as VerifierFactory,
} from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { BaseContract, Signer } from "ethers";
import { Hex, zeroAddress } from "viem";

import path from "path";

import { ErrorCodes, ESupportedNetworks, KernelClientType } from "../../common";
import { FileService } from "../../file/file.service";
import { generateApproval } from "../../sessionKeys/__tests__/utils";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { DeployerService } from "../deployer.service";

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
  let kernelClient: KernelClientType;
  let signer: Signer;

  beforeAll(async () => {
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
    approval = await generateApproval(sessionKeyAddress);

    kernelClient = await sessionKeyService.generateClientFromSessionKey(sessionKeyAddress, approval, chain);
    signer = await sessionKeyService.getKernelClientSigner(kernelClient);
  });

  afterAll(() => {
    storageInstance.cleanup(ESupportedNetworks.OPTIMISM_SEPOLIA);
    storageInstance.cleanup(ESupportedNetworks.ARBITRUM_ONE);
  });

  describe("deployAndSavePolicy", () => {
    // we cleanup after each test so we don't have leftover saved contracts
    afterEach(() => {
      storageInstance.cleanup(chain);
    });
    it("should throw when the policy is not existent", async () => {
      await expect(
        deployerService.deployAndSavePolicy(signer, "NonExistent" as unknown as EPolicies, chain),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_POLICY.toString());
    });

    test("should deploy policy if none is stored", async () => {
      const policy = await deployerService.deployAndSavePolicy(signer, EPolicies.FreeForAll, chain);

      expect(policy).toBeDefined();
      expect(await policy.getAddress()).not.toBe(zeroAddress);
    });
  });

  describe("deployAndSaveVoiceCreditProxy", () => {
    // we cleanup after each test so we don't have leftover saved contracts
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    it("should throw when the voice credit proxy is not existent", async () => {
      await expect(
        deployerService.deployAndSaveVoiceCreditProxy(
          signer,
          "NonExistent" as unknown as EInitialVoiceCreditProxies,
          chain,
        ),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY.toString());
    });

    test("should deploy voice credit proxy if none is stored", async () => {
      const voiceCreditProxy = await deployerService.deployAndSaveVoiceCreditProxy(
        signer,
        EInitialVoiceCreditProxies.Constant,
        chain,
        { amount: 100 },
      );

      expect(voiceCreditProxy).toBeDefined();
      expect(await voiceCreditProxy.getAddress()).not.toBe(zeroAddress);
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
});
