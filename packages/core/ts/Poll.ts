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
  PublicKey,
  PrivateKey,
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

// Define voting modes for TypeScript logic
export const VotingMode = {
  QV: 0,
  NON_QV: 1,
  FULL_CREDIT: 2,
} as const;

export type VotingMode = (typeof VotingMode)[keyof typeof VotingMode];

/**
 * A representation of the Poll contract.
 */
export class Poll implements IPoll {
  // Note that we only store the PublicKey on-chain while this class stores the
  // Keypair for the sake of convenience
  coordinatorKeypair: Keypair;

  treeDepths: TreeDepths;

  batchSizes: BatchSizes;

  voteOptions: bigint;

  maxVoteOptions: number;

  // the actual depth of the state tree (can be <= stateTreeDepth)
  actualStateTreeDepth: number;

  pollEndTimestamp: bigint;

  ballots: Ballot[] = [];

  ballotTree?: IncrementalQuinTree;

  messages: Message[] = [];

  commands: PCommand[] = [];

  encryptionPublicKeys: PublicKey[] = [];

  stateCopied = false;

  pubKeys: PublicKey[] = [padKey];

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

  // Add a mode property to the Poll class
  mode: VotingMode;

  // how many users signed up
  private numSignups = 0n;

  /**
   * Constructs a new Poll object.
   * @param pollEndTimestamp - The Unix timestamp at which the poll ends.
   * @param coordinatorKeypair - The keypair of the coordinator.
   * @param treeDepths - The depths of the trees used in the poll.
   * @param batchSizes - The sizes of the batches used in the poll.
   * @param maciStateRef - The reference to the MACI state.
   * @param pollId - The poll id
   * @param mode - The voting mode for the poll
   */
  constructor(
    pollEndTimestamp: bigint,
    coordinatorKeypair: Keypair,
    treeDepths: TreeDepths,
    batchSizes: BatchSizes,
    maciStateRef: MaciState,
    voteOptions: bigint,
    mode: VotingMode = VotingMode.QV, // Default to QV for backward compatibility
  ) {
    this.pollEndTimestamp = pollEndTimestamp;
    this.coordinatorKeypair = coordinatorKeypair;
    this.treeDepths = treeDepths;
    this.batchSizes = batchSizes;
    this.mode = mode; // Set the mode
    if (voteOptions > VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth) {
      throw new Error("Vote options cannot be greater than the number of leaves in the vote option tree");
    }
    this.voteOptions = voteOptions;
    this.maxVoteOptions = VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth;
    this.maciStateRef = maciStateRef;
    this.pollId = BigInt(maciStateRef.polls.size);
    this.actualStateTreeDepth = treeDepths.stateTreeDepth;
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
   * @param publicKey - The poll public key.
   * @param newVoiceCreditBalance - New voice credit balance of the user.
   * @returns The index of added state leaf
   */
  joinPoll = (nullifier: bigint, publicKey: PublicKey, newVoiceCreditBalance: bigint): number => {
    const stateLeaf = new StateLeaf(publicKey, newVoiceCreditBalance);

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
    this.pubKeys.forEach((publicKey) => {
      this.stateTree?.insert(publicKey.hash());
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
    this.ballotTree = new IncrementalQuinTree(
      Number(this.treeDepths.stateTreeDepth),
      this.emptyBallotHash,
      STATE_TREE_ARITY,
      hash2,
    );
    this.ballotTree.insert(this.emptyBallotHash);

    // we fill the ballotTree with empty ballots hashes to match the number of signups in the tree
    while (this.ballots.length < this.pubKeys.length) {
      this.ballotTree.insert(this.emptyBallotHash);
      this.ballots.push(this.emptyBallot);
    }

    this.stateCopied = true;
  };

  /**
   * Process one message.
   * @param message - The message to process.
   * @param encryptionPublicKey - The public key associated with the encryption private key.
   * @returns A number of variables which will be used in the zk-SNARK circuit.
   */
  processMessage = (message: Message, encryptionPublicKey: PubKey): IProcessMessagesOutput => {
    try {
      // Decrypt the message
      const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privateKey, encryptionPublicKey);

      const { command, signature } = PCommand.decrypt(message, sharedKey);

      const stateLeafIndex = command.stateIndex;

      // If the state tree index in the command is invalid, do nothing
      if (
        stateLeafIndex >= BigInt(this.ballots.length) ||
        stateLeafIndex < 1n ||
        stateLeafIndex >= BigInt(this.pollStateTree?.nextIndex || -1)
      ) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidStateLeafIndex);
      }

      // The user to update (or not)
      const stateLeaf = this.pollStateLeaves[Number(stateLeafIndex)];

      // The ballot to update (or not)
      const ballot = this.ballots[Number(stateLeafIndex)];

      // If the signature is invalid, do nothing
      if (!command.verifySignature(signature, stateLeaf.publicKey)) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidSignature);
      }

