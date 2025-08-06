import {
  ContractStorage,
  deployFreeForAllSignUpPolicy,
  deployPoll,
  deployVerifier,
  deployVerifyingKeysRegistryContract,
  deployMaci,
  deployConstantInitialVoiceCreditProxyFactory,
  deployConstantInitialVoiceCreditProxy,
  getDeployedPolicyProxyFactories,
  ECheckerFactories,
  EContracts,
  EInitialVoiceCreditProxies,
  EInitialVoiceCreditProxiesFactories,
  EPolicies,
  EPolicyFactories,
  ESupportedChains,
} from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { type Signer } from "ethers";
import { zeroAddress } from "viem";

import { ErrorCodes } from "../../common";
import { FileService } from "../../file/file.service";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { DeployerService } from "../deployer.service";

import { testMaciDeploymentConfig, testPollDeploymentConfig } from "./utils";

dotenv.config();

jest.mock("@maci-protocol/sdk", (): unknown => ({
  ...jest.requireActual("@maci-protocol/sdk"),
  ContractStorage: {
    getInstance: jest.fn(),
  },
  deployFreeForAllSignUpPolicy: jest.fn(),
  deployPoll: jest.fn(),
  deployVerifyingKeysRegistryContract: jest.fn(),
  deployVerifier: jest.fn(),
  getDeployedPolicyProxyFactories: jest.fn(),
  setVerifyingKeys: jest.fn(),
  deployMaci: jest.fn(),
  deployConstantInitialVoiceCreditProxyFactory: jest.fn(),
  deployConstantInitialVoiceCreditProxy: jest.fn(),
}));

