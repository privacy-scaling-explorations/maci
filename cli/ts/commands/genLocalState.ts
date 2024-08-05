import { JsonRpcProvider } from "ethers";
import {
  MACI__factory as MACIFactory,
  AccQueue__factory as AccQueueFactory,
  Poll__factory as PollFactory,
  genMaciStateFromContract,
} from "maci-contracts";
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
  maciAddress,
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

  const network = await signer.provider?.getNetwork();

  // validation of the maci contract address
  const maciContractAddress = maciAddress || (await readContractAddress("MACI", network?.name));

  if (!maciContractAddress) {
    logError("MACI contract address is empty");
  }

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  // if no private key is passed we ask it securely
  const coordPrivKey = coordinatorPrivateKey || (await promptSensitiveValue("Insert your MACI private key"));
  if (!PrivKey.isValidSerializedPrivKey(coordPrivKey)) {
    logError("Invalid MACI private key");
  }

  const coordinatorMaciPrivKey = PrivKey.deserialize(coordPrivKey);
  const coordinatorKeypair = new Keypair(coordinatorMaciPrivKey);

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollContracts.poll))) {
    logError("Poll contract does not exist");
  }
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const [{ messageAq }, { messageTreeDepth }] = await Promise.all([
    pollContract.extContracts(),
    pollContract.treeDepths(),
  ]);
  const messageAqContract = AccQueueFactory.connect(messageAq, signer);

  const [defaultStartBlockSignup, defaultStartBlockPoll, stateRoot, numSignups, messageRoot] = await Promise.all([
    maciContract.queryFilter(maciContract.filters.SignUp(), startBlock).then((events) => events[0]?.blockNumber ?? 0),
    maciContract
      .queryFilter(maciContract.filters.DeployPoll(), startBlock)
      .then((events) => events[0]?.blockNumber ?? 0),
    maciContract.getStateTreeRoot(),
    maciContract.numSignUps(),
    messageAqContract.getMainRoot(messageTreeDepth),
  ]);
  const defaultStartBlock = Math.min(defaultStartBlockPoll, defaultStartBlockSignup);
  let fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

  const defaultEndBlock = await Promise.all([
    pollContract
      .queryFilter(pollContract.filters.MergeMessageAq(messageRoot), fromBlock)
      .then((events) => events[events.length - 1]?.blockNumber),
    pollContract
      .queryFilter(pollContract.filters.MergeMaciState(stateRoot, numSignups), fromBlock)
      .then((events) => events[events.length - 1]?.blockNumber),
  ]).then((blocks) => Math.max(...blocks));

  if (transactionHash) {
    const tx = await signer.provider!.getTransaction(transactionHash);
    fromBlock = tx?.blockNumber ?? defaultStartBlock;
  }

  // calculate the end block number
  const endBlockNumber = endBlock || defaultEndBlock;

  if (transactionHash) {
    const tx = await signer.provider!.getTransaction(transactionHash);
    fromBlock = tx?.blockNumber ?? defaultStartBlock;
  }

  const provider = ethereumProvider ? new JsonRpcProvider(ethereumProvider) : signer.provider;

  logYellow(
    quiet,
    info(`Fetching logs from ${fromBlock} till ${endBlockNumber} and generating the offline maci state`),
  );

  const maciState = await genMaciStateFromContract(
    provider!,
    maciContractAddress,
    coordinatorKeypair,
    pollId,
    fromBlock,
    blockPerBatch || 50,
    endBlockNumber,
    sleep,
  );

  // write the state to a file
  const serializedState = maciState.toJSON();
  await fs.promises.writeFile(outputPath, JSON.stringify(serializedState, null, 4));

  logGreen(quiet, success(`The state has been written to ${outputPath}`));
};