      // If the nonce is invalid, do nothing
      if (command.nonce !== ballot.nonce + 1n) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidNonce);
      }

      // If the vote option index is invalid, do nothing
      if (command.voteOptionIndex < 0n || command.voteOptionIndex >= BigInt(this.voteOptions)) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidVoteOptionIndex);
      }

      const voteOptionIndex = Number(command.voteOptionIndex);
      const originalVoteWeight = ballot.votes[voteOptionIndex];

      // the voice credits left are:
      // voiceCreditsBalance (how many the user has) +
      // voiceCreditsPreviouslySpent (the original vote weight for this option) ** 2 -
      // command.newVoteWeight ** 2 (the new vote weight squared)
      // basically we are replacing the previous vote weight for this
      // particular vote option with the new one
      // but we need to ensure that we are not going >= balance
      // @note that above comment is valid for quadratic voting
      // for non quadratic voting, we simply remove the exponentiation

      let voiceCreditsLeft: bigint;

      if (this.mode === VotingMode.QV) {
        voiceCreditsLeft =
          stateLeaf.voiceCreditBalance +
          originalVoteWeight * originalVoteWeight -
          command.newVoteWeight * command.newVoteWeight;
      } else if (this.mode === VotingMode.NON_QV) {
        voiceCreditsLeft = stateLeaf.voiceCreditBalance + originalVoteWeight - command.newVoteWeight;
      } else if (this.mode === VotingMode.FULL_CREDIT) {
        // Check if the new vote weight equals the available balance
        if (command.newVoteWeight !== stateLeaf.voiceCreditBalance + originalVoteWeight) {
          throw new ProcessMessageError(ProcessMessageErrors.IncorrectVoteWeightForFullCredit);
        }
        // After voting with full credits, the balance should be 0
        voiceCreditsLeft = 0n;
      } else {
        // Should not happen
        throw new Error("Invalid voting mode");
      }

      // If the remaining voice credits is insufficient, do nothing
      // (This check might be redundant for FULL_CREDIT if the above check is correct)
      if (voiceCreditsLeft < 0n) {
        throw new ProcessMessageError(ProcessMessageErrors.InsufficientVoiceCredits);
      }

      // Deep-copy the state leaf and update its attributes
      const newStateLeaf = stateLeaf.copy();
      newStateLeaf.voiceCreditBalance = voiceCreditsLeft;
      // if the key changes, this is effectively a key-change message too
      newStateLeaf.publicKey = command.newPublicKey.copy();

      // Deep-copy the ballot and update its attributes
      const newBallot = ballot.copy();
      // increase the nonce
      newBallot.nonce += 1n;
      // we change the vote for this exact vote option
      newBallot.votes[voteOptionIndex] = command.newVoteWeight;

      // calculate the path elements for the state tree given the original state tree (before any changes)
      // changes could effectively be made by this new vote - either a key change or vote change
      // would result in a different state leaf
      const originalStateLeafPathElements = this.pollStateTree?.genProof(Number(stateLeafIndex)).pathElements;
      // calculate the path elements for the ballot tree given the original ballot tree (before any changes)
      // changes could effectively be made by this new ballot
      const originalBallotPathElements = this.ballotTree?.genProof(Number(stateLeafIndex)).pathElements;

      // create a new quinary tree where we insert the votes of the origin (up until this message is processed) ballot
      const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, VOTE_OPTION_TREE_ARITY, hash5);
      for (let i = 0; i < this.ballots[0].votes.length; i += 1) {
        vt.insert(ballot.votes[i]);
      }
      // calculate the path elements for the vote option tree given the original vote option tree (before any changes)
      const originalVoteWeightsPathElements = vt.genProof(voteOptionIndex).pathElements;
      // we return the data which is then to be used in the processMessage circuit
      // to generate a proof of processing
      return {
        stateLeafIndex: Number(stateLeafIndex),
        newStateLeaf,
        originalStateLeaf: stateLeaf.copy(),
        originalStateLeafPathElements,
        originalVoteWeight,
        originalVoteWeightsPathElements,
        newBallot,
        originalBallot: ballot.copy(),
        originalBallotPathElements,
        command,
      };
    } catch (e) {
      if (e instanceof ProcessMessageError) {
        throw e;
      } else {
        throw new ProcessMessageError(ProcessMessageErrors.FailedDecryption);
      }
    }
  };

  /**
   * Inserts a Message and the corresponding public key used to generate the
   * ECDH shared key which was used to encrypt said message.
   * @param message - The message to insert
   * @param encryptionPublicKey - The public key used to encrypt the message
   */
  publishMessage = (message: Message, encryptionPublicKey: PublicKey): void => {
    assert(
      encryptionPublicKey.rawPubKey[0] < SNARK_FIELD_SIZE && encryptionPublicKey.rawPubKey[1] < SNARK_FIELD_SIZE,
      "The public key is not in the correct range",
    );

    message.data.forEach((d) => {
      assert(d < SNARK_FIELD_SIZE, "The message data is not in the correct range");
    });

    // store the encryption pub key
    this.encryptionPublicKeys.push(encryptionPublicKey);
    // store the message locally
    this.messages.push(message);
    // add the message hash to the message tree
    const messageHash = message.hash(encryptionPublicKey);
    // update chain hash
    this.updateChainHash(messageHash);

    // Decrypt the message and store the Command
    // step 1. we generate the shared key
    const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privateKey, encryptionPublicKey);
    try {
      // step 2. we decrypt it
      const { command } = PCommand.decrypt(message, sharedKey);
      // step 3. we store it in the commands array
      this.commands.push(command);
    } catch (e) {
      // if there is an error we store an empty command
      const keyPair = new Keypair();
      const command = new PCommand(0n, keyPair.publicKey, 0n, 0n, 0n, 0n, 0n);
      this.commands.push(command);
    }
  };

  /**
   * Updates message chain hash
   * @param messageHash hash of message with encryptionPublicKey
   */
  updateChainHash = (messageHash: bigint): void => {
    this.chainHash = hash2([this.chainHash, messageHash]);

    if (this.messages.length % this.batchSizes.messageBatchSize === 0) {
      this.batchHashes.push(this.chainHash);
      this.currentMessageBatchIndex += 1;
    }
  };

  /**
   * Create circuit input for pollJoining
   * @param args Poll joining circuit inputs
   * @returns stringified circuit inputs
   */
  joiningCircuitInputs = ({
    maciPrivateKey,
    stateLeafIndex,
    pollPublicKey,
  }: IJoiningCircuitArgs): IPollJoiningCircuitInputs => {
    // calculate the path elements for the state tree given the original state tree
    const { siblings, index } = this.stateTree!.generateProof(Number(stateLeafIndex));
    const siblingsLength = siblings.length;

    // The index must be converted to a list of indices, 1 for each tree level.
    // The circuit tree depth is this.treeDepths.stateTreeDepth, so the number of siblings must be this.treeDepths.stateTreeDepth,
    // even if the tree depth is actually 3. The missing siblings can be set to 0, as they
    // won't be used to calculate the root in the circuit.
    const indices: bigint[] = [];

    for (let i = 0; i < this.treeDepths.stateTreeDepth; i += 1) {
      // eslint-disable-next-line no-bitwise
      indices.push(BigInt((index >> i) & 1));

      if (i >= siblingsLength) {
        siblings[i] = BigInt(0);
      }
    }
    const siblingsArray = siblings.map((sibling) => [sibling]);

    // Create nullifier from private key
    const inputNullifier = BigInt(maciPrivateKey.asCircuitInputs());
    const nullifier = poseidon([inputNullifier, this.pollId]);

    // Get state tree's root
    const stateRoot = this.stateTree!.root;

    // Set actualStateTreeDepth as number of initial siblings length
    const actualStateTreeDepth = BigInt(siblingsLength);

    const circuitInputs = {
      privateKey: maciPrivateKey.asCircuitInputs(),
      pollPublicKey: pollPublicKey.asCircuitInputs(),
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
   * Create circuit input for pollJoined
   * @param args Poll joined circuit inputs
   * @returns stringified circuit inputs
   */
  joinedCircuitInputs = ({
    maciPrivateKey,
    stateLeafIndex,
    voiceCreditsBalance,
  }: IJoinedCircuitArgs): IPollJoinedCircuitInputs => {
    // calculate the path elements for the state tree given the original state tree
    const { root: stateRoot, pathElements, pathIndices } = this.pollStateTree!.genProof(Number(stateLeafIndex));

    const elementsLength = pathIndices.length;

    for (let i = 0; i < this.treeDepths.stateTreeDepth; i += 1) {
      if (i >= elementsLength) {
        pathElements[i] = [0n];
        pathIndices[i] = 0;
      }
    }

    const circuitInputs = {
      privateKey: maciPrivateKey.asCircuitInputs(),
      pathElements: pathElements.map((item) => item.toString()),
      voiceCreditsBalance: voiceCreditsBalance.toString(),
      pathIndices: pathIndices.map((item) => item.toString()),
      actualStateTreeDepth: BigInt(this.actualStateTreeDepth),
      stateRoot,
    };

    return stringifyBigInts(circuitInputs) as unknown as IPollJoinedCircuitInputs;
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
   * Process _batchSize messages starting from the saved index. This
   * function will process messages even if the number of messages is not an
   * exact multiple of _batchSize. e.g. if there are 10 messages, index is
   * 8, and _batchSize is 4, this function will only process the last two
   * messages in this.messages, and finally update the zeroth state leaf.
   * Note that this function will only process as many state leaves as there
   * are ballots to prevent accidental inclusion of a new user after this
   * poll has concluded.
   * @param pollId The ID of the poll associated with the messages to
   *        process
   * @param quiet - Whether to log errors or not
   * @returns stringified circuit inputs
   */
  processMessages = (pollId: bigint, qv = true, quiet = true): IProcessMessagesCircuitInputs => {
    assert(this.hasUnprocessedMessages(), "No more messages to process");

    const batchSize = this.batchSizes.messageBatchSize;

    if (this.numBatchesProcessed === 0) {
      // Prevent other polls from being processed until this poll has
      // been fully processed
      this.maciStateRef.pollBeingProcessed = true;
      this.maciStateRef.currentPollBeingProcessed = pollId;

      this.padLastBatch();

      this.currentMessageBatchIndex = this.batchHashes.length - 1;

      this.sbSalts[this.currentMessageBatchIndex] = 0n;
    }

    // Only allow one poll to be processed at a time
    if (this.maciStateRef.pollBeingProcessed) {
      assert(this.maciStateRef.currentPollBeingProcessed === pollId, "Another poll is currently being processed");
    }

    // The starting index must be valid
    assert(this.currentMessageBatchIndex >= 0, "The starting index must be >= 0");

    // ensure we copy the state from MACI when we start processing the
    // first batch
    if (!this.stateCopied) {
      throw new Error("You must update the poll with the correct data first");
    }

    // Generate circuit inputs
    const circuitInputs = stringifyBigInts(
      this.genProcessMessagesCircuitInputsPartial(this.currentMessageBatchIndex),
    ) as CircuitInputs;

    // we want to store the state leaves at this point in time
    // and the path elements of the state tree
    const currentStateLeaves: StateLeaf[] = [];
    const currentStateLeavesPathElements: PathElements[] = [];

    // we want to store the ballots at this point in time
    // and the path elements of the ballot tree
    const currentBallots: Ballot[] = [];
    const currentBallotsPathElements: PathElements[] = [];

    // we want to store the vote weights at this point in time
    // and the path elements of the vote weight tree
    const currentVoteWeights: bigint[] = [];
    const currentVoteWeightsPathElements: PathElements[] = [];

    // loop through the batch of messages
    for (let i = 0; i < batchSize; i += 1) {
      // we process the messages in reverse order
      const idx = this.currentMessageBatchIndex * batchSize - i - 1;
      assert(idx >= 0, "The message index must be >= 0");
      let message: Message;
      let encryptionPublicKey: PublicKey;
      if (idx < this.messages.length) {
        message = this.messages[idx];
        encryptionPublicKey = this.encryptionPublicKeys[idx];

        try {
          // check if the command is valid
          const r = this.processMessage(message, encryptionPublicKey, qv);
          const index = r.stateLeafIndex!;

          // we add at position 0 the original data
          currentStateLeaves.unshift(r.originalStateLeaf!);
          currentBallots.unshift(r.originalBallot!);
          currentVoteWeights.unshift(r.originalVoteWeight!);
          currentVoteWeightsPathElements.unshift(r.originalVoteWeightsPathElements!);
          currentStateLeavesPathElements.unshift(r.originalStateLeafPathElements!);
          currentBallotsPathElements.unshift(r.originalBallotPathElements!);

          // update the state leaves with the new state leaf (result of processing the message)
          this.pollStateLeaves[index] = r.newStateLeaf!.copy();

          // we also update the state tree with the hash of the new state leaf
          this.pollStateTree?.update(index, r.newStateLeaf!.hash());

          // store the new ballot
          this.ballots[index] = r.newBallot!;
          // update the ballot tree
          this.ballotTree?.update(index, r.newBallot!.hash());
        } catch (e) {
          // if the error is not a ProcessMessageError we throw it and exit here
          // otherwise we continue processing but add the default blank data instead of
          // this invalid message
          if (e instanceof ProcessMessageError) {
            // if logging is enabled, and it's not the first message, print the error
            if (!quiet && idx !== 0) {
              // eslint-disable-next-line no-console
              console.log(`Error at message index ${idx} - ${e.message}`);
            }

            // @note we want to send the correct state leaf to the circuit
            // even if a message is invalid
            // this way if a message is invalid we can still generate a proof of processing
            // we also want to prevent a DoS attack by a voter
            // which sends a message that when force decrypted on the circuit
            // results in a valid state index thus forcing the circuit to look
            // for a valid state leaf, and failing to generate a proof

            // gen shared key
            const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privateKey, encryptionPublicKey);

            // force decrypt it
            const { command } = PCommand.decrypt(message, sharedKey, true);

            // cache state leaf index
            const stateLeafIndex = command.stateIndex;

            // if the state leaf index is valid then use it
            if (stateLeafIndex < this.pollStateLeaves.length) {
              currentStateLeaves.unshift(this.pollStateLeaves[Number(stateLeafIndex)].copy());
              currentStateLeavesPathElements.unshift(this.pollStateTree!.genProof(Number(stateLeafIndex)).pathElements);

              // copy the ballot
              const ballot = this.ballots[Number(stateLeafIndex)].copy();
              currentBallots.unshift(ballot);
              currentBallotsPathElements.unshift(this.ballotTree!.genProof(Number(stateLeafIndex)).pathElements);

              // @note we check that command.voteOptionIndex is valid so < voteOptions
              // this might be unnecessary but we do it to prevent a possible DoS attack
              // from voters who could potentially encrypt a message in such as way that
              // when decrypted it results in a valid state leaf index but an invalid vote option index
              if (command.voteOptionIndex < this.voteOptions) {
                currentVoteWeights.unshift(ballot.votes[Number(command.voteOptionIndex)]);

                // create a new quinary tree and add all votes we have so far
                const vt = new IncrementalQuinTree(
                  this.treeDepths.voteOptionTreeDepth,
                  0n,
                  VOTE_OPTION_TREE_ARITY,
                  hash5,
                );

                // fill the vote option tree with the votes we have so far
                for (let j = 0; j < this.ballots[0].votes.length; j += 1) {
                  vt.insert(ballot.votes[j]);
                }

                // get the path elements for the first vote leaf
                currentVoteWeightsPathElements.unshift(vt.genProof(Number(command.voteOptionIndex)).pathElements);
              } else {
                currentVoteWeights.unshift(ballot.votes[0]);

                // create a new quinary tree and add all votes we have so far
                const vt = new IncrementalQuinTree(
                  this.treeDepths.voteOptionTreeDepth,
                  0n,
                  VOTE_OPTION_TREE_ARITY,
                  hash5,
                );

                // fill the vote option tree with the votes we have so far
                for (let j = 0; j < this.ballots[0].votes.length; j += 1) {
                  vt.insert(ballot.votes[j]);
                }

                // get the path elements for the first vote leaf
                currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
              }
            } else {
              // just use state leaf index 0
              currentStateLeaves.unshift(this.pollStateLeaves[0].copy());
              currentStateLeavesPathElements.unshift(this.pollStateTree!.genProof(0).pathElements);
              currentBallots.unshift(this.ballots[0].copy());
              currentBallotsPathElements.unshift(this.ballotTree!.genProof(0).pathElements);

              // Since the command is invalid, we use a zero vote weight
              currentVoteWeights.unshift(this.ballots[0].votes[0]);

              // create a new quinary tree and add an empty vote
              const vt = new IncrementalQuinTree(
                this.treeDepths.voteOptionTreeDepth,
                0n,
                VOTE_OPTION_TREE_ARITY,
                hash5,
              );
              vt.insert(this.ballots[0].votes[0]);
              // get the path elements for this empty vote weight leaf
              currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
            }
          } else {
            throw e;
          }
        }
      } else {
        // Since we don't have a command at that position, use a blank state leaf
        currentStateLeaves.unshift(this.pollStateLeaves[0].copy());
        currentStateLeavesPathElements.unshift(this.pollStateTree!.genProof(0).pathElements);
        // since the command is invliad we use the blank ballot
        currentBallots.unshift(this.ballots[0].copy());
        currentBallotsPathElements.unshift(this.ballotTree!.genProof(0).pathElements);

        // Since the command is invalid, we use a zero vote weight
        currentVoteWeights.unshift(this.ballots[0].votes[0]);

        // create a new quinary tree and add an empty vote
        const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, VOTE_OPTION_TREE_ARITY, hash5);
        vt.insert(this.ballots[0].votes[0]);

        // get the path elements for this empty vote weight leaf
        currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
      }
    }

    // store the data in the circuit inputs object
    circuitInputs.currentStateLeaves = currentStateLeaves.map((x) => x.asCircuitInputs());
    // we need to fill the array with 0s to match the length of the state leaves
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < currentStateLeavesPathElements.length; i += 1) {
      while (currentStateLeavesPathElements[i].length < this.treeDepths.stateTreeDepth) {
        currentStateLeavesPathElements[i].push([0n]);
      }
    }

    circuitInputs.currentStateLeavesPathElements = currentStateLeavesPathElements;
    circuitInputs.currentBallots = currentBallots.map((x) => x.asCircuitInputs());
    circuitInputs.currentBallotsPathElements = currentBallotsPathElements;
    circuitInputs.currentVoteWeights = currentVoteWeights;
    circuitInputs.currentVoteWeightsPathElements = currentVoteWeightsPathElements;

    // record that we processed one batch
    this.numBatchesProcessed += 1;

    if (this.currentMessageBatchIndex > 0) {
      this.currentMessageBatchIndex -= 1;
    }

    // ensure newSbSalt differs from currentSbSalt
    let newSbSalt = genRandomSalt();
    while (this.sbSalts[this.currentMessageBatchIndex] === newSbSalt) {
      newSbSalt = genRandomSalt();
    }
    this.sbSalts[this.currentMessageBatchIndex] = newSbSalt;

    // store the salt in the circuit inputs
    circuitInputs.newSbSalt = newSbSalt;
    const newStateRoot = this.pollStateTree!.root;
    const newBallotRoot = this.ballotTree!.root;
    // create a commitment to the state and ballot tree roots
    // this will be the hash of the roots with a salt
    circuitInputs.newSbCommitment = hash3([newStateRoot, newBallotRoot, newSbSalt]);

    const coordinatorPublicKeyHash = this.coordinatorKeypair.publicKey.hash();

    // If this is the last batch, release the lock
    if (this.numBatchesProcessed * batchSize >= this.messages.length) {
      this.maciStateRef.pollBeingProcessed = false;
    }

    // ensure we pass the dynamic tree depth
    circuitInputs.actualStateTreeDepth = this.actualStateTreeDepth.toString();

    return stringifyBigInts({
      ...circuitInputs,
      coordinatorPublicKeyHash,
    }) as unknown as IProcessMessagesCircuitInputs;
  };

  /**
   * Generates partial circuit inputs for processing a batch of messages
   * @param index - The index of the partial batch.
   * @returns stringified partial circuit inputs
   */
  private genProcessMessagesCircuitInputsPartial = (index: number): CircuitInputs => {
    const { messageBatchSize } = this.batchSizes;

    assert(index <= this.messages.length, "The index must be <= the number of messages");

    // fill the messages array with a copy of the messages we have
    // plus empty messages to fill the batch

    // @note create a message with state index 0 to add as padding
    // this way the message will look for state leaf 0
    // and no effect will take place

    // create a random key
    const key = new Keypair();
    // gen ecdh key
    const ecdh = Keypair.genEcdhSharedKey(key.privateKey, this.coordinatorKeypair.publicKey);
    // create an empty command with state index 0n
    const emptyCommand = new PCommand(0n, key.publicKey, 0n, 0n, 0n, 0n, 0n);

    // encrypt it
    const msg = emptyCommand.encrypt(emptyCommand.sign(key.privateKey), ecdh);

    // copy the messages to a new array
    let messages = this.messages.map((x) => x.asCircuitInputs());

    // pad with our state index 0 message
    while (messages.length % messageBatchSize > 0) {
      messages.push(msg.asCircuitInputs());
    }

    // copy the public keys, pad the array with the last keys if needed
    let encryptionPublicKeys = this.encryptionPublicKeys.map((x) => x.copy());
    while (encryptionPublicKeys.length % messageBatchSize > 0) {
      // pad with the public key used to encrypt the message with state index 0 (padding)
      encryptionPublicKeys.push(key.publicKey.copy());
    }

    // validate that the batch index is correct, if not fix it
    // this means that the end will be the last message
    let batchEndIndex = index * messageBatchSize;

    if (batchEndIndex > this.messages.length) {
      batchEndIndex = this.messages.length;
    }

    const batchStartIndex = index > 0 ? (index - 1) * messageBatchSize : 0;

    // we only take the messages we need for this batch
    // it slice messages array from index of first message in current batch to
    // index of last message in current batch
    messages = messages.slice(batchStartIndex, index * messageBatchSize);

    // then take the ones part of this batch
    encryptionPublicKeys = encryptionPublicKeys.slice(batchStartIndex, index * messageBatchSize);

    // cache tree roots
    const currentStateRoot = this.pollStateTree!.root;
    const currentBallotRoot = this.ballotTree!.root;
    // calculate the current state and ballot root
    // commitment which is the hash of the state tree
    // root, the ballot tree root and a salt
    const currentSbCommitment = hash3([currentStateRoot, currentBallotRoot, this.sbSalts[index]]);

    const inputBatchHash = this.batchHashes[index - 1];
    const outputBatchHash = this.batchHashes[index];

    return stringifyBigInts({
      numSignUps: BigInt(this.numSignups),
      batchEndIndex: BigInt(batchEndIndex),
      index: BigInt(batchStartIndex),
      inputBatchHash,
      outputBatchHash,
      messages,
      actualStateTreeDepth: BigInt(this.actualStateTreeDepth),
      coordinatorPrivateKey: this.coordinatorKeypair.privateKey.asCircuitInputs(),
      encryptionPublicKeys: encryptionPublicKeys.map((x) => x.asCircuitInputs()),
      currentStateRoot,
      currentBallotRoot,
      currentSbCommitment,
      currentSbSalt: this.sbSalts[this.currentMessageBatchIndex],
      voteOptions: this.voteOptions,
    }) as CircuitInputs;
  };

  /**
   * Process all messages. This function does not update the ballots or state
   * leaves; rather, it copies and then updates them. This makes it possible
   * to test the result of multiple processMessage() invocations.
   * @returns The state leaves and ballots of the poll
   */
  processAllMessages = (): { stateLeaves: StateLeaf[]; ballots: Ballot[] } => {
    const stateLeaves = this.pollStateLeaves.map((x) => x.copy());
    const ballots = this.ballots.map((x) => x.copy());

    // process all messages in one go (batch by batch but without manual intervention)
    while (this.hasUnprocessedMessages()) {
      this.processMessages(this.pollId);
    }

    return { stateLeaves, ballots };
  };

  /**
   * Checks whether there are any untallied ballots.
   * @returns Whether there are any untallied ballots
   */
  hasUntalliedBallots = (): boolean => this.numBatchesTallied * this.batchSizes.tallyBatchSize < this.ballots.length;

  /**
   * This method tallies a ballots and updates the tally results.
   * @returns the circuit inputs for the TallyVotes circuit.
   */
  tallyVotes = (): ITallyCircuitInputs => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.sbSalts[this.currentMessageBatchIndex] === undefined) {
      throw new Error("You must process the messages first");
    }

    const batchSize = this.batchSizes.tallyBatchSize;

    assert(this.hasUntalliedBallots(), "No more ballots to tally");

    // calculate where we start tallying next
    const batchStartIndex = this.numBatchesTallied * batchSize;

    // get the salts needed for the commitments
    const currentResultsRootSalt = batchStartIndex === 0 ? 0n : this.resultRootSalts[batchStartIndex - batchSize];

    const currentPerVOSpentVoiceCreditsRootSalt =
      batchStartIndex === 0 ? 0n : this.preVOSpentVoiceCreditsRootSalts[batchStartIndex - batchSize];

    const currentSpentVoiceCreditSubtotalSalt =
      batchStartIndex === 0 ? 0n : this.spentVoiceCreditSubtotalSalts[batchStartIndex - batchSize];

    // generate a commitment to the current results
    const currentResultsCommitment = genTreeCommitment(
      this.tallyResult,
      currentResultsRootSalt,
      this.treeDepths.voteOptionTreeDepth,
    );

    // generate a commitment to the current per VO spent voice credits
    const currentPerVOSpentVoiceCreditsCommitment = this.genPerVOSpentVoiceCreditsCommitment(
      currentPerVOSpentVoiceCreditsRootSalt,
      batchStartIndex,
      true,
    );

    // generate a commitment to the current spent voice credits
    const currentSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      currentSpentVoiceCreditSubtotalSalt,
      batchStartIndex,
      true,
    );

    // the current commitment for the first batch will be 0
    // otherwise calculate as
    // hash([
    //  currentResultsCommitment,
    //  currentSpentVoiceCreditsCommitment,
    //  currentPerVOSpentVoiceCreditsCommitment
    // ])
    const currentTallyCommitment =
      batchStartIndex === 0
        ? 0n
        : hash3([
            currentResultsCommitment,
            currentSpentVoiceCreditsCommitment,
            currentPerVOSpentVoiceCreditsCommitment,
          ]);

    const ballots: Ballot[] = [];
    const currentResults = this.tallyResult.map((x) => BigInt(x.toString()));
    const currentPerVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x) => BigInt(x.toString()));
    const currentSpentVoiceCreditSubtotal = BigInt(this.totalSpentVoiceCredits.toString());

    // loop in normal order to tally the ballots one by one
    for (let i = this.numBatchesTallied * batchSize; i < this.numBatchesTallied * batchSize + batchSize; i += 1) {
      // we stop if we have no more ballots to tally
      if (i >= this.ballots.length) {
        break;
      }

      // save to the local ballot array
      ballots.push(this.ballots[i]);

      // for each possible vote option we loop and calculate
      for (let j = 0; j < this.maxVoteOptions; j += 1) {
        const v = this.ballots[i].votes[j];

        // the vote itself will be a quadratic vote (sqrt(voiceCredits))
        this.tallyResult[j] += v;

        // the per vote option spent voice credits will be the sum of the squares of the votes
        this.perVOSpentVoiceCredits[j] += v * v;

        // the total spent voice credits will be the sum of the squares of the votes
        this.totalSpentVoiceCredits += v * v;
      }
    }

    const emptyBallot = new Ballot(this.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);

    // pad the ballots array
    while (ballots.length < batchSize) {
      ballots.push(emptyBallot);
    }

    // generate the new salts
    const newResultsRootSalt = genRandomSalt();
    const newPerVOSpentVoiceCreditsRootSalt = genRandomSalt();
    const newSpentVoiceCreditSubtotalSalt = genRandomSalt();

    // and save them to be used in the next batch
    this.resultRootSalts[batchStartIndex] = newResultsRootSalt;
    this.preVOSpentVoiceCreditsRootSalts[batchStartIndex] = newPerVOSpentVoiceCreditsRootSalt;
    this.spentVoiceCreditSubtotalSalts[batchStartIndex] = newSpentVoiceCreditSubtotalSalt;

    // generate the new results commitment with the new salts and data
    const newResultsCommitment = genTreeCommitment(
      this.tallyResult,
      newResultsRootSalt,
      this.treeDepths.voteOptionTreeDepth,
    );

    // generate the new spent voice credits commitment with the new salts and data
    const newSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      newSpentVoiceCreditSubtotalSalt,
      batchStartIndex + batchSize,
      true,
    );

    // generate the new per VO spent voice credits commitment with the new salts and data
    const newPerVOSpentVoiceCreditsCommitment = this.genPerVOSpentVoiceCreditsCommitment(
      newPerVOSpentVoiceCreditsRootSalt,
      batchStartIndex + batchSize,
      true,
    );

    // generate the new tally commitment
    const newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);

    // cache vars
    const stateRoot = this.pollStateTree!.root;
    const ballotRoot = this.ballotTree!.root;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const ballotSubrootProof = this.ballotTree?.genSubrootProof(batchStartIndex, batchStartIndex + batchSize);

    const votes = ballots.map((x) => x.votes);

    const circuitInputs = stringifyBigInts({
      stateRoot,
      ballotRoot,
      sbSalt,
      index: BigInt(batchStartIndex),
      numSignUps: BigInt(this.numSignups),
      sbCommitment,
      currentTallyCommitment,
      newTallyCommitment,
      ballots: ballots.map((x) => x.asCircuitInputs()),
      ballotPathElements: ballotSubrootProof!.pathElements,
      votes,
      currentResults,
      currentResultsRootSalt,
      currentSpentVoiceCreditSubtotal,
      currentSpentVoiceCreditSubtotalSalt,
      currentPerVOSpentVoiceCredits,
      currentPerVOSpentVoiceCreditsRootSalt,
      newResultsRootSalt,
      newPerVOSpentVoiceCreditsRootSalt,
      newSpentVoiceCreditSubtotalSalt,
    }) as unknown as ITallyCircuitInputs;

    this.numBatchesTallied += 1;

    return circuitInputs;
  };

  tallyVotesNonQv = (): ITallyCircuitInputs => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.sbSalts[this.currentMessageBatchIndex] === undefined) {
      throw new Error("You must process the messages first");
    }

    const batchSize = this.batchSizes.tallyBatchSize;

    assert(this.hasUntalliedBallots(), "No more ballots to tally");

    // calculate where we start tallying next
    const batchStartIndex = this.numBatchesTallied * batchSize;

    // get the salts needed for the commitments
    const currentResultsRootSalt = batchStartIndex === 0 ? 0n : this.resultRootSalts[batchStartIndex - batchSize];

    const currentSpentVoiceCreditSubtotalSalt =
      batchStartIndex === 0 ? 0n : this.spentVoiceCreditSubtotalSalts[batchStartIndex - batchSize];

    // generate a commitment to the current results
    const currentResultsCommitment = genTreeCommitment(
      this.tallyResult,
      currentResultsRootSalt,
      this.treeDepths.voteOptionTreeDepth,
    );

    // generate a commitment to the current spent voice credits
    const currentSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      currentSpentVoiceCreditSubtotalSalt,
      batchStartIndex,
      false,
    );

    // the current commitment for the first batch will be 0
    // otherwise calculate as
    // hash([
    //  currentResultsCommitment,
    //  currentSpentVoiceCreditsCommitment,
    // ])
    const currentTallyCommitment =
      batchStartIndex === 0 ? 0n : hashLeftRight(currentResultsCommitment, currentSpentVoiceCreditsCommitment);

    const ballots: Ballot[] = [];
    const currentResults = this.tallyResult.map((x) => BigInt(x.toString()));
    const currentSpentVoiceCreditSubtotal = BigInt(this.totalSpentVoiceCredits.toString());

    // loop in normal order to tally the ballots one by one
    for (let i = this.numBatchesTallied * batchSize; i < this.numBatchesTallied * batchSize + batchSize; i += 1) {
      // we stop if we have no more ballots to tally
      if (i >= this.ballots.length) {
        break;
      }

      // save to the local ballot array
      ballots.push(this.ballots[i]);

      // for each possible vote option we loop and calculate
      for (let j = 0; j < this.maxVoteOptions; j += 1) {
        const v = this.ballots[i].votes[j];

        this.tallyResult[j] += v;

        // the total spent voice credits will be the sum of the votes
        this.totalSpentVoiceCredits += v;
      }
    }

    const emptyBallot = new Ballot(this.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);

    // pad the ballots array
    while (ballots.length < batchSize) {
      ballots.push(emptyBallot);
    }

    // generate the new salts
    const newResultsRootSalt = genRandomSalt();
    const newSpentVoiceCreditSubtotalSalt = genRandomSalt();

    // and save them to be used in the next batch
    this.resultRootSalts[batchStartIndex] = newResultsRootSalt;
    this.spentVoiceCreditSubtotalSalts[batchStartIndex] = newSpentVoiceCreditSubtotalSalt;

    // generate the new results commitment with the new salts and data
    const newResultsCommitment = genTreeCommitment(
      this.tallyResult,
      newResultsRootSalt,
      this.treeDepths.voteOptionTreeDepth,
    );

    // generate the new spent voice credits commitment with the new salts and data
    const newSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      newSpentVoiceCreditSubtotalSalt,
      batchStartIndex + batchSize,
      false,
    );

    // generate the new tally commitment
    const newTallyCommitment = hashLeftRight(newResultsCommitment, newSpentVoiceCreditsCommitment);

    // cache vars
    const stateRoot = this.pollStateTree!.root;
    const ballotRoot = this.ballotTree!.root;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const ballotSubrootProof = this.ballotTree?.genSubrootProof(batchStartIndex, batchStartIndex + batchSize);

    const votes = ballots.map((x) => x.votes);

    const circuitInputs = stringifyBigInts({
      stateRoot,
      ballotRoot,
      sbSalt,
      index: BigInt(batchStartIndex),
      numSignUps: BigInt(this.numSignups),
      sbCommitment,
      currentTallyCommitment,
      newTallyCommitment,
      ballots: ballots.map((x) => x.asCircuitInputs()),
      ballotPathElements: ballotSubrootProof!.pathElements,
      votes,
      currentResults,
      currentResultsRootSalt,
      currentSpentVoiceCreditSubtotal,
      currentSpentVoiceCreditSubtotalSalt,
      newResultsRootSalt,
      newSpentVoiceCreditSubtotalSalt,
    }) as unknown as ITallyCircuitInputs;

    this.numBatchesTallied += 1;

    return circuitInputs;
  };

  /**
   * This method generates a commitment to the total spent voice credits.
   *
   * This is the hash of the total spent voice credits and a salt, computed as Poseidon([totalCredits, _salt]).
   * @param salt - The salt used in the hash function.
   * @param numBallotsToCount - The number of ballots to count for the calculation.
   * @param useQuadraticVoting - Whether to use quadratic voting or not. Default is true.
   * @returns Returns the hash of the total spent voice credits and a salt, computed as Poseidon([totalCredits, _salt]).
   */
  private genSpentVoiceCreditSubtotalCommitment = (
    salt: bigint,
    numBallotsToCount: number,
    useQuadraticVoting = true,
  ): bigint => {
    let subtotal = 0n;
    for (let i = 0; i < numBallotsToCount; i += 1) {
      if (this.ballots.length <= i) {
        break;
      }

      for (let j = 0; j < this.tallyResult.length; j += 1) {
        const v = BigInt(`${this.ballots[i].votes[j]}`);
        subtotal += useQuadraticVoting ? v * v : v;
      }
    }
    return hashLeftRight(subtotal, salt);
  };

  /**
   * This method generates a commitment to the spent voice credits per vote option.
   *
   * This is the hash of the Merkle root of the spent voice credits per vote option and a salt, computed as Poseidon([root, _salt]).
   * @param salt - The salt used in the hash function.
   * @param numBallotsToCount - The number of ballots to count for the calculation.
   * @param useQuadraticVoting - Whether to use quadratic voting or not. Default is true.
   * @returns Returns the hash of the Merkle root of the spent voice credits per vote option and a salt, computed as Poseidon([root, _salt]).
   */
  private genPerVOSpentVoiceCreditsCommitment = (
    salt: bigint,
    numBallotsToCount: number,
    useQuadraticVoting = true,
  ): bigint => {
    const leaves: bigint[] = Array<bigint>(this.tallyResult.length).fill(0n);

    for (let i = 0; i < numBallotsToCount; i += 1) {
      // check that is a valid index
      if (i >= this.ballots.length) {
        break;
      }

      for (let j = 0; j < this.tallyResult.length; j += 1) {
        const v = this.ballots[i].votes[j];
        leaves[j] += useQuadraticVoting ? v * v : v;
      }
    }

    return genTreeCommitment(leaves, salt, this.treeDepths.voteOptionTreeDepth);
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
        stateTreeDepth: Number(this.treeDepths.stateTreeDepth),
      },
      {
        tallyBatchSize: Number(this.batchSizes.tallyBatchSize.toString()),
        messageBatchSize: Number(this.batchSizes.messageBatchSize.toString()),
      },
      this.maciStateRef,
      this.voteOptions,
      this.mode,
    );

    copied.pubKeys = this.pubKeys.map((x) => x.copy());
    copied.pollStateLeaves = this.pollStateLeaves.map((x) => x.copy());
    copied.messages = this.messages.map((x) => x.copy());
    copied.commands = this.commands.map((x) => x.copy());
    copied.ballots = this.ballots.map((x) => x.copy());
    copied.encryptionPublicKeys = this.encryptionPublicKeys.map((x) => x.copy());

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
      this.encryptionPublicKeys.length === p.encryptionPublicKeys.length &&
      this.numSignups === p.numSignups;

    if (!result) {
      return false;
    }

    for (let i = 0; i < this.messages.length; i += 1) {
      if (!this.messages[i].equals(p.messages[i])) {
        return false;
      }
    }
    for (let i = 0; i < this.encryptionPublicKeys.length; i += 1) {
      if (!this.encryptionPublicKeys[i].equals(p.encryptionPublicKeys[i])) {
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
      stateTreeDepth: Number(this.treeDepths.stateTreeDepth),
      pollEndTimestamp: this.pollEndTimestamp.toString(),
      treeDepths: this.treeDepths,
      batchSizes: this.batchSizes,
      maxVoteOptions: this.maxVoteOptions,
      voteOptions: this.voteOptions.toString(),
      messages: this.messages.map((message) => message.toJSON()),
      commands: this.commands.map((command) => command.toJSON()),
      ballots: this.ballots.map((ballot) => ballot.toJSON()),
      encryptionPublicKeys: this.encryptionPublicKeys.map((encryptionPublicKey) => encryptionPublicKey.serialize()),
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
      json.mode as VotingMode,
    );

    // set all properties
    poll.pollStateLeaves = json.pollStateLeaves.map((leaf) => StateLeaf.fromJSON(leaf));
    poll.ballots = json.ballots.map((ballot) => Ballot.fromJSON(ballot));
    poll.encryptionPublicKeys = json.encryptionPublicKeys.map((key: string) => PublicKey.deserialize(key));
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
    this.coordinatorKeypair = new Keypair(PrivateKey.deserialize(serializedPrivateKey));
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
