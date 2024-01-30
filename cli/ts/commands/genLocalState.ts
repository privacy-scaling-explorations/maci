import { JsonRpcProvider } from "ethers";
import { getDefaultSigner, getDefaultNetwork, genMaciStateFromContract } from "maci-contracts";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";

import {
  promptSensitiveValue,
  banner,
  contractExists,
  logError,
  logYellow,
  readContractAddress,
  info,
  logGreen,
  success,
  type GenLocalStateArgs,
} from "../utils";

/**
 * Generate a local MACI state from the smart contracts events
 * @param GenLocalStateArgs - The arguments for the genLocalState command
 */
export const genLocalState = async ({
  outputPath,
  pollId,
  maciContractAddress,
  coordinatorPrivateKey,
  ethereumProvider,
  endBlock,
  startBlock,
  blockPerBatch,
  transactionHash,
  sleep,
  signer,
  quiet = true,
}: GenLocalStateArgs): Promise<void> => {
  banner(quiet);

  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();

  // validation of the maci contract address
  if (!readContractAddress("MACI", network?.name) && !maciContractAddress) {
    logError("MACI contract address is empty");
  }

  const maciAddress = maciContractAddress || readContractAddress("MACI", network?.name);

  if (!(await contractExists(ethSigner.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  // if no private key is passed we ask it securely
  const coordPrivKey = coordinatorPrivateKey || (await promptSensitiveValue("Insert your MACI private key"));
  if (!PrivKey.isValidSerializedPrivKey(coordPrivKey)) {
    logError("Invalid MACI private key");
  }

  const coordinatorMaciPrivKey = PrivKey.deserialize(coordPrivKey);
  const coordinatorKeypair = new Keypair(coordinatorMaciPrivKey);

  // calculate the end block number
  const endBlockNumber = endBlock || (await ethSigner.provider!.getBlockNumber());

  let fromBlock = startBlock || 0;
  if (transactionHash) {
    const tx = await ethSigner.provider!.getTransaction(transactionHash);
    fromBlock = tx?.blockNumber ?? 0;
  }

  const provider = ethereumProvider ? new JsonRpcProvider(ethereumProvider) : ethSigner.provider;

  logYellow(
    quiet,
    info(`Fetching logs from ${fromBlock} till ${endBlockNumber} and generating the offline maci state`),
  );

  const maciState = await genMaciStateFromContract(
    provider!,
    maciAddress,
    coordinatorKeypair,
    pollId,
    fromBlock,
    blockPerBatch || 50,
    endBlockNumber,
    sleep,
  );

  // write the state to a file
  const serializedState = maciState.toJSON();
  fs.writeFileSync(outputPath, JSON.stringify(serializedState, null, 4));

  logGreen(quiet, success(`The state has been written to ${outputPath}`));
};
