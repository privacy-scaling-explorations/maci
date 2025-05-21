import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { Deployment, EMode, ProofGenerator } from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { zeroAddress } from "viem";

import type { IGenerateArgs } from "../types";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { ProofGeneratorService } from "../proof.service";

dotenv.config();

jest.mock("hardhat", (): unknown => ({
  network: {
    name: "localhost",
    config: {
      chain: { id: 0x1 },
    },
  },
}));

jest.mock("@maci-protocol/contracts", (): unknown => ({
  ...jest.requireActual("@maci-protocol/contracts"),
  Deployment: {
    getInstance: jest.fn(),
  },
  ProofGenerator: jest.fn(),
}));

describe("ProofGeneratorService", () => {
  const defaultProofArgs: IGenerateArgs = {
    poll: 1,
    maciContractAddress: zeroAddress,
    mode: EMode.NON_QV,
    sessionKeyAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    approval: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    chain: ESupportedNetworks.LOCALHOST,
  };

  let mockContract = {
    polls: jest.fn(),
    getMainRoot: jest.fn(),
    treeDepths: jest.fn(),
    extContracts: jest.fn(),
    stateMerged: jest.fn(),
    coordinatorPublicKey: jest.fn(),
  };

  let defaultProofGenerator = {
    generateMpProofs: jest.fn(),
    generateTallyProofs: jest.fn(),
    merge: jest.fn(),
  };

  const defaultDeploymentService = {
    setHre: jest.fn(),
    getDeployer: jest.fn(() => Promise.resolve({})),
    getContract: jest.fn(() => Promise.resolve(mockContract)),
  };

  const fileService = new FileService();
  const sessionKeysService = new SessionKeysService(fileService);

  beforeEach(() => {
    mockContract = {
      polls: jest.fn(() =>
        Promise.resolve({ poll: zeroAddress.replace("0x0", "0x1"), messageProcessor: zeroAddress, tally: zeroAddress }),
      ),
      getMainRoot: jest.fn(() => Promise.resolve(1n)),
      treeDepths: jest.fn(() => Promise.resolve([1, 2, 3])),
      extContracts: jest.fn(() => Promise.resolve({ messageAq: zeroAddress })),
      stateMerged: jest.fn(() => Promise.resolve(true)),
      coordinatorPublicKey: jest.fn(() =>
        Promise.resolve({
          x: 21424602586933317770306541383681754745261216801634012235464162098738462892814n,
          y: 11917647526382221762393892566678210317414189429046519403585863973939713533473n,
        }),
      ),
    };

    defaultProofGenerator = {
      generateMpProofs: jest.fn(() => Promise.resolve([1])),
      generateTallyProofs: jest.fn(() => Promise.resolve({ proofs: [1], tallyData: {} })),
      merge: jest.fn(() => Promise.resolve(true)),
    };

    (Deployment.getInstance as jest.Mock).mockReturnValue(defaultDeploymentService);

    (ProofGenerator as unknown as jest.Mock).mockReturnValue(defaultProofGenerator);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    ProofGenerator.prepareState = jest.fn(() =>
      Promise.resolve({
        polls: new Map<bigint, unknown>([[1n, {}]]),
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw error if state is not merged yet", async () => {
    mockContract.stateMerged.mockResolvedValue(false);

    const service = new ProofGeneratorService(fileService, sessionKeysService);

    await expect(service.generate(defaultProofArgs)).rejects.toThrow(ErrorCodes.NOT_MERGED_STATE_TREE.toString());
  });

  test("should throw error if private key is wrong", async () => {
    const keypair = new Keypair(new PrivateKey(0n));
    mockContract.coordinatorPublicKey.mockResolvedValue(keypair.publicKey.asContractParam());

    const service = new ProofGeneratorService(fileService, sessionKeysService);

    await expect(service.generate(defaultProofArgs)).rejects.toThrow(ErrorCodes.PRIVATE_KEY_MISMATCH.toString());
  });

  test("should throw error if poll is not found", async () => {
    const service = new ProofGeneratorService(fileService, sessionKeysService);

    await expect(service.generate({ ...defaultProofArgs, poll: 2 })).rejects.toThrow(
      ErrorCodes.POLL_NOT_FOUND.toString(),
    );
  });

  test("should throw error if poll is not found in maci contract", async () => {
    mockContract.polls.mockResolvedValue({ poll: zeroAddress });
    const service = new ProofGeneratorService(fileService, sessionKeysService);

    await expect(service.generate({ ...defaultProofArgs, poll: 2 })).rejects.toThrow(
      ErrorCodes.POLL_NOT_FOUND.toString(),
    );
  });

  test("should generate proofs properly for NonQv", async () => {
    const service = new ProofGeneratorService(fileService, sessionKeysService);

    const data = await service.generate(defaultProofArgs);

    expect(data.processProofs).toHaveLength(1);
    expect(data.tallyProofs).toHaveLength(1);
  });

  test("should generate proofs properly for Qv", async () => {
    const service = new ProofGeneratorService(fileService, sessionKeysService);

    const data = await service.generate({ ...defaultProofArgs, mode: EMode.QV });

    expect(data.processProofs).toHaveLength(1);
    expect(data.tallyProofs).toHaveLength(1);
  });
});
