import { MACI__factory as MACIFactory } from "@maci-protocol/contracts";

import type { IGetMACIDeploymentBlockArgs } from "./types";

/**
 * @notice Get the deployment block of a MACI contract
 *
 * @param maciAddress The address of the MACI contract
 * @param signer The signer to use to get the deployment block
 * @returns The deployment block of the MACI contract
 */
export const getMACIDeploymentBlock = async ({ maciAddress, signer }: IGetMACIDeploymentBlockArgs): Promise<bigint> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const deploymentBlock = await maciContract.deploymentBlock();

  return deploymentBlock;
};
