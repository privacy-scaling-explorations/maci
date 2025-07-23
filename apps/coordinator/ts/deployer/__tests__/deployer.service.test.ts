import {
  ContractStorage,
  ECheckerFactories,
  EContracts,
  EInitialVoiceCreditProxies,
  EInitialVoiceCreditProxiesFactories,
  EPolicies,
  EPolicyFactories,
  getDeployedPolicyProxyFactories,
  MACI__factory as MACIFactory,
  Verifier__factory as VerifierFactory,
} from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { BaseContract, Signer } from "ethers";
import { Hex, zeroAddress } from "viem";

import path from "path";

import { ErrorCodes, ESupportedNetworks } from "../../common";
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
  let signer: Signer;

  beforeAll(async () => {
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
    approval = await generateApproval(sessionKeyAddress);

    signer = await sessionKeyService.getCoordinatorSigner(chain);
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

    test("should throw when the policy is not existent", async () => {
      await expect(
        deployerService.deployAndSavePolicy(signer, chain, { type: "NonExistent" as unknown as EPolicies }),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_POLICY.toString());
    });

    test("should deploy policy if none is stored", async () => {
      const policy = await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      expect(policy).toBeDefined();
      expect(await policy.getAddress()).not.toBe(zeroAddress);
    });

    test("should save factories (policy and checker) after deploying policy", async () => {
      const { checker: initialChecker, policy: initialPolicy } = await getDeployedPolicyProxyFactories({
        policy: EPolicyFactories.FreeForAll,
        checker: ECheckerFactories.FreeForAll,
        network: chain,
        signer,
      });
      expect(initialChecker).not.toBeDefined();
      expect(initialPolicy).not.toBeDefined();

      await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      const { checker, policy } = await getDeployedPolicyProxyFactories({
        policy: EPolicyFactories.FreeForAll,
        checker: ECheckerFactories.FreeForAll,
        network: chain,
        signer,
      });

      expect(checker).toBeDefined();
      expect(policy).toBeDefined();
    });

    test("should reuse policy factories if already stored", async () => {
      const firstPolicy = await deployerService.deployAndSavePolicy(signer, chain, { type: EPolicies.FreeForAll });

      const { checker: firstCheckerFactory, policy: firstPolicyFactory } = await getDeployedPolicyProxyFactories({
        policy: EPolicyFactories.FreeForAll,
        checker: ECheckerFactories.FreeForAll,
        network: chain,
        signer,
      });

      expect(firstCheckerFactory).toBeDefined();
      expect(firstPolicyFactory).toBeDefined();

      const firstCheckerFactoryAddress = await firstCheckerFactory!.getAddress();
      const firstPolicyFactoryAddress = await firstPolicyFactory!.getAddress();

      expect(firstCheckerFactoryAddress).not.toBe(zeroAddress);
      expect(firstPolicyFactoryAddress).not.toBe(zeroAddress);

      const secondPolicy = await deployerService.deployAndSavePolicy(signer, chain, {
        type: EPolicies.FreeForAll,
      });

      const { checker: secondCheckerFactory, policy: secondPolicyFactory } = await getDeployedPolicyProxyFactories({
        policy: EPolicyFactories.FreeForAll,
        checker: ECheckerFactories.FreeForAll,
        network: chain,
        signer,
      });

      expect(secondCheckerFactory).toBeDefined();
      expect(secondPolicyFactory).toBeDefined();

      expect(await secondCheckerFactory!.getAddress()).toBe(firstCheckerFactoryAddress);
      expect(await secondPolicyFactory!.getAddress()).toBe(firstPolicyFactoryAddress);

      expect(await firstPolicy.getAddress()).not.toBe(await secondPolicy.getAddress());
    });
  });

  describe("deployAndSaveVoiceCreditProxyFactory", () => {
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    it("should throw when the voice credit proxy factory is not existent", async () => {
      await expect(
        deployerService.deployAndSaveVoiceCreditProxyFactory(
          signer,
          "NonExistent" as unknown as EInitialVoiceCreditProxiesFactories,
          chain,
        ),
      ).rejects.toThrow(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY_FACTORY.toString());
    });

    test("should deploy voice credit proxy factory if none is stored", async () => {
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
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    it("should throw when the voice credit proxy is not existent", async () => {
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
          approval: "0x123",
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

    it("should throw when there is no verifying keys registry deployed", async () => {
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
      ).rejects.toThrow(ErrorCodes.VERIFYING_KEYS_REGISTRY_NOT_DEPLOYED.toString());
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
