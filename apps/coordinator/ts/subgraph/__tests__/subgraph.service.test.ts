import dotenv from "dotenv";

import childProcess from "child_process";
import fs from "fs";

import type { IDeploySubgraphArgs } from "../types";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { SubgraphService } from "../subgraph.service";

dotenv.config();

jest.mock("child_process", (): unknown => ({
  ...jest.requireActual("child_process"),
  execFile: jest.fn(),
}));

jest.mock("fs", (): unknown => ({
  ...jest.requireActual("fs"),
  promises: {
    writeFile: jest.fn(),
  },
}));

jest.mock("util", (): unknown => ({
  promisify: jest.fn((func: jest.Mock) => func),
}));

describe("SubgraphService", () => {
  const defaultArgs: IDeploySubgraphArgs = {
    maciContractAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    startBlock: 0,
    network: ESupportedNetworks.OPTIMISM_SEPOLIA,
    name: "subgraph",
    tag: "v0.0.1",
  };

  beforeEach(() => {
    (childProcess.execFile as unknown as jest.Mock).mockResolvedValue({
      stdout: "https://subgraph.com https://test.com",
    });

    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw error if deploy is failed", async () => {
    (childProcess.execFile as unknown as jest.Mock).mockRejectedValue(new Error());

    const service = new SubgraphService();

    await expect(service.deploy(defaultArgs)).rejects.toThrow(ErrorCodes.SUBGRAPH_DEPLOY.toString());
  });

  test("should throw error if network is invalid", async () => {
    const service = new SubgraphService();

    await expect(service.deploy({ ...defaultArgs, network: "unknown" as ESupportedNetworks })).rejects.toThrow(
      ErrorCodes.UNSUPPORTED_NETWORK.toString(),
    );
  });

  test("should throw error if there is no subgraph url", async () => {
    (childProcess.execFile as unknown as jest.Mock).mockResolvedValue({ stdout: "", stderr: "" });

    const service = new SubgraphService();

    await expect(service.deploy(defaultArgs)).rejects.toThrow(ErrorCodes.SUBGRAPH_DEPLOY.toString());
  });

  test("should return deployed subgraph url properly", async () => {
    const service = new SubgraphService();

    const { url } = await service.deploy(defaultArgs);

    expect(url).toBe("https://test.com");
  });
});
