import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";

import type { Hex } from "viem";

/**
 * Data transfer object for Deactivate session key
 */
export class DeactivateSessionKeyDto {
  /**
   * Session key address
   */
  @ApiProperty({
    description: "Session key address",
    type: String,
  })
  @IsEthereumAddress()
  sessionKeyAddress!: Hex;
}
