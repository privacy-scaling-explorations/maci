import { Test } from "@nestjs/testing";
import { zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../../common";
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

  const defaultDeployMaciReturn = zeroAddress;
  const defaultDeployPollReturn = "0";

  const approval = "approval";
  const sessionKeyAddress = zeroAddress;

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

  afterEach(() => {
    jest.clearAllMocks();
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
      mockDeployerService.deployMaci.mockRejectedValue(new Error(ErrorCodes.SESSION_KEY_NOT_FOUND.toString()));

      const controller = new DeployerController(mockDeployerService as unknown as DeployerService);

      await expect(
        controller.deployMACIContracts({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          approval: "0x123",
          sessionKeyAddress: "0x123",
          config: testMaciDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });
  });

  describe("v1/deploy/poll", () => {
    test("should deploy a new poll", async () => {
      const { pollId } = await deployerController.deployPoll({
        chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
        approval,
        sessionKeyAddress,
        config: testPollDeploymentConfig,
      });

      expect(pollId).toEqual(defaultDeployPollReturn);
    });

    test("should return 400 bad request when the service throws", async () => {
      mockDeployerService.deployPoll.mockRejectedValue(new Error(ErrorCodes.SESSION_KEY_NOT_FOUND.toString()));

      const controller = new DeployerController(mockDeployerService as unknown as DeployerService);

      await expect(
        controller.deployPoll({
          chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
          approval: "0x123",
          sessionKeyAddress: "0x123",
          config: testPollDeploymentConfig,
        }),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });
  });
});