describe("DeployerService", () => {
  const chain = ESupportedChains.OptimismSepolia;
  const signer = {
    getAddress: jest.fn().mockResolvedValue(zeroAddress),
  } as unknown as Signer;
  const approval = "approval";
  const sessionKeyAddress = zeroAddress;

  const mockStorage = {
    register: jest.fn(),
    getAddress: jest.fn(),
  };

  const mockContract = {
    deploymentTransaction: jest.fn(),
    getAddress: jest.fn().mockResolvedValue(zeroAddress.replace("0x0", "0x1")),
  };

  const fileService = {
    getZkeyFilePaths: jest.fn(),
  } as unknown as FileService;

  const sessionKeyService = {
    getCoordinatorSigner: jest.fn().mockResolvedValue(signer),
  } as unknown as SessionKeysService;

  beforeEach(() => {
    mockStorage.getAddress = jest.fn().mockReturnValue(zeroAddress);

    sessionKeyService.getCoordinatorSigner = jest.fn().mockResolvedValue(signer);

    fileService.getZkeyFilePaths = jest.fn().mockReturnValue({ zkey: "" });

    (ContractStorage.getInstance as jest.Mock).mockReturnValue(mockStorage);

    (deployFreeForAllSignUpPolicy as jest.Mock).mockResolvedValue([
      mockContract,
      mockContract,
      mockContract,
      mockContract,
    ]);

    (deployVerifier as jest.Mock).mockResolvedValue(mockContract);

    (deployVerifyingKeysRegistryContract as jest.Mock).mockResolvedValue(mockContract);

    (deployConstantInitialVoiceCreditProxyFactory as jest.Mock).mockResolvedValue(mockContract);

    (deployConstantInitialVoiceCreditProxy as jest.Mock).mockResolvedValue(mockContract);

    (deployPoll as jest.Mock).mockResolvedValue({
      pollContractAddress: zeroAddress,
      messageProcessorContractAddress: zeroAddress,
      tallyContractAddress: zeroAddress,
      pollId: 0n,
    });

    (deployMaci as jest.Mock).mockResolvedValue({
      maciContractAddress: zeroAddress.replace("0x0", "0x1"),
      pollFactoryContractAddress: zeroAddress,
      messageProcessorFactoryContractAddress: zeroAddress,
      tallyFactoryContractAddress: zeroAddress,
      poseidonAddresses: {
        poseidonT3: zeroAddress,
        poseidonT4: zeroAddress,
        poseidonT5: zeroAddress,
        poseidonT6: zeroAddress,
      },
    });

    (getDeployedPolicyProxyFactories as jest.Mock).mockResolvedValue({ checker: undefined, policy: undefined });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deployAndSavePolicy", () => {
    test("should throw when the policy is not existent", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployAndSavePolicy(signer, chain, { type: "NonExistent" as unknown as EPolicies }),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_POLICY.toString());
    });

    test("should deploy policy if none is stored", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      const policy = await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      expect(policy).toBeDefined();
      expect(await policy.getAddress()).not.toBe(zeroAddress);
    });

    test("should save factories (policy and checker) after deploying policy", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      expect(mockStorage.register).toHaveBeenCalledTimes(3);
      expect(mockStorage.register).toHaveBeenNthCalledWith(1, {
        id: EPolicies.FreeForAll,
        name: EPolicies.FreeForAll,
        contract: mockContract,
        args: [],
        network: chain,
      });
      expect(mockStorage.register).toHaveBeenNthCalledWith(2, {
        id: EPolicyFactories.FreeForAll,
        name: EPolicyFactories.FreeForAll,
        contract: mockContract,
        network: chain,
      });
      expect(mockStorage.register).toHaveBeenNthCalledWith(3, {
        id: ECheckerFactories.FreeForAll,
        name: ECheckerFactories.FreeForAll,
        contract: mockContract,
        network: chain,
      });
    });

    test("should reuse policy factories if already stored", async () => {
      (getDeployedPolicyProxyFactories as jest.Mock).mockResolvedValue({
        checker: mockContract,
        policy: mockContract,
      });

      const deployerService = new DeployerService(sessionKeyService, fileService);

      await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });
      await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      expect(mockStorage.register).toHaveBeenCalledTimes(2);
    });
  });

  describe("deployAndSaveVoiceCreditProxyFactory", () => {
    test("should throw when the voice credit proxy factory is not existent", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployAndSaveVoiceCreditProxyFactory(
          signer,
          "NonExistent" as unknown as EInitialVoiceCreditProxiesFactories,
          chain,
        ),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY_FACTORY.toString());
    });

    test("should deploy voice credit proxy factory if none is stored", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      const constantInitialVoiceCreditProxyFactory = await deployerService.deployAndSaveVoiceCreditProxyFactory(
        signer,
        EInitialVoiceCreditProxiesFactories.Constant,
        chain,
      );

      expect(constantInitialVoiceCreditProxyFactory).toBeDefined();
      expect(await constantInitialVoiceCreditProxyFactory.getAddress()).not.toBe(zeroAddress);
    });
  });

  describe("deployAndSaveVoiceCreditProxy", () => {
    test("should throw when the voice credit proxy is not existent", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      const constantInitialVoiceCreditProxyFactory = await deployerService.deployAndSaveVoiceCreditProxyFactory(
        signer,
        EInitialVoiceCreditProxiesFactories.Constant,
        chain,
      );

      await expect(
        deployerService.deployAndSaveVoiceCreditProxy(
          signer,
          "NonExistent" as unknown as EInitialVoiceCreditProxies,
          chain,
          constantInitialVoiceCreditProxyFactory,
        ),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY.toString());
    });

    test("should deploy voice credit proxy if none is stored", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      const constantInitialVoiceCreditProxyFactory = await deployerService.deployAndSaveVoiceCreditProxyFactory(
        signer,
        EInitialVoiceCreditProxiesFactories.Constant,
        chain,
      );

      const voiceCreditProxy = await deployerService.deployAndSaveVoiceCreditProxy(
        signer,
        EInitialVoiceCreditProxies.Constant,
        chain,
        constantInitialVoiceCreditProxyFactory,
        { amount: 100 },
      );

      expect(voiceCreditProxy).toBeDefined();
      expect(await voiceCreditProxy.getAddress()).not.toBe(zeroAddress);
    });
  });

  describe("deployMaci", () => {
    test("should throw when passing a non existent session key address", async () => {
      sessionKeyService.getCoordinatorSigner = jest
        .fn()
        .mockRejectedValue(new Error(ErrorCodes.SESSION_KEY_NOT_FOUND.toString()));

      const deployerService = new DeployerService(sessionKeyService, fileService);

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
      sessionKeyService.getCoordinatorSigner = jest
        .fn()
        .mockRejectedValue(new Error(ErrorCodes.INVALID_APPROVAL.toString()));

      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployMaci({
          config: testMaciDeploymentConfig,
          chain,
          approval: "0x123",
          sessionKeyAddress,
        }),
      ).rejects.toThrow(ErrorCodes.INVALID_APPROVAL.toString());
    });

    test("should deploy all new contracts", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

      const { address: maciAddress } = await deployerService.deployMaci({
        config: testMaciDeploymentConfig,
        chain,
        approval,
        sessionKeyAddress,
      });

      expect(maciAddress).toBe(zeroAddress.replace("0x0", "0x1"));
    });
  });

  describe("deployPoll", () => {
    test("should throw when there is no maci contract deployed", async () => {
      (ContractStorage.getInstance as jest.Mock).mockReturnValue({
        ...mockStorage,
        getAddress: jest
          .fn()
          .mockImplementation((key: EContracts) => (key !== EContracts.MACI ? zeroAddress : undefined)),
      });

      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.MACI_NOT_DEPLOYED.toString());
    });

    test("should throw when there is no verifier deployed", async () => {
      (ContractStorage.getInstance as jest.Mock).mockReturnValue({
        ...mockStorage,
        getAddress: jest
          .fn()
          .mockImplementation((key: EContracts) => (key !== EContracts.Verifier ? zeroAddress : undefined)),
      });

      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.VERIFIER_NOT_DEPLOYED.toString());
    });

    test("should throw when there is no verifying keys registry deployed", async () => {
      (ContractStorage.getInstance as jest.Mock).mockReturnValue({
        ...mockStorage,
        getAddress: jest
          .fn()
          .mockImplementation((key: EContracts) =>
            key !== EContracts.VerifyingKeysRegistry ? zeroAddress : undefined,
          ),
      });

      const deployerService = new DeployerService(sessionKeyService, fileService);

      await expect(
        deployerService.deployPoll({
          approval,
          sessionKeyAddress,
          chain,
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.VERIFYING_KEYS_REGISTRY_NOT_DEPLOYED.toString());
    });

    test("should deploy a poll", async () => {
      const deployerService = new DeployerService(sessionKeyService, fileService);

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
