import { extractVk, genProof, verifyProof } from "maci-circuits";
import { formatProofForVerifierContract, genMaciStateFromContract } from "maci-contracts";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts/typechain-types";
import { CircuitInputs, IJsonMaciState, MaciState } from "maci-core";
import { poseidon } from "maci-crypto/build/ts/hashing";
import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import fs from "fs";

import type { IJoinPollArgs, IJoinedUserArgs, IParsePollJoinEventsArgs } from "../utils/interfaces";

import { contractExists, logError, logYellow, info, logGreen, success } from "../utils";
import { banner } from "../utils/banner";

export const joinPoll = async ({
  maciAddress,
  privateKey,
  pollPrivKey,
  stateIndex,
  newVoiceCreditBalance,
  stateFile,
  pollId,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
  transactionHash,
  pollJoiningZkey,
  useWasm,
  rapidsnark,
  pollWitgen,
  pollWasm,
  quiet = true,
}: IJoinPollArgs): Promise<number> => {
  banner(quiet);
  const userSideOnly = true;

  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    logError("Invalid MACI private key");
  }

  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const nullifier = poseidon([BigInt(userMaciPrivKey.asCircuitInputs())]);

  // Create poll public key from poll private key
  const pollPrivKeyDeserialized = PrivKey.deserialize(pollPrivKey);
  const pollKeyPair = new Keypair(pollPrivKeyDeserialized);
  const pollPubKey = pollKeyPair.pubKey;

  // check < 1 cause index zero is a blank state leaf
  if (stateIndex < 1) {
    logError("Invalid state index");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollAddress = await maciContract.getPoll(pollId);

  if (!(await contractExists(signer.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollAddress, signer);

  let maciState: MaciState | undefined;
  if (stateFile) {
    const content = JSON.parse(fs.readFileSync(stateFile).toString()) as unknown as IJsonMaciState;

    try {
      maciState = MaciState.fromJSON(content);
    } catch (error) {
      logError((error as Error).message);
    }
  } else {
    // build an off-chain representation of the MACI contract using data in the contract storage
    const [defaultStartBlockSignup, defaultStartBlockPoll, stateRoot, numSignups] = await Promise.all([
      maciContract.queryFilter(maciContract.filters.SignUp(), startBlock).then((events) => events[0]?.blockNumber ?? 0),
      maciContract
        .queryFilter(maciContract.filters.DeployPoll(), startBlock)
        .then((events) => events[0]?.blockNumber ?? 0),
      maciContract.getStateTreeRoot(),
      maciContract.numSignUps(),
    ]);
    const defaultStartBlock = Math.min(defaultStartBlockPoll, defaultStartBlockSignup);
    let fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

    const defaultEndBlock = await Promise.all([
      pollContract
        .queryFilter(pollContract.filters.MergeMaciState(stateRoot, numSignups), fromBlock)
        .then((events) => events[events.length - 1]?.blockNumber),
    ]).then((blocks) => Math.max(...blocks));

    if (transactionHash) {
      const tx = await signer.provider!.getTransaction(transactionHash);
      fromBlock = tx?.blockNumber ?? defaultStartBlock;
    }

    logYellow(quiet, info(`starting to fetch logs from block ${fromBlock}`));
    // TODO: create genPollStateTree ?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    maciState = await genMaciStateFromContract(
      signer.provider!,
      await maciContract.getAddress(),
      new Keypair(), // Not important in this context
      pollId,
      fromBlock,
      blocksPerBatch,
      endBlock || defaultEndBlock,
      0,
      userSideOnly,
    );
  }

  const poll = maciState!.polls.get(pollId)!;

  if (poll.hasJoined(nullifier)) {
    throw new Error("User the given nullifier has already joined");
  }

  const currentStateRootIndex = poll.maciStateRef.numSignUps - 1;
  poll.updatePoll(BigInt(maciState!.stateLeaves.length));

  const circuitInputs = poll.joiningCircuitInputs(
    userMaciPrivKey,
    stateIndex,
    newVoiceCreditBalance,
    pollPrivKeyDeserialized,
    pollPubKey,
  ) as unknown as CircuitInputs;

  const pollVk = await extractVk(pollJoiningZkey);

  try {
    // generate the proof for this batch
    // eslint-disable-next-line no-await-in-loop
    const r = await genProof({
      inputs: circuitInputs,
      zkeyPath: pollJoiningZkey,
      useWasm,
      rapidsnarkExePath: rapidsnark,
      witnessExePath: pollWitgen,
      wasmPath: pollWasm,
    });

    // verify it
    // eslint-disable-next-line no-await-in-loop
    const isValid = await verifyProof(r.publicSignals, r.proof, pollVk);
    if (!isValid) {
      throw new Error("Generated an invalid proof");
    }

    const proof = formatProofForVerifierContract(r.proof);

    // submit the message onchain as well as the encryption public key
    const tx = await pollContract.joinPoll(
      nullifier,
      pollPubKey.asContractParam(),
      newVoiceCreditBalance,
      currentStateRootIndex,
      proof,
    );
    const receipt = await tx.wait();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (receipt?.status !== 1) {
      logError("Transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

    return 0;
  } catch (error) {
    logError((error as Error).message);
  }

  return -1;
};

/**
 * Parse the poll joining events from the Poll contract
 */
const parsePollJoinEvents = async ({
  pollContract,
  startBlock,
  currentBlock,
  pollPublicKey,
}: IParsePollJoinEventsArgs) => {
  // 1000 blocks at a time
  for (let block = startBlock; block <= currentBlock; block += 1000) {
    const toBlock = Math.min(block + 999, currentBlock);
    const pubKey = pollPublicKey.asArray();
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await pollContract.queryFilter(
      pollContract.filters.PollJoined(pubKey[0], pubKey[1], undefined, undefined, undefined, undefined),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        pollStateIndex: event.args[5].toString(),
        voiceCredits: event.args[2].toString(),
      };
    }
  }

  return {
    pollStateIndex: undefined,
    voiceCredits: undefined,
  };
};

export const isJoinedUser = async ({
  maciAddress,
  pollId,
  pollPubKey,
  signer,
  startBlock,
  quiet = true,
}: IJoinedUserArgs): Promise<{ isJoined: boolean; pollStateIndex?: string; voiceCredits?: string }> => {
  banner(quiet);

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollAddress = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollAddress, signer);

  const pollPublicKey = PubKey.deserialize(pollPubKey);
  const startBlockNumber = startBlock || 0;
  const currentBlock = await signer.provider!.getBlockNumber();

  const { pollStateIndex, voiceCredits } = await parsePollJoinEvents({
    pollContract,
    startBlock: startBlockNumber,
    currentBlock,
    pollPublicKey,
  });

  logGreen(
    quiet,
    success(`Poll state index: ${pollStateIndex?.toString()}, registered: ${pollStateIndex !== undefined}`),
  );

  return {
    isJoined: pollStateIndex !== undefined,
    pollStateIndex,
    voiceCredits,
  };
};
