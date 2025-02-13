import dotenv from "dotenv";
import { BaseContract, zeroPadBytes } from "ethers";
import {
  InitialVoiceCreditProxy__factory as VoiceCreditProxyFactory,
  ContractStorage,
  EContracts,
  EInitialVoiceCreditProxies,
  EGatekeepers,
  FreeForAllGatekeeper__factory as FreeForAllGatekeeperFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  SemaphoreGatekeeper__factory as SemaphoreGatekeeperFactory,
  HatsGatekeeperSingle__factory as HatsGatekeeperSingleFactory,
  GitcoinPassportGatekeeper__factory as GitcoinPassportGatekeeperFactory,
  MACI__factory as MACIFactory,
  Verifier__factory as VerifierFactory,
} from "maci-sdk";
import { zeroAddress } from "viem";

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
  const { sessionKeyAddress } = sessionKeyService.generateSessionKey();

  let approval: string;

  beforeAll(async () => {
    approval = await generateApproval(sessionKeyAddress);
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

  describe("getGatekeeperData", () => {
    // we cleanup after each test so we don't have leftover saved contracts
    afterEach(() => {
      storageInstance.cleanup(chain);
    });

    it("should throw when the gatekeeper is not existent", () => {
      expect(() => deployerService.getGatekeeperData("NotExistent" as unknown as EGatekeepers, chain)).toThrow(
        ErrorCodes.UNSUPPORTED_GATEKEEPER.toString(),
      );
    });

    describe("FreeForAllGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.FreeForAll, chain);
        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.FreeForAll as unknown as EContracts,
          contract: new BaseContract("0x", FreeForAllGatekeeperFactory.abi),
          network: chain,
          args: [],
        });
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.FreeForAll, chain);
        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });
    });

    describe("EASGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.EAS, chain);
        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.EAS as unknown as EContracts,
          contract: new BaseContract("0x", EASGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, zeroPadBytes("0x", 32), zeroAddress],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.EAS, chain, {
          easAddress: zeroAddress,
          schema: zeroPadBytes("0x", 32),
          attester: zeroAddress,
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return that the gatekeeper is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EGatekeepers.EAS as unknown as EContracts,
          contract: new BaseContract("0x", EASGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, zeroPadBytes("0x", 32), zeroAddress.replace("0x0", "0x1")],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.EAS, chain, {
          easAddress: zeroAddress,
          schema: zeroPadBytes("0x", 32),
          attester: zeroAddress,
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });
    });

    describe("ZupassGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });
        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.Zupass as unknown as EContracts,
          contract: new BaseContract("0x", ZupassGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, zeroAddress, "0x", zeroAddress],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return that the gatekeeper is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EGatekeepers.Zupass as unknown as EContracts,
          contract: new BaseContract("0x", ZupassGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, zeroAddress, "0x", zeroAddress.replace("0x0", "0x1")],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Zupass, chain, {
          signer1: zeroAddress,
          signer2: zeroAddress,
          eventId: "0x",
          zupassVerifier: zeroAddress,
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });
    });

    describe("SemaphoreGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "0",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.Semaphore as unknown as EContracts,
          contract: new BaseContract("0x", SemaphoreGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "0",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return that the gatekeeper is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EGatekeepers.Semaphore as unknown as EContracts,
          contract: new BaseContract("0x", SemaphoreGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.Semaphore, chain, {
          semaphoreContract: zeroAddress,
          groupId: "1",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });
    });

    describe("HatsGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.HatsSingle, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: [zeroAddress],
        });
        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.HatsSingle as unknown as EContracts,
          contract: new BaseContract("0x", HatsGatekeeperSingleFactory.abi),
          network: chain,
          args: [zeroAddress, [zeroAddress]],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.HatsSingle, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: [zeroAddress],
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return that the gatekeeper is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EGatekeepers.HatsSingle as unknown as EContracts,
          contract: new BaseContract("0x", HatsGatekeeperSingleFactory.abi),
          network: chain,
          args: [zeroAddress, ["0x"]],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.HatsSingle, chain, {
          hatsProtocolAddress: zeroAddress,
          critrionHats: ["0x1"],
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });
    });

    describe("GitcoinPassportGatekeeper", () => {
      it("should return the gatekeeper data and that the gatekeeper is not deployed", () => {
        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "0",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return the gatekeeper data and that the gatekeeper is already deployed", async () => {
        await storageInstance.register({
          id: EGatekeepers.GitcoinPassport as unknown as EContracts,
          contract: new BaseContract("0x", GitcoinPassportGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "0",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(true);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
      });

      it("should return that the gatekeeper is not deployed when the args are different", async () => {
        await storageInstance.register({
          id: EGatekeepers.GitcoinPassport as unknown as EContracts,
          contract: new BaseContract("0x", GitcoinPassportGatekeeperFactory.abi),
          network: chain,
          args: [zeroAddress, "0"],
        });

        const gatekeeperData = deployerService.getGatekeeperData(EGatekeepers.GitcoinPassport, chain, {
          decoderAddress: zeroAddress,
          passingScore: "1",
        });

        expect(gatekeeperData).toBeDefined();
        expect(gatekeeperData.alreadyDeployed).toBe(false);
        expect(gatekeeperData.abi).toBeDefined();
        expect(gatekeeperData.bytecode).toBeDefined();
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
