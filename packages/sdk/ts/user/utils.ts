import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "@maci-protocol/contracts/typechain-types";
import { IJsonMaciState, MaciState } from "@maci-protocol/core";
import { poseidon, stringifyBigInts } from "@maci-protocol/crypto";
import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";

import fs from "fs";

import type {
  IGetPollJoiningCircuitEventsArgs,
  IGetPollJoiningCircuitInputsFromStateFileArgs,
  IParsePollJoinEventsArgs,
  IParseSignupEventsArgs,
  IJoinedUserArgs,
  IIsNullifierOnChainArgs,
  IGenerateMaciStateTreeArgs,
  IGenerateMaciStateTreeWithEndKeyArgs,
} from "./types";
import type { IGenerateSignUpTree } from "../trees/types";
import type { TCircuitInputs } from "../utils/types";
import type { LeanIMTMerkleProof } from "@zk-kit/lean-imt";

import { generateSignUpTree, generateSignUpTreeWithEndKey } from "../trees/stateTree";
import { BLOCKS_STEP } from "../utils/constants";

/**
 * Parse the poll joining events from the Poll contract
 */
export const parsePollJoinEvents = async ({
  pollContract,
  startBlock,
  currentBlock,
  pollPublicKey,
}: IParsePollJoinEventsArgs): Promise<{
  pollStateIndex?: string;
  voiceCredits?: string;
}> => {
  for (let block = startBlock; block <= currentBlock; block += BLOCKS_STEP) {
    const toBlock = Math.min(block + BLOCKS_STEP - 1, currentBlock);
    const publicKey = pollPublicKey.asArray();
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await pollContract.queryFilter(
      pollContract.filters.PollJoined(publicKey[0], publicKey[1], undefined, undefined, undefined),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        pollStateIndex: event.args[4].toString(),
        voiceCredits: event.args[2].toString(),
      };
    }
  }

  return {
    pollStateIndex: undefined,
    voiceCredits: undefined,
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
  pollPublicKey: serializedPollPublicKey,
  signer,
  startBlock,
}: IJoinedUserArgs): Promise<{ isJoined: boolean; pollStateIndex?: string; voiceCredits?: string }> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const pollPublicKey = PublicKey.deserialize(serializedPollPublicKey);
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
 * Parse the signup events from the MACI contract
 */
export const parseSignupEvents = async ({
  maciContract,
  startBlock,
  currentBlock,
  publicKey,
}: IParseSignupEventsArgs): Promise<{ stateIndex?: string }> => {
  for (let block = startBlock; block <= currentBlock; block += BLOCKS_STEP) {
    const toBlock = Math.min(block + BLOCKS_STEP - 1, currentBlock);
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await maciContract.queryFilter(
      maciContract.filters.SignUp(undefined, undefined, publicKey.raw[0], publicKey.raw[1]),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        stateIndex: event.args[0].toString(),
      };
    }
  }

  return {
    stateIndex: undefined,
  };
};

/**
 * Get state index from maci state leaves or from sign up leaves
 * @param publicKeys Public keys from maci state or sign up tree
 * @param userMaciPublicKey Public key of the maci user
 * @param stateIndex State index from the command
 * @returns State index
 */
export const getStateIndex = (
  publicKeys: PublicKey[],
  userMaciPublicKey: PublicKey,
  stateIndex?: bigint,
): bigint | undefined => {
  if (!stateIndex) {
    const index = publicKeys.findIndex((key) => key.equals(userMaciPublicKey));

    if (index > 0) {
      return BigInt(index);
    }

    throw new Error("MACI Public key not found");
  }

  return stateIndex;
};

/**
 * Create circuit input for pollJoining
 * @param signUpData Sign up tree and state leaves
 * @param stateTreeDepth Maci state tree depth
 * @param maciPrivateKey User's private key for signing up
 * @param pollPrivateKey Poll's private key for the poll joining
 * @param pollPublicKey Poll's public key for the poll joining
 * @param pollId Poll's id
 * @returns stringified circuit inputs
 */
export const joiningCircuitInputs = (
  inclusionProof: LeanIMTMerkleProof,
  stateTreeDepth: bigint,
  maciPrivateKey: PrivateKey,
  pollPublicKey: PublicKey,
  pollId: bigint,
): TCircuitInputs => {
  // calculate the path elements for the state tree given the original state tree
  const { siblings, index, root: stateRoot } = inclusionProof;
  const siblingsLength = siblings.length;

  // The index must be converted to a list of indices, 1 for each tree level.
  // The circuit tree depth is this.stateTreeDepth, so the number of siblings must be this.stateTreeDepth,
  // even if the tree depth is actually 3. The missing siblings can be set to 0, as they
  // won't be used to calculate the root in the circuit.
  const indices: bigint[] = [];

  for (let i = 0; i < stateTreeDepth; i += 1) {
    // eslint-disable-next-line no-bitwise
    indices.push(BigInt((index >> i) & 1));

    if (i >= siblingsLength) {
      siblings[i] = BigInt(0);
    }
  }

  const siblingsArray = siblings.map((sibling) => [sibling]);

  // Create nullifier from private key
  const inputNullifier = BigInt(maciPrivateKey.asCircuitInputs());
  const nullifier = poseidon([inputNullifier, pollId]);

  // Set actualStateTreeDepth as number of initial siblings length
  const actualStateTreeDepth = BigInt(siblingsLength);

  // Calculate public input hash from nullifier, credits and current root
  const circuitInputs = {
    privateKey: maciPrivateKey.asCircuitInputs(),
    pollPublicKey: pollPublicKey.asCircuitInputs(),
    siblings: siblingsArray,
    indices,
    nullifier,
    stateRoot,
    actualStateTreeDepth,
    pollId,
  };

  return stringifyBigInts(circuitInputs) as unknown as TCircuitInputs;
};

