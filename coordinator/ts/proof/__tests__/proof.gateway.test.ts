import { Test } from "@nestjs/testing";
import { IGenerateProofsOptions } from "maci-contracts";
import { Server } from "socket.io";

import type { IGenerateArgs, IGenerateData } from "../types";
import type { TallyData } from "maci-cli";

import { ProofGateway } from "../proof.gateway";
import { ProofGeneratorService } from "../proof.service";
import { EProofGenerationEvents } from "../types";

describe("ProofGateway", () => {
  let gateway: ProofGateway;

  const defaultProofGeneratorArgs: IGenerateArgs = {
    poll: 0,
    maciContractAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    tallyContractAddress: "0x6F1216D1BFe15c98520CA1434FC1d9D57AC95321",
    useQuadraticVoting: false,
    encryptedCoordinatorPrivateKey:
      "siO9W/g7jNVXs9tOUv/pffrcqYdMlgdXw7nSSlqM1q1UvHGSSbhtLJpeT+nJKW7/+xrBTgI0wB866DSkg8Rgr8zD+POUMiKPrGqAO/XhrcmRDL+COURFNDRh9WGeAua6hdiNoufQYvXPl1iWyIYidSDbfmC2wR6F9vVkhg/6KDZyw8Wlr6LUh0RYT+hUHEwwGbz7MeqZJcJQSTpECPF5pnk8NTHL2W/XThaewB4n4HYqjDUbYLmBDLYWsDDMgoPo709a309rTq3uEe0YBgVF8g9aGxucTDhz+/LYYzqaeSxclUwen9Z4BGZjiDSPBZfooOEQEEwIJlViQ2kl1VeOKAmkiWEUVfItivmNbC/PNZchklmfFsGpiu4DT9UU9YVBN2OTcFYHHsslcaqrR7SuesqjluaGjG46oYEmfQlkZ4gXhavdWXw2ant+Tv6HRo4trqjoD1e3jUkN6gJMWomxOeRBTg0czBZlz/IwUtTpBHcKhi3EqGQo8OuQtWww+Ts7ySmeoONuovYUsIAppNuOubfUxvFJoTr2vKbWNAiYetw09kddkjmBe+S8A5PUiFOi262mfc7g5wJwPPP7wpTBY0Fya+2BCPzXqRLMOtNI+1tW3/UQLZYvEY8J0TxmhoAGZaRn8FKaosatRxDZTQS6QUNmKxpmUspkRKzTXN5lznM=",
  };

  const defaultProofGeneratorData: IGenerateData = {
    tallyProofs: [],
    processProofs: [],
    tallyData: {} as TallyData,
  };

  const mockGeneratorService = {
    generate: jest.fn(),
  };

  const mockEmit = jest.fn();

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [ProofGateway] })
      .useMocker((token) => {
        if (token === ProofGeneratorService) {
          mockGeneratorService.generate.mockImplementation((_, options?: IGenerateProofsOptions) => {
            options?.onBatchComplete?.({ current: 1, total: 2, proofs: defaultProofGeneratorData.processProofs });
            options?.onComplete?.(
              defaultProofGeneratorData.processProofs.concat(defaultProofGeneratorData.tallyProofs),
              defaultProofGeneratorData.tallyData,
            );
            options?.onFail?.(new Error("error"));
          });

          return mockGeneratorService;
        }

        return jest.fn();
      })
      .compile();

    gateway = testModule.get<ProofGateway>(ProofGateway);

    gateway.server = { emit: mockEmit } as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should be defined", () => {
    expect(gateway).toBeDefined();
  });

  test("should start proof generation properly", async () => {
    await gateway.generate(defaultProofGeneratorArgs);

    expect(mockEmit).toHaveBeenCalledTimes(3);
    expect(mockEmit).toHaveBeenNthCalledWith(1, EProofGenerationEvents.PROGRESS, {
      current: 1,
      total: 2,
      proofs: defaultProofGeneratorData.processProofs,
    });
    expect(mockEmit).toHaveBeenNthCalledWith(2, EProofGenerationEvents.FINISH, {
      proofs: defaultProofGeneratorData.processProofs.concat(defaultProofGeneratorData.tallyProofs),
      tallyData: defaultProofGeneratorData.tallyData,
    });
    expect(mockEmit).toHaveBeenNthCalledWith(3, EProofGenerationEvents.ERROR, { message: "error" });
  });
});
