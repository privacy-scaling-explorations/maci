import type { IGetProxyContractArgs } from "./types";
import type { BaseContract } from "ethers";

/**
 * Get proxy contract from deployed proxy factory contract and receipt.
 *
 * @param args get proxy contract arguments
 * @returns proxied contract
 */
export const getProxyContract = async <T = BaseContract>({
  factory,
  proxyFactory,
  receipt,
  signer,
}: IGetProxyContractArgs): Promise<T> => {
  if (!signer) {
    throw new Error("No signer provided");
  }

  const address = await proxyFactory
    .queryFilter(proxyFactory.filters.CloneDeployed, receipt?.blockNumber, receipt?.blockNumber)
    .then(([event]) => event.args[0]);

  return factory.connect(signer).attach(address) as T;
};
