import type { Action, SnarkProof, Groth16Proof } from "./types";
import type { Ownable } from "../typechain-types";
import type { FeeData, Network, Signer } from "ethers";

/**
 * Format a SnarkProof type to an array of strings
 * which can be passed to the Groth16 verifier contract.
 * @param proof the SnarkProof to format
 * @returns an array of strings
 */
export const formatProofForVerifierContract = (proof: SnarkProof | Groth16Proof): string[] =>
  [
    proof.pi_a[0],
    proof.pi_a[1],

    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],

    proof.pi_c[0],
    proof.pi_c[1],
  ].map((x) => x.toString());

/**
 * Pause the thread for n milliseconds
 * @param ms - the amount of time to sleep in milliseconds
 */
export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * The comparision function for Actions based on block number and transaction
 * index.
 * @param actions - the array of actions to sort
 * @returns the sorted array of actions
 */
export function sortActions(actions: Action[]): Action[] {
  return actions.slice().sort((a, b) => {
    if (a.blockNumber > b.blockNumber) {
      return 1;
    }

    if (a.blockNumber < b.blockNumber) {
      return -1;
    }

    if (a.transactionIndex > b.transactionIndex) {
      return 1;
    }

    if (a.transactionIndex < b.transactionIndex) {
      return -1;
    }

    return 0;
  });
}

/**
 * Print to the console
 * @param msg - the message to print
 * @param quiet - whether to suppress console output
 */
export const log = (msg: string, quiet: boolean): void => {
  if (!quiet) {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
};

/**
 * Get the default signer from the hardhat node
 * @returns the default signer
 */
export const getDefaultSigner = async (): Promise<Signer> => {
  const { ethers } = await import("hardhat");

  const [signer] = await ethers.getSigners();

  return signer;
};

/**
 * Get the default signer network from the hardhat node
 * @returns the default network
 */
export const getDefaultNetwork = async (): Promise<Network | undefined> => {
  const signer = await getDefaultSigner();

  return signer.provider?.getNetwork();
};

/**
 * Get all of the available signers from the hardhat node
 * @dev to be used while testing
 * @returns the signers
 */
export const getSigners = async (): Promise<Signer[]> => {
  const { ethers } = await import("hardhat");

  return ethers.getSigners();
};

/**
 * Get the current fee data from the blockchain node.
 * This is needed to ensure transaction go through in busy times
 * @returns - the fee data
 */
export const getFeeData = async (): Promise<FeeData | undefined> => {
  const signer = await getDefaultSigner();
  return signer.provider?.getFeeData();
};

/**
 * Transfer ownership of a contract (using Ownable from OpenZeppelin)
 * @param contract - the contract to transfer ownership of
 * @param newOwner - the address of the new owner
 * @param quiet - whether to suppress console output
 */
export const transferOwnership = async <T extends Ownable>(
  contract: T,
  newOwner: string,
  quiet = false,
): Promise<void> => {
  log(`Transferring ownership of ${await contract.getAddress()} to ${newOwner}`, quiet);
  const tx = await contract.transferOwnership(newOwner, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });

  await tx.wait();
};
