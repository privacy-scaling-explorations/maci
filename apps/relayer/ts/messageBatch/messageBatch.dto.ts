import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, Validate } from "class-validator";

import { Message } from "../message/message.schema";

import { IpfsHashValidator } from "./validation";

/**
 * Max messages per batch
 */
const MAX_MESSAGES = 100;

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
