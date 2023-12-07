import type { EthereumProvider } from "hardhat/types";

export async function timeTravel(provider: EthereumProvider, seconds: number): Promise<void> {
  await provider.send("evm_increaseTime", [Number(seconds)]);
  await provider.send("evm_mine", []);
}
