import { Test } from "@nestjs/testing";
import { Hex, zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { generateApproval } from "../../sessionKeys/__tests__/utils";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { DeployerController } from "../deployer.controller";
import { DeployerService } from "../deployer.service";

import { testMaciDeploymentConfig, testPollDeploymentConfig } from "./utils";

describe("DeployerController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let deployerController: DeployerController;

  const mockDeployerService = {
    deployMaci: jest.fn(),
    deployPoll: jest.fn(),
  };

  const defaultDeployMaciReturn: string = zeroAddress;
  const defaultDeployPollReturn = "0";

  const deployerControllerFail = new DeployerController(
    new DeployerService(new SessionKeysService(new FileService()), new FileService()),
  );
  const fileService = new FileService();
  const sessionKeyService = new SessionKeysService(fileService);

  let approval: string;
  let sessionKeyAddress: Hex;

  beforeAll(async () => {
    approval = await generateApproval(sessionKeyAddress);
    sessionKeyAddress = (await sessionKeyService.generateSessionKey()).sessionKeyAddress;
  });

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [DeployerController],
    })
      .useMocker((token) => {
        if (token === DeployerService) {
          mockDeployerService.deployMaci.mockResolvedValue({ address: defaultDeployMaciReturn });
          mockDeployerService.deployPoll.mockResolvedValue({ pollId: defaultDeployPollReturn });
          return mockDeployerService;
        }

        return jest.fn();
      })
      .compile();

    deployerController = app.get<DeployerController>(DeployerController);
  });

  describe("v1/deploy/maci", () => {
    test("should deploy all contracts", async () => {
      const { address } = await deployerController.deployMACIContracts({
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        approval,
        sessionKeyAddress,
        config: testMaciDeploymentConfig,
      });

      expect(address).toEqual(defaultDeployMaciReturn);
    });

    test("should return 400 bad request when the service throws", async () => {
      await expect(
        deployerControllerFail.deployMACIContracts({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          approval: "",
          sessionKeyAddress: "0x",
          config: testMaciDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });
  });

  describe("v1/deploy/poll", () => {
    test("should deploy a new poll", async () => {
      const { pollId } = await deployerController.deployPoll({
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        approval: "",
        sessionKeyAddress: "0x",
        config: testPollDeploymentConfig,
      });

      expect(pollId).toEqual(defaultDeployPollReturn);
    });

    test("should return 400 bad request when the service throws", async () => {
      await expect(
        deployerControllerFail.deployPoll({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          approval: "",
          sessionKeyAddress: "0x",
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });
  });
});
