import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { IGetPublicKeyData } from "./file/types";
import type { IGenerateData } from "./proof/types";

import { AccountSignatureGuard, Public } from "./auth/AccountSignatureGuard.service";
import { FileService } from "./file/file.service";
import { GenerateProofDto } from "./proof/dto";
import { ProofGeneratorService } from "./proof/proof.service";

@ApiTags("v1/proof")
@ApiBearerAuth()
@Controller("v1/proof")
@UseGuards(AccountSignatureGuard)
export class AppController {
  /**
   * Logger
   */
  private readonly logger = new Logger(AppController.name);

  /**
   * Initialize AppController
   *
   * @param proofGeneratorService - proof generator service
   * @param fileService - file service
   */
  constructor(
    private readonly proofGeneratorService: ProofGeneratorService,
    private readonly fileService: FileService,
  ) {}

  /**
   * Generate proofs api method
   *
   * @param args - generate proof dto
   * @returns
   */
  @ApiBody({ type: GenerateProofDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The proofs have been successfully generated" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("generate")
  async generate(@Body() args: GenerateProofDto): Promise<IGenerateData> {
    return this.proofGeneratorService.generate(args).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }

  /**
   * Get RSA public key for authorization setup
   *
   * @returns RSA public key
   */
  @ApiResponse({ status: HttpStatus.OK, description: "Public key was successfully returned" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Public()
  @Get("publicKey")
  async getPublicKey(): Promise<IGetPublicKeyData> {
    return this.fileService.getPublicKey().catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
