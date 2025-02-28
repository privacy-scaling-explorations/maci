/* eslint-disable @typescript-eslint/no-shadow */
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { IGenerateData, IMergeArgs } from "./types";
import type { IGetPublicKeyData } from "../file/types";

import { AccountSignatureGuard, Public } from "../auth/AccountSignatureGuard.service";
import { FileService } from "../file/file.service";

import { GenerateProofDto, MergeTreesDto, SubmitProofsDto } from "./dto";
import { ProofGeneratorService } from "./proof.service";

@ApiTags("v1/proof")
@ApiBearerAuth()
@Controller("v1/proof")
@UseGuards(AccountSignatureGuard)
export class ProofController {
  /**
   * Logger
   */
  private readonly logger = new Logger(ProofController.name);

  /**
   * Initialize ProofController
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
   * @returns generated proofs and tally data
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
   * Merge trees api method
   *
   * @param args - merge args
   * @returns whether the trees were successfully merged
   */
  @ApiBody({ type: MergeTreesDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The proofs have been successfully merged" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("merge")
  async merge(@Body() args: IMergeArgs): Promise<boolean> {
    return this.proofGeneratorService.merge(args).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }

  /**
   * Submit proofs on-chain api method
   * @param args - submit proofs on-chain args
   */
  @ApiBody({ type: SubmitProofsDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The proofs have been successfully submitted" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("submit")
  async submit(@Body() args: SubmitProofsDto): Promise<boolean> {
    return this.proofGeneratorService.submit(args).catch((error: Error) => {
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