/**
 * Get the poll joining circuit inputs from a state file
 * @param stateFile - The path to the state file
 * @returns The poll joining circuit inputs
 */
export const getPollJoiningCircuitInputsFromStateFile = async ({
  stateFile,
  pollId,
  stateIndex,
  userMaciPrivateKey,
}: IGetPollJoiningCircuitInputsFromStateFileArgs): Promise<TCircuitInputs> => {
  const file = await fs.promises.readFile(stateFile);
  const content = JSON.parse(file.toString()) as unknown as IJsonMaciState;

  const maciState = MaciState.fromJSON(content);
  const poll = maciState.polls.get(pollId)!;

  const { publicKey: userPublicKey } = new Keypair(userMaciPrivateKey);
  const loadedStateIndex = getStateIndex(maciState.publicKeys, userPublicKey, stateIndex);

  // check < 1 cause index zero is a blank state leaf
  if (loadedStateIndex! < 1) {
    throw new Error("Invalid state index");
  }

  poll.updatePoll(BigInt(maciState.publicKeys.length));

  const circuitInputs = poll.joiningCircuitInputs({
    maciPrivateKey: userMaciPrivateKey,
    stateLeafIndex: stateIndex,
    pollPublicKey: userPublicKey,
  }) as unknown as TCircuitInputs;

  return circuitInputs;
};

/**
 * Generate MACI's state tree from the MACI contract
 * @param {IGenerateMaciStateTreeArgs} args - The arguments for the generate maci state tree command
 * @returns The MACI's state tree
 */
export const generateMaciStateTree = async ({
  maciContractAddress,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
}: IGenerateMaciStateTreeArgs): Promise<IGenerateSignUpTree> => {
  const maciContract = MACIFactory.connect(maciContractAddress, signer);

  // build an off-chain representation of the MACI contract using data in the contract storage
  const defaultStartBlock = await maciContract
    .queryFilter(maciContract.filters.SignUp(), startBlock ?? 0)
    .then((events) => events[0]?.blockNumber ?? 0);

  const fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

  return generateSignUpTree({
    provider: signer.provider!,
    address: await maciContract.getAddress(),
    blocksPerRequest: blocksPerBatch || 50,
    fromBlock,
    endBlock,
    sleepAmount: 0,
  });
};

/**
 * Generate MACI's state tree from the MACI contract with a given end key
 * @param {IGenerateMaciStateTreeWithEndKeyArgs} args - The arguments for the generate maci state tree command
 * @returns The MACI's state tree
 */
export const generateMaciStateTreeWithEndKey = async ({
  maciContractAddress,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
  userPublicKey,
}: IGenerateMaciStateTreeWithEndKeyArgs): Promise<IGenerateSignUpTree> => {
  const maciContract = MACIFactory.connect(maciContractAddress, signer);

  // build an off-chain representation of the MACI contract using data in the contract storage
  const defaultStartBlock = await maciContract
    .queryFilter(maciContract.filters.SignUp(), startBlock ?? 0)
    .then((events) => events[0]?.blockNumber ?? 0);

  const fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

  return generateSignUpTreeWithEndKey({
    provider: signer.provider!,
    address: await maciContract.getAddress(),
    blocksPerRequest: blocksPerBatch || 50,
    fromBlock,
    endBlock,
    userPublicKey,
  });
};

/**
 * Get the poll joining circuit events from a state file
 * @param maciContract - The MACI contract
 * @param startBlock - The start block
 * @param signer - The signer
 * @returns The poll joining circuit events
 */
export const getPollJoiningCircuitEvents = async ({
  maciContract,
  stateIndex,
  pollId,
  userMaciPrivateKey,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
}: IGetPollJoiningCircuitEventsArgs): Promise<TCircuitInputs> => {
  const [stateTreeDepth, maciContractAddress] = await Promise.all([
    maciContract.stateTreeDepth(),
    maciContract.getAddress(),
  ]);

  const signUpData = await generateMaciStateTree({
    maciContractAddress,
    signer,
    startBlock,
    endBlock,
    blocksPerBatch,
  });

  const { publicKey: userPublicKey } = new Keypair(userMaciPrivateKey);
  const loadedStateIndex = getStateIndex(signUpData.publicKeys, userPublicKey, stateIndex);

  if (loadedStateIndex! < 1) {
    throw new Error("Invalid state index");
  }

  // Get the state leaf on the index position
  const { signUpTree: stateTree } = signUpData;

  // calculate the path elements for the state tree given the original state tree
  const inclusionProof = stateTree.generateProof(Number(loadedStateIndex));

  return joiningCircuitInputs(
    inclusionProof,
    stateTreeDepth,
    userMaciPrivateKey,
    userPublicKey,
    pollId,
  ) as unknown as TCircuitInputs;
};
