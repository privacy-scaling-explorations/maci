import { createContractFactory, deployContractWithLinkedLibraries } from "@maci-protocol/contracts";

import type { IDeployFactoryArgs } from "./types";

export const DEFAULT_INITIAL_VOICE_CREDITS = 100;

/**
 * Deploy a factory
 * @param factory - Factory to deploy
 * @param signer - Signer to use
 * @param args - Arguments to pass to the factory
 * @returns Deployed factory
 */
export const deployFactoryWithLinkedLibraries = async ({
  abi,
  bytecode,
  signer,
  args,
  address,
}: IDeployFactoryArgs): Promise<string> => {
  if (address) {
    return address;
  }

  const contractFactory = await createContractFactory(abi, bytecode, signer);

  const contractFactoryContract = await deployContractWithLinkedLibraries(contractFactory, signer, ...(args ?? []));
  return contractFactoryContract.getAddress();
};
