import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsEthereumAddress, IsInt, IsOptional, IsString, Min } from "class-validator";

import type { Hex } from "viem";

import { ESupportedNetworks } from "../common";

/**
 * Data transfer object for scheduled poll
 */
export class PollScheduledDto {
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
  maciAddress!: Hex;

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
 * Data transfer object for registering a poll for finalization
 */
export class RegisterPollDto extends PollScheduledDto {
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
}
