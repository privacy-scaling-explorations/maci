import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";

import { AccountSignatureGuard } from "./auth/AccountSignatureGuard.service";
import { GenerateProofDto } from "./proof/dto";
import { ProofGeneratorService } from "./proof/proof.service";
import { IGenerateData } from "./proof/types";

@Controller("v1/proof")
@UseGuards(AccountSignatureGuard)
export class AppController {
  constructor(private readonly proofGeneratorService: ProofGeneratorService) {}

  @Post("generate")
  async generate(@Body() args: GenerateProofDto): Promise<IGenerateData> {
    return this.proofGeneratorService.generate(args).catch((error: Error) => {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
