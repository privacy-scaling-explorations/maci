import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEthereumAddress,
  IsInt,
  Min,
  Validate,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  ArrayNotEmpty,
  IsString,
} from "class-validator";
import { Message } from "maci-domainobjs";

import { PublicKeyValidator } from "./validation";

/**
 * Max messages per batch
 */
export const MAX_MESSAGES = Number(process.env.MAX_MESSAGES);

/**
 * Data transfer object for user message
 */
export class MessageContractParamsDto {
  /**
   * Message data
   */
  @ApiProperty({
    description: "Message data",
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(Message.DATA_LENGTH)
  @ArrayMaxSize(Message.DATA_LENGTH)
  data!: string[];

  /**
   * Public key
   */
  @ApiProperty({
    description: "Public key",
    type: String,
  })
  @Validate(PublicKeyValidator)
  publicKey!: string;
}

/**
 * Data transfer object for publish messages
 */
export class PublishMessagesDto {
  /**
   * State leaf index
   */
  @ApiProperty({
    description: "State leaf index",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  stateLeafIndex!: number;

  /**
   * User poll joined proof
   */
  @ApiProperty({
    description: "User poll joined proof",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  proof!: string[];

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
   * Messages
   */
  @ApiProperty({
    description: "User messages with public key",
    type: [MessageContractParamsDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => MessageContractParamsDto)
  messages!: MessageContractParamsDto[];
}
