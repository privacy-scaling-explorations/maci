import {
  IncrementalQuinTree,
  genRandomSalt,
  SNARK_FIELD_SIZE,
  NOTHING_UP_MY_SLEEVE,
  hashLeftRight,
  hash3,
  hash5,
  stringifyBigInts,
  genTreeCommitment,
  hash2,
  poseidon,
  hashLeanIMT,
} from "@maci-protocol/crypto";
import {
  PCommand,
  Keypair,
  Ballot,
  PubKey,
  PrivKey,
  Message,
  StateLeaf,
  blankStateLeaf,
  type IMessageContractParams,
  type IJsonPCommand,
  blankStateLeafHash,
  padKey,
} from "@maci-protocol/domainobjs";
import { LeanIMT, LeanIMTHashFunction } from "@zk-kit/lean-imt";

import assert from "assert";

import type {
  CircuitInputs,
  TreeDepths,
  BatchSizes,
  IPoll,
  IJsonPoll,
  IProcessMessagesOutput,
  ITallyCircuitInputs,
  IProcessMessagesCircuitInputs,
  IPollJoiningCircuitInputs,
  IJoiningCircuitArgs,
} from "./index";
import type { MaciState } from "./MaciState";
import type { IJoinedCircuitArgs, IPollJoinedCircuitInputs } from "./utils/types";
import type { PathElements } from "@maci-protocol/crypto";

import { STATE_TREE_ARITY, VOTE_OPTION_TREE_ARITY } from "./utils/constants";
import { ProcessMessageErrors, ProcessMessageError } from "./utils/errors";

import fs from "fs";

/**
 * A representation of the Poll contract.
 */
export class Poll implements IPoll {
  // Note that we only store the PubKey on-chain while this class stores the
  // Keypair for the sake of convenience
  coordinatorKeypair: Keypair;

  treeDepths: TreeDepths;

  batchSizes: BatchSizes;

  voteOptions: bigint;

  maxVoteOptions: number;

  // the depth of the state tree
  stateTreeDepth: number;

  // the actual depth of the state tree (can be <= stateTreeDepth)
  actualStateTreeDepth: number;

  pollEndTimestamp: bigint;

  ballots: Ballot[] = [];

  ballotTree?: IncrementalQuinTree;

  messages: Message[] = [];

  commands: PCommand[] = [];

  encPubKeys: PubKey[] = [];

  stateCopied = false;

  pubKeys: PubKey[] = [padKey];

  stateTree?: LeanIMT;

  // For message processing
  numBatchesProcessed = 0;

  currentMessageBatchIndex: number;

  maciStateRef: MaciState;

  pollId: bigint;

  sbSalts: Record<number | string, bigint> = {};

  resultRootSalts: Record<number | string, bigint> = {};

  preVOSpentVoiceCreditsRootSalts: Record<number | string, bigint> = {};

  spentVoiceCreditSubtotalSalts: Record<number | string, bigint> = {};

  // For vote tallying
  tallyResult: bigint[] = [];

  perVOSpentVoiceCredits: bigint[] = [];

  numBatchesTallied = 0;

  totalSpentVoiceCredits = 0n;

  // an empty ballot and its hash to be used as zero value in the
  // ballot tree
  emptyBallot: Ballot;

  emptyBallotHash?: bigint;

  // message chain hash
  chainHash = NOTHING_UP_MY_SLEEVE;

  // batch chain hashes
  batchHashes = [NOTHING_UP_MY_SLEEVE];

  // Poll state tree leaves
  pollStateLeaves: StateLeaf[] = [blankStateLeaf];

  // Poll state tree
  pollStateTree?: IncrementalQuinTree;

  // Poll voting nullifier
  pollNullifiers: Map<bigint, boolean>;

  // how many users signed up
  private numSignups = 0n;

