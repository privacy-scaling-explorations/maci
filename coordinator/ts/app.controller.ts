import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AccountSignatureGuard } from "./auth/AccountSignatureGuard.service";
import { GenerateProofDto } from "./proof/dto";
import { ProofGeneratorService } from "./proof/proof.service";
import { IGenerateData } from "./proof/types";

@ApiTags("v1/proof")
@ApiHeader({
  name: "Authorization",
  description: "The value is encrypted with RSA public key you generated before (see README.md)",
})
@Controller("v1/proof")
@UseGuards(AccountSignatureGuard)
export class AppController {
  constructor(private readonly proofGeneratorService: ProofGeneratorService) {}

  @ApiBody({ type: GenerateProofDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The proofs have been successfully generated" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("generate")
  async generate(@Body() args: GenerateProofDto): Promise<IGenerateData> {
    return this.proofGeneratorService.generate(args).catch((error: Error) => {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
