import type { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import type { ethers } from "ethers";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    // We omit the ethers field because it is redundant.
    ethers: typeof ethers & HardhatEthersHelpers;
  }
}
