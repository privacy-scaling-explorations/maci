import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { Deployment, EMode, ESupportedChains } from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { zeroAddress } from "viem";

import type { IGenerateArgs } from "../types";

import { ErrorCodes } from "../../common";
import { getCoordinatorKeypair } from "../../common/coordinatorKeypair";
import { FileService } from "../../file/file.service";
import { generateApproval } from "../../sessionKeys/__tests__/utils";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { ProofGeneratorService } from "../proof.service";

dotenv.config();

jest.mock("@maci-protocol/sdk", (): unknown => ({
  ...jest.requireActual("@maci-protocol/sdk"),
  Deployment: {
    getInstance: jest.fn(),
  },
  getPoll: jest.fn().mockResolvedValue({
    address: "0x123",
  }),
  generateProofs: jest.fn().mockResolvedValue({
    processProofs: [1],
    tallyProofs: [1],
    tallyData: {},
  }),
}));

describe("ProofGeneratorService", () => {
  let defaultProofArgs: IGenerateArgs;

  let mockContract = {
    polls: jest.fn(),
    getMainRoot: jest.fn(),
    treeDepths: jest.fn(),
    extContracts: jest.fn(),
    stateMerged: jest.fn(),
    coordinatorPublicKey: jest.fn(),
  };

  const defaultDeploymentService = {
    setHre: jest.fn(),
    getDeployer: jest.fn(() => Promise.resolve({})),
    getContract: jest.fn(() => Promise.resolve(mockContract)),
  };
  const coordinatorPublicKey = getCoordinatorKeypair().publicKey.asContractParam();

  const fileService = new FileService();
  const sessionKeysService = new SessionKeysService(fileService);

  beforeAll(async () => {
    const { sessionKeyAddress } = await sessionKeysService.generateSessionKey();
    const approval = await generateApproval(sessionKeyAddress);

    defaultProofArgs = {
      poll: 1,
      maciContractAddress: zeroAddress,
      mode: EMode.NON_QV,
      sessionKeyAddress,
      approval,
      chain: ESupportedChains.OptimismSepolia,
    };
  });

  beforeEach(() => {
    mockContract = {
      polls: jest.fn(() =>
        Promise.resolve({ poll: zeroAddress.replace("0x0", "0x1"), messageProcessor: zeroAddress, tally: zeroAddress }),
      ),
      getMainRoot: jest.fn(() => Promise.resolve(1n)),
      treeDepths: jest.fn(() => Promise.resolve([1, 2, 3])),
      extContracts: jest.fn(() => Promise.resolve({ messageAq: zeroAddress })),
      stateMerged: jest.fn(() => Promise.resolve(true)),
      coordinatorPublicKey: jest.fn(() => Promise.resolve(coordinatorPublicKey)),
    };

    (Deployment.getInstance as jest.Mock).mockReturnValue(defaultDeploymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw error if private key is wrong", async () => {
    const keypair = new Keypair(new PrivateKey(0n));
    mockContract.coordinatorPublicKey.mockResolvedValue(keypair.publicKey.asContractParam());

    const service = new ProofGeneratorService(fileService, sessionKeysService);

    await expect(service.generate(defaultProofArgs)).rejects.toThrow(ErrorCodes.PRIVATE_KEY_MISMATCH.toString());
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
