import { HttpException, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import type { IGenerateArgs, IGenerateData } from "./proof/types";
import type { TallyData } from "maci-cli";

import { AppController } from "./app.controller";
import { ProofGeneratorService } from "./proof/proof.service";

describe("AppController", () => {
  let appController: AppController;

  const defaultProofGeneratorArgs: IGenerateArgs = {
    poll: 0n,
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

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [AppController],
    })
      .useMocker((token) => {
        if (token === ProofGeneratorService) {
          mockGeneratorService.generate.mockResolvedValue(defaultProofGeneratorData);

          return mockGeneratorService;
        }

        return jest.fn();
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/proof", () => {
    test("should return generated proof data", async () => {
      const data = await appController.generate(defaultProofGeneratorArgs);
      expect(data).toStrictEqual(defaultProofGeneratorData);
    });

    test("should throw an error if proof generation if failed", async () => {
      const error = new Error("error");
      mockGeneratorService.generate.mockRejectedValue(error);

      await expect(appController.generate(defaultProofGeneratorArgs)).rejects.toThrow(
        new HttpException("BadRequest", HttpStatus.BAD_REQUEST, { cause: error.message }),
      );
    });
  });
});
