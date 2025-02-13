import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsEthereumAddress, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

import type { Hex } from "viem";

import { ESupportedNetworks } from "../common";

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
   * Tally contract address
   */
  @ApiProperty({
    description: "Tally contract address",
    type: String,
  })
  @IsEthereumAddress()
  tallyContractAddress!: string;

  /**
   * Whether to use Qv or NonQv
   */
  @ApiProperty({
    description: "Whether to use quadratic voting or not",
    type: Boolean,
  })
  @IsBoolean()
  useQuadraticVoting!: boolean;

  /**
   * Encrypted coordinator private key with RSA public key (see .env.example)
   */
  @ApiProperty({
    description: "Encrypted coordinator private key with RSA public key (see README.md)",
    minimum: 1,
    maximum: 1024,
    type: String,
  })
  @IsString()
  @Length(1, 1024)
  encryptedCoordinatorPrivateKey!: string;

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
  })
  @IsEthereumAddress()
  sessionKeyAddress!: string;

  @ApiProperty({
    description: "Approval",
    type: String,
  })
  @IsString()
  approval!: string;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedNetworks,
  })
  @IsEnum(ESupportedNetworks)
  chain!: ESupportedNetworks;
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
    description: "Tally contract address",
    type: String,
  })
  @IsEthereumAddress()
  tallyContractAddress!: Hex;

  @ApiProperty({
    description: "Session key address",
    type: String,
  })
  @IsEthereumAddress()
  sessionKeyAddress!: Hex;

  @ApiProperty({
    description: "Approval",
    type: String,
  })
  @IsString()
  approval!: string;

  /**
   * Chain Name
   */
  @ApiProperty({
    description: "Chain to which to deploy the contract(s)",
    enum: ESupportedNetworks,
  })
  @IsEnum(ESupportedNetworks)
  chain!: ESupportedNetworks;
}
