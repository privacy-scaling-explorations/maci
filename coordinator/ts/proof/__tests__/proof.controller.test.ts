import { HttpException, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import type { IGetPublicKeyData } from "../../file/types";
import type { IGenerateArgs, IGenerateData } from "../types";
import type { TallyData } from "maci-cli";

import { FileService } from "../../file/file.service";
import { ProofController } from "../proof.controller";
import { ProofGeneratorService } from "../proof.service";

describe("ProofController", () => {
  let proofController: ProofController;

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

  const defaultPublicKeyData: IGetPublicKeyData = {
    publicKey: "key",
  };

  const mockGeneratorService = {
    generate: jest.fn(),
  };

  const mockFileService = {
    getPublicKey: jest.fn(),
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [ProofController],
    })
      .useMocker((token) => {
        if (token === ProofGeneratorService) {
          mockGeneratorService.generate.mockResolvedValue(defaultProofGeneratorData);

          return mockGeneratorService;
        }

        if (token === FileService) {
          mockFileService.getPublicKey.mockResolvedValue(defaultPublicKeyData);

          return mockFileService;
        }

        return jest.fn();
      })
      .compile();

    proofController = app.get<ProofController>(ProofController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/proof/generate", () => {
    test("should return generated proof data", async () => {
      const data = await proofController.generate(defaultProofGeneratorArgs);
      expect(data).toStrictEqual(defaultProofGeneratorData);
    });

    test("should throw an error if proof generation is failed", async () => {
      const error = new Error("error");
      mockGeneratorService.generate.mockRejectedValue(error);

      await expect(proofController.generate(defaultProofGeneratorArgs)).rejects.toThrow(
        new HttpException(error.message, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe("v1/proof/publicKey", () => {
    test("should return public key properly", async () => {
      const data = await proofController.getPublicKey();
      expect(data).toStrictEqual(defaultPublicKeyData);
    });

    test("should throw an error if file service throws an error", async () => {
      const error = new Error("error");
      mockFileService.getPublicKey.mockRejectedValue(error);

      await expect(proofController.getPublicKey()).rejects.toThrow(
        new HttpException(error.message, HttpStatus.BAD_REQUEST),
      );
    });
  });
});
