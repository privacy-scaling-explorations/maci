import { BaseContract } from "ethers";
import { type MACI, type Poll, getDefaultSigner, getDefaultNetwork, parseArtifact } from "maci-contracts";

import { type TopupArgs, logError, readContractAddress, contractExists, banner } from "../utils";

/**
 * Publish a topup message
 * @param TopupArgs - The arguments for the topup command
 */
export const topup = async ({
  amount,
  stateIndex,
  pollId,
  maciAddress,
  signer,
  quiet = true,
}: TopupArgs): Promise<void> => {
  banner(quiet);
  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();

  // ensure we have a valid MACI contract address
  if (!maciAddress && !readContractAddress(maciAddress!, network?.name)) {
    logError("Invalid MACI contract address");
    return;
  }

  const maciContractAddress = maciAddress || readContractAddress(maciAddress!, network?.name);

  if (!(await contractExists(ethSigner.provider!, maciContractAddress))) {
    logError("There is no contract deployed at the specified address");
  }

  // validate the params
  if (amount < 1) {
    logError("Topup amount must be greater than 0");
  }

  if (stateIndex < 1) {
    logError("State index must be greater than 0");
  }

  if (pollId < 0) {
    logError("Poll ID must be a positive integer");
  }

  const maciContractAbi = parseArtifact("MACI")[0];
  const maciContract = new BaseContract(maciContractAddress, maciContractAbi, ethSigner) as MACI;
  const pollContractAbi = parseArtifact("Poll")[0];
  const pollAddr = await maciContract.getPoll(pollId);

  if (!(await contractExists(ethSigner.provider!, pollAddr))) {
    logError("There is no Poll contract with this poll ID linked to the specified MACI contract.");
  }

  const pollContract = new BaseContract(pollAddr, pollContractAbi, ethSigner) as Poll;

  try {
    // submit the topup message on chain
    const tx = await pollContract.topup(stateIndex, amount.toString(), {
      gasLimit: 1000000,
    });
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("The transaction failed");
    }
  } catch (error) {
    logError((error as Error).message);
  }
};
