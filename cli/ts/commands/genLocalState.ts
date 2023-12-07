import { getDefaultSigner, genMaciStateFromContract } from "maci-contracts";
import { promptSensitiveValue, banner, contractExists, logError, logYellow, readContractAddress, info } from "../utils";
import { Keypair, PrivKey } from "maci-domainobjs";
import { JsonRpcProvider } from "ethers";
import { writeFileSync } from "fs";

/**
 * Generate a local MACI state from the smart contracts events
 * @param outputPath - the path where to write the state
 * @param pollId - the id of the poll
 */
export const genLocalState = async (
  outputPath: string,
  pollId: number,
  maciContractAddress?: string,
  coordinatorPrivateKey?: string,
  ethereumProvider?: string,
  endBlock?: number,
  startBlock?: number,
  blockPerBatch?: number,
  transactionHash?: string,
  sleep?: number,
  quiet = true,
) => {
  banner(quiet);

  // validation of the maci contract address
  if (!readContractAddress("MACI") && !maciContractAddress) logError("MACI contract address is empty");

  const maciAddress = maciContractAddress ? maciContractAddress : readContractAddress("MACI");

  const signer = await getDefaultSigner();
  if (!(await contractExists(signer.provider, maciAddress))) logError("MACI contract does not exist");

  if (!readContractAddress(`Poll-${pollId}`)) logError(`There is no poll with id ${pollId}`);
  if (!(await contractExists(signer.provider, readContractAddress(`Poll-${pollId}`))))
    logError(`Poll-${pollId} contract's is not deployed on this network`);

  // if no private key is passed we ask it securely
  const coordPrivKey = coordinatorPrivateKey
    ? coordinatorPrivateKey
    : await promptSensitiveValue("Insert your MACI private key");
  if (!PrivKey.isValidSerializedPrivKey(coordPrivKey)) logError("Invalid MACI private key");

  const coordinatorMaciPrivKey = PrivKey.deserialize(coordPrivKey);
  const coordinatorKeypair = new Keypair(coordinatorMaciPrivKey);

  // calculate the end block number
  const endBlockNumber = endBlock ? endBlock : await signer.provider.getBlockNumber();

  let fromBlock = startBlock ? startBlock : 0;
  if (transactionHash) {
    const txn = await signer.provider.getTransaction(transactionHash);
    fromBlock = txn.blockNumber;
  }

  const provider = ethereumProvider ? new JsonRpcProvider(ethereumProvider) : signer.provider;

  logYellow(
    quiet,
    info(`Fetching logs from ${fromBlock} till ${endBlockNumber} and generating the offline maci state`),
  );
  const maciState = await genMaciStateFromContract(
    provider,
    maciAddress,
    coordinatorKeypair,
    pollId,
    fromBlock,
    blockPerBatch ? blockPerBatch : 50,
    endBlockNumber,
    sleep,
  );

  // write the state to a file
  const serializedState = maciState.toJSON();
  writeFileSync(outputPath, JSON.stringify(serializedState, null, 4));
};
