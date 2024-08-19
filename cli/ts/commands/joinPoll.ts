import { extractVk, genProof, verifyProof } from "maci-circuits";
import { formatProofForVerifierContract, genSignUpTree, IGenSignUpTree } from "maci-contracts";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts/typechain-types";
import { CircuitInputs, IJsonMaciState, MaciState, IPollJoiningCircuitInputs } from "maci-core";
import { poseidon, sha256Hash, stringifyBigInts } from "maci-crypto";
import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import assert from "assert";
import fs from "fs";

import type { IJoinPollArgs, IJoinedUserArgs, IParsePollJoinEventsArgs } from "../utils/interfaces";

import { contractExists, logError, logYellow, info, logGreen, success } from "../utils";
import { banner } from "../utils/banner";
import { error } from "console";

/**
 * Create circuit input for pollJoining
 * @param signUpData Sign up tree and state leaves
 * @param stateTreeDepth Maci state tree depth
 * @param maciPrivKey User's private key for signing up
 * @param stateLeafIndex Index where the user is stored in the state leaves
 * @param credits Credits for voting
 * @param pollPrivKey Poll's private key for the poll joining
 * @param pollPubKey Poll's public key for the poll joining
 * @returns stringified circuit inputs
 */
const joiningCircuitInputs = (
  signUpData: IGenSignUpTree,
  stateTreeDepth: bigint,
  maciPrivKey: PrivKey,
  stateLeafIndex: bigint,
  credits: bigint,
  pollPrivKey: PrivKey,
  pollPubKey: PubKey,
): IPollJoiningCircuitInputs => {
  // Get the state leaf on the index position
  const { signUpTree: stateTree, stateLeaves } = signUpData;
  const stateLeaf = stateLeaves[Number(stateLeafIndex)];
  const { pubKey, voiceCreditBalance, timestamp } = stateLeaf;
  const pubKeyX = pubKey.asArray()[0];
  const pubKeyY = pubKey.asArray()[1];
  const stateLeafArray = [pubKeyX, pubKeyY, voiceCreditBalance, timestamp];
  const pollPubKeyArray = pollPubKey.asArray();

  assert(credits <= voiceCreditBalance, "Credits must be lower than signed up credits");

  // calculate the path elements for the state tree given the original state tree
  const { siblings, index } = stateTree.generateProof(Number(stateLeafIndex));
  const depth = siblings.length;

  // The index must be converted to a list of indices, 1 for each tree level.
  // The circuit tree depth is this.stateTreeDepth, so the number of siblings must be this.stateTreeDepth,
  // even if the tree depth is actually 3. The missing siblings can be set to 0, as they
  // won't be used to calculate the root in the circuit.
  const indices: bigint[] = [];

  for (let i = 0; i < stateTreeDepth; i += 1) {
    // eslint-disable-next-line no-bitwise
    indices.push(BigInt((index >> i) & 1));

    if (i >= depth) {
      siblings[i] = BigInt(0);
    }
  }

  // Create nullifier from private key
  const inputNullifier = BigInt(maciPrivKey.asCircuitInputs());
  const nullifier = poseidon([inputNullifier]);

  // Get pll state tree's root
  const stateRoot = stateTree.root;

  // Convert actualStateTreeDepth to BigInt
  const actualStateTreeDepth = BigInt(stateTree.depth);

  // Calculate public input hash from nullifier, credits and current root
  const inputHash = sha256Hash([nullifier, credits, stateRoot, pollPubKeyArray[0], pollPubKeyArray[1]]);

  const circuitInputs = {
    privKey: maciPrivKey.asCircuitInputs(),
    pollPrivKey: pollPrivKey.asCircuitInputs(),
    pollPubKey: pollPubKey.asCircuitInputs(),
    stateLeaf: stateLeafArray,
    siblings,
    indices,
    nullifier,
    credits,
    stateRoot,
    actualStateTreeDepth,
    inputHash,
  };

  return stringifyBigInts(circuitInputs) as unknown as IPollJoiningCircuitInputs;
};

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

  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    logError("Invalid MACI private key");
  }

  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const userMaciPubKey = new Keypair(userMaciPrivKey).pubKey;
  const nullifier = poseidon([BigInt(userMaciPrivKey.asCircuitInputs())]);

  // Create poll public key from poll private key
  const pollPrivKeyDeserialized = PrivKey.deserialize(pollPrivKey);
  const pollKeyPair = new Keypair(pollPrivKeyDeserialized);
  const pollPubKey = pollKeyPair.pubKey;


  // let loadedStateLeafIndex = stateLeafIndex;

  // if (stateLeafIndex == null) {
  //   loadedStateLeafIndex = BigInt(stateLeaves.findIndex(leaf => leaf.pubKey.equals());
  // }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollAddress = await maciContract.getPoll(pollId);

  if (!(await contractExists(signer.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollAddress, signer);
  
  let loadedStateIndex = stateIndex;
  let loadedCreditBalance = newVoiceCreditBalance;

  let maciState: MaciState | undefined;
  let signUpData: IGenSignUpTree | undefined;
  let currentStateRootIndex: number;
  let circuitInputs: CircuitInputs;
  if (stateFile) {
    try {
      const file = await fs.promises.readFile(stateFile);
      const content = JSON.parse(file.toString()) as unknown as IJsonMaciState;
      maciState = MaciState.fromJSON(content);
    } catch (error) {
      logError((error as Error).message);
    }
    const poll = maciState!.polls.get(pollId)!;

    if (poll.hasJoined(nullifier)) {
      throw new Error("User the given nullifier has already joined");
    }

    if (stateIndex == null) {
      const index = maciState?.stateLeaves.findIndex(leaf => leaf.pubKey.equals(userMaciPubKey));
      if (index != null) {
        loadedStateIndex = BigInt(index);
      } else {
        error('State leaf not found');
        process.exit();
      }
    }

    // check < 1 cause index zero is a blank state leaf
    if (loadedStateIndex! < 1) {
      logError("Invalid state index");
    }

    currentStateRootIndex = poll.maciStateRef.numSignUps - 1;

    poll.updatePoll(BigInt(maciState!.stateLeaves.length));

    if (newVoiceCreditBalance == null) {
      loadedCreditBalance = maciState?.stateLeaves[Number(loadedStateIndex!)].voiceCreditBalance!;
    }

    circuitInputs = poll.joiningCircuitInputs({
      maciPrivKey: userMaciPrivKey,
      stateLeafIndex: loadedStateIndex!,
      credits: loadedCreditBalance!,
      pollPrivKey: pollPrivKeyDeserialized,
      pollPubKey,
    }) as unknown as CircuitInputs;
  } else {
    // build an off-chain representation of the MACI contract using data in the contract storage
    const [defaultStartBlockSignup, defaultStartBlockPoll, stateTreeDepth, numSignups] = await Promise.all([
      maciContract.queryFilter(maciContract.filters.SignUp(), startBlock).then((events) => events[0]?.blockNumber ?? 0),
      maciContract
        .queryFilter(maciContract.filters.DeployPoll(), startBlock)
        .then((events) => events[0]?.blockNumber ?? 0),
      maciContract.stateTreeDepth(),
      maciContract.numSignUps(),
    ]);
    const defaultStartBlock = Math.min(defaultStartBlockPoll, defaultStartBlockSignup);
    let fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

    if (transactionHash) {
      const tx = await signer.provider!.getTransaction(transactionHash);
      fromBlock = tx?.blockNumber ?? defaultStartBlock;
    }

    logYellow(quiet, info(`starting to fetch logs from block ${fromBlock}`));

    signUpData = await genSignUpTree({
      provider: signer.provider!,
      address: await maciContract.getAddress(),
      blocksPerRequest: blocksPerBatch || 50,
      fromBlock,
      endBlock,
      sleepAmount: 0,
    });

    currentStateRootIndex = Number(numSignups) - 1;

    if (stateIndex == null) {
      const index = signUpData.stateLeaves.findIndex(leaf => leaf.pubKey.equals(userMaciPubKey));
      if (index != null) {
        loadedStateIndex = BigInt(index);
      } else {
        error('State leaf not found');
        process.exit();
      }
    }

    // check < 1 cause index zero is a blank state leaf
    if (loadedStateIndex! < 1) {
      logError("Invalid state index");
    }

    if (newVoiceCreditBalance == null) {
      loadedCreditBalance = signUpData.stateLeaves[Number(loadedStateIndex!)].voiceCreditBalance!;
    }

    circuitInputs = joiningCircuitInputs(
      signUpData,
      stateTreeDepth,
      userMaciPrivKey,
      loadedStateIndex!,
      loadedCreditBalance!,
      pollPrivKeyDeserialized,
      pollPubKey,
    ) as unknown as CircuitInputs;
  }

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
      loadedCreditBalance!,
      currentStateRootIndex,
      proof,
    );
    const receipt = await tx.wait();

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
