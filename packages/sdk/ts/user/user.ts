/* eslint-disable no-underscore-dangle */
import { ContractTransactionReceipt, isBytesLike } from "ethers";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts";
import { poseidon } from "maci-crypto";
import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import type {
  IIsRegisteredUser,
  IJoinedUserArgs,
  ISignupArgs,
  ISignupData,
  IRegisteredUserArgs,
  IJoinPollData,
  IJoinPollArgs,
  IIsNullifierOnChainArgs,
} from "./types";
import type { CircuitInputs } from "../utils/types";

import { contractExists, generateAndVerifyProof } from "../utils";

import {
  getPollJoiningCircuitEvents,
  getPollJoiningCircuitInputsFromStateFile,
  parsePollJoinEvents,
  parseSignupEvents,
} from "./utils";

/**
 * Checks if user is registered with a given public key and get its data
 * @param IRegisteredArgs - The arguments for the check register command
 * @returns whether the user is registered or not and their state index
 */
export const getSignedupUserData = async ({
  maciAddress,
  maciPubKey,
  signer,
  startBlock,
}: IRegisteredUserArgs): Promise<IIsRegisteredUser> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const publicKey = PubKey.deserialize(maciPubKey);
  const startBlockNumber = startBlock || 0;
  const currentBlock = await signer.provider!.getBlockNumber();

  const { stateIndex } = await parseSignupEvents({
    maciContract,
    startBlock: startBlockNumber,
    currentBlock,
    publicKey,
  });

  return {
    isRegistered: stateIndex !== undefined,
    stateIndex,
  };
};

/**
 * Signup a user to the MACI contract
 * @param {SignupArgs} args - The arguments for the signup command
 * @returns {ISignupData} The state index of the user and transaction hash
 */
export const signup = async ({ maciPubKey, maciAddress, sgData, signer }: ISignupArgs): Promise<ISignupData> => {
  // validate user key
  if (!PubKey.isValidSerializedPubKey(maciPubKey)) {
    throw new Error("Invalid MACI public key");
  }

  const userMaciPubKey = PubKey.deserialize(maciPubKey);

  const validContract = await contractExists(signer.provider!, maciAddress);

  if (!validContract) {
    throw new Error("There is no contract deployed at the specified address");
  }

  // we validate that the signup data and voice credit data is valid
  if (!isBytesLike(sgData)) {
    throw new Error("invalid signup gateway data");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);

  let stateIndex = "";
  let receipt: ContractTransactionReceipt | null = null;

  // sign up to the MACI contract
  const tx = await maciContract.signUp(userMaciPubKey.asContractParam(), sgData);
  receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("The transaction failed");
  }

  // get state index from the event
  const [{ args = [] } = { args: [] }] = await maciContract.queryFilter(
    maciContract.filters.SignUp,
    receipt.blockNumber,
    receipt.blockNumber,
  );

  stateIndex = args[0].toString();

  return {
    stateIndex: stateIndex ? stateIndex.toString() : "",
    transactionHash: receipt.hash,
  };
};

/**
 * Checks if user is joined to a poll with their public key and get its data
 * @param {IJoinedUserArgs} - The arguments for the join check command
 * @returns user joined or not and poll state index, voice credit balance
 */
export const getJoinedUserData = async ({
  maciAddress,
  pollId,
  pollPubKey,
  signer,
  startBlock,
}: IJoinedUserArgs): Promise<{ isJoined: boolean; pollStateIndex?: string; voiceCredits?: string }> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const pollPublicKey = PubKey.deserialize(pollPubKey);
  const startBlockNumber = startBlock || 0;
  const currentBlock = await signer.provider!.getBlockNumber();

  const { pollStateIndex, voiceCredits } = await parsePollJoinEvents({
    pollContract,
    startBlock: startBlockNumber,
    currentBlock,
    pollPublicKey,
  });

  return {
    isJoined: pollStateIndex !== undefined,
    pollStateIndex,
    voiceCredits,
  };
};

/**
 * Checks if a user joined a poll with a given nullifier
 * @param {IIsNullifierOnChainArgs} args - The arguments for the is nullifier on chain command
 * @returns whether the nullifier is on chain or not
 */
export const hasUserJoinedPoll = async ({
  maciAddress,
  pollId,
  nullifier,
  signer,
}: IIsNullifierOnChainArgs): Promise<boolean> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  return pollContract.pollNullifiers(nullifier);
};

/**
 * Join Poll user to the Poll contract
 * @param {IJoinPollArgs} args - The arguments for the join poll command
 * @returns {IJoinPollData} The poll state index of the joined user and transaction hash
 */
export const joinPoll = async ({
  maciAddress,
  privateKey,
  stateFile,
  pollId,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
  pollJoiningZkey,
  useWasm,
  rapidsnark,
  pollWitgen,
  pollWasm,
  sgDataArg,
  ivcpDataArg,
}: IJoinPollArgs): Promise<IJoinPollData> => {
  const validContract = await contractExists(signer.provider!, maciAddress);

  if (!validContract) {
    throw new Error("MACI contract does not exist");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  if (pollId < 0) {
    throw new Error("Invalid poll id");
  }

  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const userMaciPubKey = new Keypair(userMaciPrivKey).pubKey;
  const nullifier = poseidon([BigInt(userMaciPrivKey.asCircuitInputs()), pollId]);

  // check if the user has already joined the poll based on the nullifier
  const hasUserJoinedAlready = await hasUserJoinedPoll({
    maciAddress,
    pollId,
    nullifier,
    signer,
  });

  if (hasUserJoinedAlready) {
    throw new Error("User has already joined");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  // get the state index from the MACI contract
  const stateIndex = await maciContract.getStateIndex(userMaciPubKey.hash()).catch(() => -1n);

  let circuitInputs: CircuitInputs;

  if (stateFile) {
    circuitInputs = await getPollJoiningCircuitInputsFromStateFile({
      stateFile,
      pollId,
      stateIndex,
      userMaciPrivKey,
    });
  } else {
    circuitInputs = await getPollJoiningCircuitEvents({
      maciContract,
      stateIndex,
      pollId,
      userMaciPrivKey,
      signer,
      startBlock,
      endBlock,
      blocksPerBatch,
    });
  }

  const currentStateRootIndex = Number.parseInt((await maciContract.numSignUps()).toString(), 10) - 1;

  // generate the proof for this batch
  const proof = await generateAndVerifyProof(circuitInputs, pollJoiningZkey, useWasm, rapidsnark, pollWitgen, pollWasm);

  // submit the message onchain as well as the encryption public key
  const tx = await pollContract.joinPoll(
    nullifier,
    userMaciPubKey.asContractParam(),
    currentStateRootIndex,
    proof,
    sgDataArg,
    ivcpDataArg,
  );
  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Transaction failed");
  }

  const [{ args }] = await pollContract.queryFilter(
    pollContract.filters.PollJoined,
    receipt.blockNumber,
    receipt.blockNumber,
  );

  return {
    pollStateIndex: args._pollStateIndex.toString(),
    voiceCredits: args._voiceCreditBalance.toString(),
    timestamp: args._timestamp.toString(),
    nullifier: nullifier.toString(),
    hash: receipt.hash,
  };
};
