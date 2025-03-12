import type { Hex } from "viem";

/**
 * Generate session key return type
 */
export interface IGenerateSessionKeyReturn {
  /**
   * Session key address
   */
  sessionKeyAddress: Hex;
}
