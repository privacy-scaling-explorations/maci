import { ContractTransactionReceipt, isBytesLike } from "ethers";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts/typechain-types";
import { PubKey } from "maci-domainobjs";

import type { IIsRegisteredUser, IJoinedUserArgs, ISignupArgs, ISignupData, IRegisteredUserArgs } from "./types";

import { contractExists } from "../utils";

import { parsePollJoinEvents, parseSignupEvents } from "./utils";

/**
 * Checks if user is registered with a given public key
 * @param IRegisteredArgs - The arguments for the check register command
 * @returns whether the user is registered or not and their state index
 */
export const isUserRegistered = async ({
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

  try {
    // sign up to the MACI contract
    const tx = await maciContract.signUp(userMaciPubKey.asContractParam(), sgData);
    receipt = await tx.wait();

    if (receipt?.status !== 1) {
      throw new Error("The transaction failed");
    }

    const iface = maciContract.interface;

    // get state index from the event
    const [log] = receipt.logs;
    const { args } = iface.parseLog(log as unknown as { topics: string[]; data: string }) || { args: [] };
    [stateIndex, ,] = args;
  } catch (error) {
    throw new Error((error as Error).message);
  }

  return {
    stateIndex: stateIndex ? stateIndex.toString() : "",
    transactionHash: receipt.hash,
  };
};

/**
 * Checks if user is joined to a poll with the public key
 * @param {IJoinedUserArgs} - The arguments for the join check command
 * @returns user joined or not and poll state index, voice credit balance
 */
export const isJoinedUser = async ({
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
