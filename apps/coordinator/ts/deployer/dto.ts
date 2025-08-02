import { ESupportedChains } from "@maci-protocol/sdk";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

import type { IDeployMaciConfig, IDeployPollConfig } from "./types";
import type { Hex } from "viem";

/**
 * Data transfer object for MACI contracts deployment
 */
export class DeployerServiceDeployMaciDto {
  /**
   * Session Key Approval string
   */
  @ApiProperty({
    description: "Session Key Approval string",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;

  /**
   * Address of the session key
   */
  @ApiProperty({
    description: "Address of the session key",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionKeyAddress?: Hex;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  chain!: ESupportedChains;

  /**
   * Config
   */
  @ApiProperty({
    description: "Deployment configuration",
    type: Object,
  })
  config!: IDeployMaciConfig;
}

/**
 * Data transfer object for Poll contract deployment
 */
export class DeployerServiceDeployPollDto {
  /**
   * Session Key Approval string
   */
  @ApiProperty({
    description: "Session Key Approval string",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;

  /**
   * Address of the session key
   */
  @ApiProperty({
    description: "Address of the session key",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionKeyAddress?: Hex;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  chain!: ESupportedChains;

  /**
   * Config
   */
  @ApiProperty({
    description: "Deployment configuration",
    type: Object,
  })
  config!: IDeployPollConfig;
}
