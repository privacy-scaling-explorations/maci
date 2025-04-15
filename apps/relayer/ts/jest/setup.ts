import dotenv from "dotenv";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore type import
import type { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import type { ethers } from "ethers";

dotenv.config();

declare module "hardhat/types/runtime.js" {
  interface HardhatRuntimeEnvironment {
    // We omit the ethers field because it is redundant.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore commonjs and esm imports fix
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ethers: typeof ethers & HardhatEthersHelpers;
  }
}