  /**
   * Save the current state of the poll to a file
   * @param filePath - The path to save the state to
   */
  saveState = async (filePath: string): Promise<void> => {
    const state = {
      pollId: this.pollId.toString(),
      numBatchesProcessed: this.numBatchesProcessed,
      numBatchesTallied: this.numBatchesTallied,
      currentMessageBatchIndex: this.currentMessageBatchIndex,
      sbSalts: Object.fromEntries(
        Object.entries(this.sbSalts).map(([k, v]) => [k, v.toString()])
      ),
      resultRootSalts: Object.fromEntries(
        Object.entries(this.resultRootSalts).map(([k, v]) => [k, v.toString()])
      ),
      preVOSpentVoiceCreditsRootSalts: Object.fromEntries(
        Object.entries(this.preVOSpentVoiceCreditsRootSalts).map(([k, v]) => [k, v.toString()])
      ),
      spentVoiceCreditSubtotalSalts: Object.fromEntries(
        Object.entries(this.spentVoiceCreditSubtotalSalts).map(([k, v]) => [k, v.toString()])
      ),
      tallyResult: this.tallyResult.map(x => x.toString()),
      perVOSpentVoiceCredits: this.perVOSpentVoiceCredits.map(x => x.toString()),
      totalSpentVoiceCredits: this.totalSpentVoiceCredits.toString(),
      pollStateLeaves: this.pollStateLeaves.map(leaf => leaf.toJSON()),
      ballots: this.ballots.map(ballot => ballot.toJSON()),
    };

    await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2));
  };

  /**
   * Load the state of the poll from a file
   * @param filePath - The path to load the state from
   */
  loadState = async (filePath: string): Promise<void> => {
    const state = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    
    this.pollId = BigInt(state.pollId);
    this.numBatchesProcessed = state.numBatchesProcessed;
    this.numBatchesTallied = state.numBatchesTallied;
    this.currentMessageBatchIndex = state.currentMessageBatchIndex;
    
    // Load salts
    this.sbSalts = Object.fromEntries(
      Object.entries(state.sbSalts).map(([k, v]) => [k, BigInt(v as string)])
    );
    this.resultRootSalts = Object.fromEntries(
      Object.entries(state.resultRootSalts).map(([k, v]) => [k, BigInt(v as string)])
    );
    this.preVOSpentVoiceCreditsRootSalts = Object.fromEntries(
      Object.entries(state.preVOSpentVoiceCreditsRootSalts).map(([k, v]) => [k, BigInt(v as string)])
    );
    this.spentVoiceCreditSubtotalSalts = Object.fromEntries(
      Object.entries(state.spentVoiceCreditSubtotalSalts).map(([k, v]) => [k, BigInt(v as string)])
    );
    
    // Load tally results
    this.tallyResult = state.tallyResult.map((x: string) => BigInt(x));
    this.perVOSpentVoiceCredits = state.perVOSpentVoiceCredits.map((x: string) => BigInt(x));
    this.totalSpentVoiceCredits = BigInt(state.totalSpentVoiceCredits);
    
    // Load state leaves and ballots
    this.pollStateLeaves = state.pollStateLeaves.map((leaf: any) => StateLeaf.fromJSON(leaf));
    this.ballots = state.ballots.map((ballot: any) => Ballot.fromJSON(ballot));
  };

  /**
   * Constructs a new Poll object.
   * @param pollEndTimestamp - The Unix timestamp at which the poll ends.
   * @param coordinatorKeypair - The keypair of the coordinator.
   * @param treeDepths - The depths of the trees used in the poll.
   * @param batchSizes - The sizes of the batches used in the poll.
   * @param maciStateRef - The reference to the MACI state.
   * @param pollId - The poll id
   */
  constructor(
    pollEndTimestamp: bigint,
    coordinatorKeypair: Keypair,
    treeDepths: TreeDepths,
    batchSizes: BatchSizes,
    maciStateRef: MaciState,
    voteOptions: bigint,
  ) {
    this.pollEndTimestamp = pollEndTimestamp;
    this.coordinatorKeypair = coordinatorKeypair;
    this.treeDepths = treeDepths;
    this.batchSizes = batchSizes;
    if (voteOptions > VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth) {
      throw new Error("Vote options cannot be greater than the number of leaves in the vote option tree");
    }
    this.voteOptions = voteOptions;
    this.maxVoteOptions = VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth;
    this.maciStateRef = maciStateRef;
    this.pollId = BigInt(maciStateRef.polls.size);
    this.stateTreeDepth = maciStateRef.stateTreeDepth;
    this.actualStateTreeDepth = maciStateRef.stateTreeDepth;
    this.currentMessageBatchIndex = 0;

    this.pollNullifiers = new Map<bigint, boolean>();

    this.tallyResult = new Array(this.maxVoteOptions).fill(0n) as bigint[];
    this.perVOSpentVoiceCredits = new Array(this.maxVoteOptions).fill(0n) as bigint[];

    // we put a blank state leaf to prevent a DoS attack
    this.emptyBallot = Ballot.genBlankBallot(this.maxVoteOptions, treeDepths.voteOptionTreeDepth);
    this.ballots.push(this.emptyBallot);
  }

  /**
   * Check if user has already joined the poll by checking if the nullifier is registered
   */
  hasJoined = (nullifier: bigint): boolean => this.pollNullifiers.get(nullifier) != null;

  /**
   * Join the anonymous user to the Poll (to the tree)
   * @param nullifier - Hashed private key used as nullifier
   * @param pubKey - The poll public key.
   * @param newVoiceCreditBalance - New voice credit balance of the user.
   * @param timestamp - The timestamp of the sign-up.
   * @returns The index of added state leaf
   */
  joinPoll = (nullifier: bigint, pubKey: PubKey, newVoiceCreditBalance: bigint, timestamp: bigint): number => {
    const stateLeaf = new StateLeaf(pubKey, newVoiceCreditBalance, timestamp);

    if (this.hasJoined(nullifier)) {
      throw new Error("UserAlreadyJoined");
    }

    this.pollNullifiers.set(nullifier, true);
    this.pollStateLeaves.push(stateLeaf.copy());
    this.pollStateTree?.insert(stateLeaf.hash());

    return this.pollStateLeaves.length - 1;
  };

  /**
   * Update a Poll with data from MaciState.
   * This is the step where we copy the state from the MaciState instance,
   * and set the number of signups we have so far.
   * @note It should be called to generate the state for poll joining with numSignups set as
   * the number of signups in the MaciState. For message processing, you should set numSignups as
   * the number of users who joined the poll.
   */
  updatePoll = (numSignups: bigint): void => {
    // there might be occasions where we fetch logs after new signups have been made
    // logs are fetched (and MaciState/Poll created locally).
    // If someone signs up after that and we fetch that record
    // then we won't be able to verify the processing on chain as the data will
    // not match. For this, we must only copy up to the number of signups

    // Copy the state tree, ballot tree, state leaves, and ballot leaves

    // start by setting the number of signups
    this.setNumSignups(numSignups);
    // copy up to numSignups state leaves
    this.pubKeys = this.maciStateRef.pubKeys.slice(0, Number(this.numSignups)).map((x) => x.copy());
    // ensure we have the correct actual state tree depth value
    this.actualStateTreeDepth = Math.max(1, Math.ceil(Math.log2(Number(this.numSignups))));

    this.stateTree = new LeanIMT(hashLeanIMT as LeanIMTHashFunction);

    // add all leaves
    this.pubKeys.forEach((pubKey) => {
      this.stateTree?.insert(pubKey.hash());
    });

    // create a poll state tree
    this.pollStateTree = new IncrementalQuinTree(
      this.actualStateTreeDepth,
      blankStateLeafHash,
      STATE_TREE_ARITY,
      hash2,
    );

    this.pollStateLeaves.forEach((stateLeaf) => {
      this.pollStateTree?.insert(stateLeaf.hash());
    });

    // Create as many ballots as state leaves
    this.emptyBallotHash = this.emptyBallot.hash();
    this.ballotTree = new IncrementalQuinTree(this.stateTreeDepth, this.emptyBallotHash, STATE_TREE_ARITY, hash2);
    this.ballotTree.insert(this.emptyBallotHash);

    // we fill the ballotTree with empty ballots hashes to match the number of signups in the tree
    while (this.ballots.length < this.pubKeys.length) {
      this.ballotTree.insert(this.emptyBallotHash);
      this.ballots.push(this.emptyBallot);
    }

    this.stateCopied = true;
  };

  /**
   * Process a message
   * @param message - The message to process
   * @returns The state leaf and ballot after processing
   */
  private processMessage = async (message: Message): Promise<{ stateLeaf: StateLeaf; ballot: Ballot }> => {
    // Validate message data
    message.data.forEach((d: bigint) => {
      assert(d < SNARK_FIELD_SIZE, "The message data is not in the correct range");
    });

    // Process the message and return the state leaf and ballot
    const { stateLeaves } = await this.processMessagesInternal([message]);
    const ballot = this.createBallot(message);
    
    return { stateLeaf: stateLeaves[0], ballot };
  };

  /**
   * Create a ballot from a message
   * @param message - The message to create a ballot from
   * @returns The ballot
   */
  private createBallot = (message: Message): Ballot => {
    const siblings = this.ballotTree?.getSiblings(message.data[0]) || [];
    const siblingsArray = siblings.map((sibling: bigint) => [sibling]);

    // Create nullifier from private key
    const inputNullifier = BigInt(message.data[1]);

    // Calculate vote start and end indices
    const voteStartIndex = 2;
    const voteEndIndex = voteStartIndex + Number(this.voteOptions);
    const saltIndex = voteEndIndex;

    return {
      votes: message.data.slice(voteStartIndex, voteEndIndex),
      salt: message.data[saltIndex],
      siblings: siblingsArray,
      nullifier: inputNullifier,
    };
  };

  /**
   * Inserts a Message and the corresponding public key used to generate the
   * ECDH shared key which was used to encrypt said message.
   * @param message - The message to insert
   * @param encPubKey - The public key used to encrypt the message
   */
  publishMessage = (message: Message, encPubKey: PubKey): void => {
    assert(
      encPubKey.rawPubKey[0] < SNARK_FIELD_SIZE && encPubKey.rawPubKey[1] < SNARK_FIELD_SIZE,
      "The public key is not in the correct range",
    );

    message.data.forEach((d) => {
      assert(d < SNARK_FIELD_SIZE, "The message data is not in the correct range");
    });

    // store the encryption pub key
    this.encPubKeys.push(encPubKey);
    // store the message locally
    this.messages.push(message);
    // add the message hash to the message tree
    const messageHash = message.hash(encPubKey);
    // update chain hash
    this.updateChainHash(messageHash);

    // Decrypt the message and store the Command
    // step 1. we generate the shared key
    const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey);
    try {
      // step 2. we decrypt it
      const { command } = PCommand.decrypt(message, sharedKey);
      // step 3. we store it in the commands array
      this.commands.push(command);
    } catch (e) {
      // if there is an error we store an empty command
      const keyPair = new Keypair();
      const command = new PCommand(0n, keyPair.pubKey, 0n, 0n, 0n, 0n, 0n);
      this.commands.push(command);
    }
  };

  /**
   * Updates message chain hash
   * @param messageHash hash of message with encPubKey
   */
  updateChainHash = (messageHash: bigint): void => {
    this.chainHash = hash2([this.chainHash, messageHash]);

    if (this.messages.length % this.batchSizes.messageBatchSize === 0) {
      this.batchHashes.push(this.chainHash);
      this.currentMessageBatchIndex += 1;
    }
  };

  /**
   * Create circuit input for poll joining
   * @param args - The arguments for poll joining
   * @returns The circuit input
   */
  joiningCircuitInputs = ({
    maciPrivKey,
    stateLeafIndex,
    pollPubKey,
  }: IJoiningCircuitArgs): IPollJoiningCircuitInputs => {
    // calculate the path elements for the state tree given the original state tree
    const { siblings, index } = this.stateTree!.generateProof(Number(stateLeafIndex));
    const siblingsLength = siblings.length;

    // The index must be converted to a list of indices, 1 for each tree level.
    // The circuit tree depth is this.stateTreeDepth, so the number of siblings must be this.stateTreeDepth,
    // even if the tree depth is actually 3. The missing siblings can be set to 0, as they
    // won't be used to calculate the root in the circuit.
    const indices: bigint[] = [];

    for (let i = 0; i < this.stateTreeDepth; i += 1) {
      // eslint-disable-next-line no-bitwise
      indices.push(BigInt((index >> i) & 1));

      if (i >= siblingsLength) {
        siblings[i] = BigInt(0);
      }
    }
    const siblingsArray = siblings.map((sibling) => [sibling]);

    // Create nullifier from private key
    const inputNullifier = BigInt(maciPrivKey.asCircuitInputs());
    const nullifier = poseidon([inputNullifier, this.pollId]);

    // Get state tree's root
    const stateRoot = this.stateTree!.root;

    // Set actualStateTreeDepth as number of initial siblings length
    const actualStateTreeDepth = BigInt(siblingsLength);

    const circuitInputs = {
      privKey: maciPrivKey.asCircuitInputs(),
      pollPubKey: pollPubKey.asCircuitInputs(),
      siblings: siblingsArray,
      indices,
      nullifier,
      stateRoot,
      actualStateTreeDepth,
      pollId: this.pollId,
    };

    return stringifyBigInts(circuitInputs) as unknown as IPollJoiningCircuitInputs;
  };

  /**
   * Create circuit input for poll joining
   * @param args - The arguments for poll joining
   * @returns The circuit input
   */
  joinedCircuitInputs = ({
    maciPrivKey,
    stateLeafIndex,
    voiceCreditsBalance,
    joinTimestamp,
  }: IJoinedCircuitArgs): IPollJoinedCircuitInputs => {
    const { pathElements, pathIndices } = this.pollStateTree!.genProof(Number(stateLeafIndex));
    const stateRoot = this.pollStateTree!.root;

    return stringifyBigInts({
      privKey: maciPrivKey.asCircuitInputs(),
      pathElements: pathElements.map((item: bigint) => item.toString()),
      voiceCreditsBalance: voiceCreditsBalance.toString(),
      joinTimestamp: joinTimestamp.toString(),
      pathIndices: pathIndices.map((item: number) => item.toString()),
      actualStateTreeDepth: BigInt(this.actualStateTreeDepth),
      stateRoot,
    }) as unknown as IPollJoinedCircuitInputs;
  };

  /**
   * Create circuit input for poll results
   * @returns The circuit input
   */
  resultsCircuitInputs = (): IPollResultsCircuitInputs => {
    const results = this.tallyResult.map((r) => r.toString());
    const resultsRoot = this.resultsTree!.root;
    const currentResultsCommitment = this.currentResultsCommitment.toString();
    const currentVotesForOption = this.currentVotesForOption.map((v) => v.toString());
    const currentSpentVoiceCreditsCommitment = this.currentSpentVoiceCreditsCommitment.toString();
    const currentPerVOSpentVoiceCreditsCommitment = this.currentPerVOSpentVoiceCreditsCommitment.toString();

    return stringifyBigInts({
      results,
      resultsRoot,
      currentResultsCommitment,
      currentVotesForOption,
      currentSpentVoiceCreditsCommitment,
      currentPerVOSpentVoiceCreditsCommitment,
    }) as unknown as IPollResultsCircuitInputs;
  };

  /**
   * Create circuit input for poll state
   * @returns The circuit input
   */
  stateCircuitInputs = (): IPollStateCircuitInputs => {
    const pollStateRoot = this.pollStateTree!.root;
    const pollBallotRoot = this.ballotTree!.root;

    return stringifyBigInts({
      pollStateRoot,
      pollBallotRoot,
    }) as unknown as IPollStateCircuitInputs;
  };

  /**
   * Pad last unclosed batch
   */
  padLastBatch = (): void => {
    if (this.messages.length % this.batchSizes.messageBatchSize !== 0) {
      this.batchHashes.push(this.chainHash);
    }
  };

  /**
   * This method checks if there are any unprocessed messages in the Poll instance.
   * @returns Returns true if the number of processed batches is
   * less than the total number of batches, false otherwise.
   */
  hasUnprocessedMessages = (): boolean => {
    const batchSize = this.batchSizes.messageBatchSize;

    let totalBatches = this.messages.length <= batchSize ? 1 : Math.floor(this.messages.length / batchSize);

    if (this.messages.length > batchSize && this.messages.length % batchSize > 0) {
      totalBatches += 1;
    }

    return this.numBatchesProcessed < totalBatches;
  };

  /**
   * Process a batch of messages
   * @param messages - The messages to process
   * @param incremental - Whether to process incrementally (skip already processed batches)
   * @returns The state leaves after processing the messages
   */
  processMessages = async (messages: Message[], incremental = false): Promise<StateLeaf[]> => {
    // If incremental processing is enabled, check if we've already processed this batch
    if (incremental) {
      const batchIndex = this.currentMessageBatchIndex;
      if (batchIndex < this.numBatchesProcessed) {
        // Skip this batch as it's already been processed
        return this.pollStateLeaves;
      }
    }

    // Process the messages
    const { stateLeaves, ballots } = await this.processMessagesInternal(messages);
    
    // Update state
    this.pollStateLeaves = stateLeaves;
    this.ballots = ballots;
    this.currentMessageBatchIndex += 1;
    this.numBatchesProcessed += 1;

    return stateLeaves;
  };

  /**
   * Tally the votes for the poll
   * @param incremental - Whether to tally incrementally (skip already tallied batches)
   * @returns The tally result
   */
  tallyVotes = async (incremental = false): Promise<bigint[]> => {
    // If incremental tallying is enabled, check if we've already tallied this batch
    if (incremental) {
      const batchIndex = this.currentMessageBatchIndex;
      if (batchIndex < this.numBatchesTallied) {
        // Skip this batch as it's already been tallied
        return this.tallyResult;
      }
    }

    // Tally the votes
    const { tallyResult, perVOSpentVoiceCredits, totalSpentVoiceCredits } = await this.tallyVotesInternal();
    
    // Update state
    this.tallyResult = tallyResult;
    this.perVOSpentVoiceCredits = perVOSpentVoiceCredits;
    this.totalSpentVoiceCredits = totalSpentVoiceCredits;
    this.currentMessageBatchIndex += 1;
    this.numBatchesTallied += 1;

    return tallyResult;
  };

  /**
   * Internal method to process messages
   * @param messages - The messages to process
   * @returns The state leaves and ballots after processing
   */
  private processMessagesInternal = async (messages: Message[]): Promise<{ stateLeaves: StateLeaf[]; ballots: Ballot[] }> => {
    const stateLeaves: StateLeaf[] = [];
    const ballots: Ballot[] = [];
    
    // Process each message
    for (const message of messages) {
      const { stateLeaf, ballot } = await this.processMessage(message);
      stateLeaves.push(stateLeaf);
      ballots.push(ballot);
    }
    
    return { stateLeaves, ballots };
  };

  /**
   * Internal method to tally votes
   * @returns The tally result, per vote option spent voice credits, and total spent voice credits
   */
  private tallyVotesInternal = async (): Promise<{ tallyResult: bigint[]; perVOSpentVoiceCredits: bigint[]; totalSpentVoiceCredits: bigint }> => {
    const tallyResult: bigint[] = new Array(this.voteOptions).fill(0n);
    const perVOSpentVoiceCredits: bigint[] = new Array(this.voteOptions).fill(0n);
    let totalSpentVoiceCredits = 0n;
    
    // Tally votes from ballots
    for (const ballot of this.ballots) {
      for (let i = 0; i < this.voteOptions; i++) {
        tallyResult[i] += ballot.votes[i];
        perVOSpentVoiceCredits[i] += ballot.votes[i] * ballot.votes[i];
        totalSpentVoiceCredits += ballot.votes[i] * ballot.votes[i];
      }
    }
    
    return { tallyResult, perVOSpentVoiceCredits, totalSpentVoiceCredits };
  };

  /**
   * Create a deep copy of the Poll object.
   * @returns A new instance of the Poll object with the same properties.
   */
  copy = (): Poll => {
    const copied = new Poll(
      BigInt(this.pollEndTimestamp.toString()),
      this.coordinatorKeypair.copy(),
      {
        intStateTreeDepth: Number(this.treeDepths.intStateTreeDepth),
        voteOptionTreeDepth: Number(this.treeDepths.voteOptionTreeDepth),
      },
      {
        tallyBatchSize: Number(this.batchSizes.tallyBatchSize.toString()),
        messageBatchSize: Number(this.batchSizes.messageBatchSize.toString()),
      },
      this.maciStateRef,
      this.voteOptions,
    );

    copied.pubKeys = this.pubKeys.map((x) => x.copy());
    copied.pollStateLeaves = this.pollStateLeaves.map((x) => x.copy());
    copied.messages = this.messages.map((x) => x.copy());
    copied.commands = this.commands.map((x) => x.copy());
    copied.ballots = this.ballots.map((x) => x.copy());
    copied.encPubKeys = this.encPubKeys.map((x) => x.copy());

    if (this.ballotTree) {
      copied.ballotTree = this.ballotTree.copy();
    }

    copied.currentMessageBatchIndex = this.currentMessageBatchIndex;
    copied.maciStateRef = this.maciStateRef;
    copied.tallyResult = this.tallyResult.map((x: bigint) => BigInt(x.toString()));
    copied.perVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x: bigint) => BigInt(x.toString()));

    copied.numBatchesProcessed = Number(this.numBatchesProcessed.toString());
    copied.numBatchesTallied = Number(this.numBatchesTallied.toString());
    copied.pollId = this.pollId;
    copied.totalSpentVoiceCredits = BigInt(this.totalSpentVoiceCredits.toString());

    copied.sbSalts = {};
    copied.resultRootSalts = {};
    copied.preVOSpentVoiceCreditsRootSalts = {};
    copied.spentVoiceCreditSubtotalSalts = {};

    Object.keys(this.sbSalts).forEach((k) => {
      copied.sbSalts[k] = BigInt(this.sbSalts[k].toString());
    });

    Object.keys(this.resultRootSalts).forEach((k) => {
      copied.resultRootSalts[k] = BigInt(this.resultRootSalts[k].toString());
    });

    Object.keys(this.preVOSpentVoiceCreditsRootSalts).forEach((k) => {
      copied.preVOSpentVoiceCreditsRootSalts[k] = BigInt(this.preVOSpentVoiceCreditsRootSalts[k].toString());
    });

    Object.keys(this.spentVoiceCreditSubtotalSalts).forEach((k) => {
      copied.spentVoiceCreditSubtotalSalts[k] = BigInt(this.spentVoiceCreditSubtotalSalts[k].toString());
    });

    // update the number of signups
    copied.setNumSignups(this.numSignups);

    return copied;
  };

  /**
   * Check if the Poll object is equal to another Poll object.
   * @param p - The Poll object to compare.
   * @returns True if the two Poll objects are equal, false otherwise.
   */
  equals = (p: Poll): boolean => {
    const result =
      this.coordinatorKeypair.equals(p.coordinatorKeypair) &&
      this.treeDepths.intStateTreeDepth === p.treeDepths.intStateTreeDepth &&
      this.treeDepths.voteOptionTreeDepth === p.treeDepths.voteOptionTreeDepth &&
      this.batchSizes.tallyBatchSize === p.batchSizes.tallyBatchSize &&
      this.batchSizes.messageBatchSize === p.batchSizes.messageBatchSize &&
      this.maxVoteOptions === p.maxVoteOptions &&
      this.messages.length === p.messages.length &&
      this.encPubKeys.length === p.encPubKeys.length &&
      this.numSignups === p.numSignups;

    if (!result) {
      return false;
    }

    for (let i = 0; i < this.messages.length; i += 1) {
      if (!this.messages[i].equals(p.messages[i])) {
        return false;
      }
    }
    for (let i = 0; i < this.encPubKeys.length; i += 1) {
      if (!this.encPubKeys[i].equals(p.encPubKeys[i])) {
        return false;
      }
    }
    return true;
  };

  /**
   * Serialize the Poll object to a JSON object
   * @returns a JSON object
   */
  toJSON(): IJsonPoll {
    return {
      pollEndTimestamp: this.pollEndTimestamp.toString(),
      treeDepths: this.treeDepths,
      batchSizes: this.batchSizes,
      maxVoteOptions: this.maxVoteOptions,
      voteOptions: this.voteOptions.toString(),
      messages: this.messages.map((message) => message.toJSON()),
      commands: this.commands.map((command) => command.toJSON()),
      ballots: this.ballots.map((ballot) => ballot.toJSON()),
      encPubKeys: this.encPubKeys.map((encPubKey) => encPubKey.serialize()),
      currentMessageBatchIndex: this.currentMessageBatchIndex,
      pubKeys: this.pubKeys.map((leaf) => leaf.toJSON()),
      pollStateLeaves: this.pollStateLeaves.map((leaf) => leaf.toJSON()),
      results: this.tallyResult.map((result) => result.toString()),
      numBatchesProcessed: this.numBatchesProcessed,
      numSignups: this.numSignups.toString(),
      chainHash: this.chainHash.toString(),
      pollNullifiers: [...this.pollNullifiers.keys()].map((nullifier) => nullifier.toString()),
      batchHashes: this.batchHashes.map((batchHash) => batchHash.toString()),
    };
  }

  /**
   * Deserialize a json object into a Poll instance
   * @param json the json object to deserialize
   * @param maciState the reference to the MaciState Class
   * @returns a new Poll instance
   */
  static fromJSON(json: IJsonPoll, maciState: MaciState): Poll {
    const poll = new Poll(
      BigInt(json.pollEndTimestamp),
      new Keypair(),
      json.treeDepths,
      json.batchSizes,
      maciState,
      BigInt(json.voteOptions),
    );

    // set all properties
    poll.pollStateLeaves = json.pollStateLeaves.map((leaf) => StateLeaf.fromJSON(leaf));
    poll.ballots = json.ballots.map((ballot) => Ballot.fromJSON(ballot));
    poll.encPubKeys = json.encPubKeys.map((key: string) => PubKey.deserialize(key));
    poll.messages = json.messages.map((message) => Message.fromJSON(message as IMessageContractParams));
    poll.commands = json.commands.map((command: IJsonPCommand) => PCommand.fromJSON(command));
    poll.tallyResult = json.results.map((result: string) => BigInt(result));
    poll.currentMessageBatchIndex = json.currentMessageBatchIndex;
    poll.numBatchesProcessed = json.numBatchesProcessed;
    poll.chainHash = BigInt(json.chainHash);
    poll.batchHashes = json.batchHashes.map((batchHash: string) => BigInt(batchHash));
    poll.pollNullifiers = new Map(json.pollNullifiers.map((nullifier) => [BigInt(nullifier), true]));

    // copy maci state
    poll.updatePoll(BigInt(json.numSignups));

    return poll;
  }

  /**
   * Set the coordinator's keypair
   * @param serializedPrivateKey - the serialized private key
   */
  setCoordinatorKeypair = (serializedPrivateKey: string): void => {
    this.coordinatorKeypair = new Keypair(PrivKey.deserialize(serializedPrivateKey));
  };

  /**
   * Set the number of signups to match the ones from the contract
   * @param numSignups - the number of signups
   */
  setNumSignups = (numSignups: bigint): void => {
    this.numSignups = numSignups;
  };

  /**
   * Get the number of signups
   * @returns The number of signups
   */
  getNumSignups = (): bigint => this.numSignups;
}
