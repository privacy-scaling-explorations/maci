import { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types";

import type { Chain, Hex, HttpTransport, Transport } from "viem";

/**
 * Generate session key return type
 */
export interface IGenerateSessionKeyReturn {
  /**
   * Session key address
   */
  sessionKeyAddress: Hex;
}

export type KernelClient = KernelAccountClient<
  ENTRYPOINT_ADDRESS_V07_TYPE,
  Transport,
  Chain,
  KernelSmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE, HttpTransport, Chain>
>;
