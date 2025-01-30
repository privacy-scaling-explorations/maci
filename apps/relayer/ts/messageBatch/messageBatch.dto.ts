import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Validate,
  IsInt,
  IsPositive,
  Max,
  IsEthereumAddress,
  Min,
  IsOptional,
  IsString,
} from "class-validator";

import { Message } from "../message/message.schema";
import { PublicKeyValidator } from "../message/validation";

import { IpfsHashValidator } from "./validation";

/**
 * Max messages per batch
 */
export const MAX_MESSAGES = Number(process.env.MAX_MESSAGES);

/**
 * Data transfer object for message batch
 */
export class MessageBatchDto {
  /**
   * Messages
   */
  @ApiProperty({
    description: "Messages",
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_MESSAGES)
  @ValidateNested({ each: true })
  messages!: Message[];

  /**
   * IPFS hash
   */
  @ApiProperty({
    description: "IPFS hash",
    type: String,
  })
  @Validate(IpfsHashValidator)
  ipfsHash!: string;
}

/**
 * Data transfer object for getting message batches
 */
export class GetMessageBatchesDto {
  /**
   * Limit
   */
  @ApiProperty({
    description: "Limit",
    minimum: 1,
    maximum: MAX_MESSAGES,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  @Max(MAX_MESSAGES)
  limit!: number;

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
   * IPFS hashes
   */
  @ApiProperty({
    description: "IPFS hashes",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_MESSAGES)
  @Validate(IpfsHashValidator, { each: true })
  ipfsHashes?: string[];

  /**
   * Public key
   */
  @ApiProperty({
    description: "Public key",
    type: String,
  })
  @IsOptional()
  @Validate(PublicKeyValidator)
  publicKey?: string;
}
