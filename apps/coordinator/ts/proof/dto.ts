import { ESupportedChains, EMode } from "@maci-protocol/sdk";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsEthereumAddress, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import type { Hex } from "viem";

/**
 * Data transfer object for generate proof
 */
export class GenerateProofDto {
  /**
   * Poll id
   */
  @ApiProperty({
    description: "Poll id",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  poll!: number;

  /**
   * Maci contract address
   */
  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciContractAddress!: string;

  /**
   * Voting mode
   */
  @ApiProperty({
    description: "Voting mode (qv: 0, non-qv: 1, full: 2)",
    type: Number,
  })
  @IsEnum(EMode)
  mode!: EMode;

  /**
   * Start block for event processing
   */
  @ApiProperty({
    description: "Start block for event parsing",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  startBlock?: number;

  /**
   * End block for event processing
   */
  @ApiProperty({
    description: "End block for event parsing",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  endBlock?: number;

  /**
   * Blocks per batch for event processing
   */
  @ApiProperty({
    description: "Blocks per batch for event parsing",
    minimum: 1,
    maximum: 1000,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  blocksPerBatch?: number;

  @ApiProperty({
    description: "Session key address",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress()
  sessionKeyAddress?: Hex;

  @ApiProperty({
    description: "Approval",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  chain!: ESupportedChains;
}

/**
 * Data transfer object for merge trees
 */
export class MergeTreesDto {
  /**
   * Poll id
   */
  @ApiProperty({
    description: "Poll id",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  poll!: number;

  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciContractAddress!: string;

  @ApiProperty({
    description: "Session key address",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress()
  sessionKeyAddress?: string;

  @ApiProperty({
    description: "Approval",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  chain!: ESupportedChains;
}

/**
 * Data transfer object for submit proofs on-chain
 */
export class SubmitProofsDto {
  /**
   * Poll id
   */
  @ApiProperty({
    description: "Poll id",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  pollId!: number;

  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciContractAddress!: Hex;

  @ApiProperty({
    description: "Session key address",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress()
  sessionKeyAddress?: Hex;

  @ApiProperty({
    description: "Approval",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  chain!: ESupportedChains;
}
