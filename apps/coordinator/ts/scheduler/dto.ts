import { EMode, ESupportedChains } from "@maci-protocol/sdk";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsEthereumAddress, IsInt, IsOptional, IsString, Min } from "class-validator";

import type { Hex } from "viem";

/**
 * Data transfer object for scheduled poll
 */
export class IdentityScheduledPollDto {
  /**
   * MACI contract address
   */
  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciAddress!: Hex;

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
 * Data transfer object for registering a poll for finalization
 */
export class SchedulePollWithSignerDto extends IdentityScheduledPollDto {
  /**
   * Deployment block number
   */
  @ApiProperty({
    description: "Deployment block number",
    type: Number,
  })
  @IsInt()
  @Min(0)
  deploymentBlockNumber!: number;

  /**
   * Voting mode
   */
  @ApiProperty({
    description: "Voting mode",
    enum: EMode,
    type: String,
  })
  @IsEnum(EMode)
  mode!: EMode;

  /**
   * Session key address for Account Abstraction signer
   */
  @ApiProperty({
    description: "Session key address",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress()
  sessionKeyAddress?: Hex;

  /**
   * Approval for Account Abstraction signer
   */
  @ApiProperty({
    description: "Approval",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  approval?: string;
}
