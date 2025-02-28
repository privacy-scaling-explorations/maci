/* eslint-disable @typescript-eslint/no-shadow */
import { Body, Controller, HttpException, HttpStatus, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { IDeploySubgraphReturn } from "./types";

import { AccountSignatureGuard } from "../auth/AccountSignatureGuard.service";

import { DeploySubgraphDto } from "./dto";
import { SubgraphService } from "./subgraph.service";

@ApiTags("v1/subgraph")
@ApiBearerAuth()
@Controller("v1/subgraph")
@UseGuards(AccountSignatureGuard)
export class SubgraphController {
  /**
   * Logger
   */
  private readonly logger = new Logger(SubgraphController.name);

  /**
   * Initialize SubgraphController
   *
   * @param subgraphService - subgraph service
   */
  constructor(private readonly subgraphService: SubgraphService) {}

  /**
   * Generate proofs api method
   *
   * @param args - generate proof dto
   * @returns generated proofs and tally data
   */
  @ApiBody({ type: DeploySubgraphDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The subgraph was successfully deployed" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("deploy")
  async deploy(@Body() args: DeploySubgraphDto): Promise<IDeploySubgraphReturn> {
    return this.subgraphService.deploy(args).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
