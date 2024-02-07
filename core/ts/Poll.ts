import {
  IncrementalQuinTree,
  genRandomSalt,
  SNARK_FIELD_SIZE,
  NOTHING_UP_MY_SLEEVE,
  hashLeftRight,
  hash3,
  hash5,
  sha256Hash,
  stringifyBigInts,
  genTreeCommitment,
} from "maci-crypto";
import {
  PCommand,
  TCommand,
  Keypair,
  Ballot,
  PubKey,
  PrivKey,
  Message,
  blankStateLeaf,
  type ICommand,
  type StateLeaf,
  type IMessageContractParams,
  type IJsonCommand,
  type IJsonPCommand,
  type IJsonTCommand,
  blankStateLeafHash,
} from "maci-domainobjs";

import assert from "assert";

import type { MaciState } from "./MaciState";
import type {
  CircuitInputs,
  TreeDepths,
  MaxValues,
  BatchSizes,
  IPoll,
  IJsonPoll,
  IProcessMessagesOutput,
  ITallyCircuitInputs,
  ISubsidyCircuitInputs,
  IProcessMessagesCircuitInputs,
} from "./utils/types";
import type { PathElements } from "maci-crypto";

import { STATE_TREE_ARITY, MESSAGE_TREE_ARITY } from "./utils/constants";
import { ProcessMessageErrors, ProcessMessageError } from "./utils/errors";
import { packTallyVotesSmallVals, packSubsidySmallVals } from "./utils/utils";

/**
 * A representation of the Poll contract.
 */
export class Poll implements IPoll {
  // Note that we only store the PubKey on-chain while this class stores the
  // Keypair for the sake of convenience
  coordinatorKeypair: Keypair;

  treeDepths: TreeDepths;

  batchSizes: BatchSizes;

  maxValues: MaxValues;

  // the depth of the state tree
  stateTreeDepth: number;

  pollEndTimestamp: bigint;

  ballots: Ballot[] = [];

  ballotTree?: IncrementalQuinTree;

  messages: Message[] = [];

  messageTree: IncrementalQuinTree;

  commands: ICommand[] = [];

  encPubKeys: PubKey[] = [];

  stateCopied = false;

  stateLeaves: StateLeaf[] = [blankStateLeaf];

  stateTree?: IncrementalQuinTree;

  // For message processing
  numBatchesProcessed = 0;

  currentMessageBatchIndex?: number;

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

  // For coefficient and subsidy calculation
  subsidy: bigint[] = []; // size: M, M is number of vote options

  subsidySalts: Record<number | string, bigint> = {};

  rbi = 0; // row batch index

  cbi = 0; // column batch index

  MM = 50; // adjustable parameter

  WW = 4; // number of digits for float representation

  // an empty ballot and its hash to be used as zero value in the
  // ballot tree
  emptyBallot: Ballot;

  emptyBallotHash?: bigint;

  // how many users signed up
  private numSignups = 0n;

  /**
   * Constructs a new Poll object.
   * @param pollEndTimestamp - The Unix timestamp at which the poll ends.
   * @param coordinatorKeypair - The keypair of the coordinator.
   * @param treeDepths - The depths of the trees used in the poll.
   * @param batchSizes - The sizes of the batches used in the poll.
   * @param maxValues - The maximum values the MACI circuits can accept.
   * @param maciStateRef - The reference to the MACI state.
   */
  constructor(
    pollEndTimestamp: bigint,
    coordinatorKeypair: Keypair,
    treeDepths: TreeDepths,
    batchSizes: BatchSizes,
    maxValues: MaxValues,
    maciStateRef: MaciState,
  ) {
    this.pollEndTimestamp = pollEndTimestamp;
    this.coordinatorKeypair = coordinatorKeypair;
    this.treeDepths = treeDepths;
    this.batchSizes = batchSizes;
    this.maxValues = maxValues;
    this.maciStateRef = maciStateRef;
    this.pollId = BigInt(maciStateRef.polls.size);
    this.stateTreeDepth = maciStateRef.stateTreeDepth;

    this.messageTree = new IncrementalQuinTree(
      this.treeDepths.messageTreeDepth,
      NOTHING_UP_MY_SLEEVE,
      MESSAGE_TREE_ARITY,
      hash5,
    );

    this.tallyResult = new Array(this.maxValues.maxVoteOptions).fill(0n) as bigint[];
    this.perVOSpentVoiceCredits = new Array(this.maxValues.maxVoteOptions).fill(0n) as bigint[];
    this.subsidy = new Array(this.maxValues.maxVoteOptions).fill(0n) as bigint[];

    // we put a blank state leaf to prevent a DoS attack
    this.emptyBallot = Ballot.genBlankBallot(this.maxValues.maxVoteOptions, treeDepths.voteOptionTreeDepth);
    this.ballots.push(this.emptyBallot);
  }

  /**
   * Update a Poll with data from MaciState.
   * This is the step where we copy the state from the MaciState instance,
   * and set the number of signups we have so far.
   */
  updatePoll = (numSignups: bigint): void => {
    // there might be occasions where we fetch logs after new signups have been made
    // logs are fetched (and MaciState/Poll created locally) after stateAq have been
    // merged in. If someone signs up after that and we fetch that record
    // then we won't be able to verify the processing on chain as the data will
    // not match. For this, we must only copy up to the number of signups

    // Copy the state tree, ballot tree, state leaves, and ballot leaves

    // start by setting the number of signups
    this.setNumSignups(numSignups);
    // copy up to numSignups state leaves
    this.stateLeaves = this.maciStateRef.stateLeaves.slice(0, Number(this.numSignups)).map((x) => x.copy());

    // create a new state tree
    this.stateTree = new IncrementalQuinTree(this.stateTreeDepth, blankStateLeafHash, STATE_TREE_ARITY, hash5);
    // add all leaves
    this.stateLeaves.forEach((stateLeaf) => {
      this.stateTree?.insert(stateLeaf.hash());
    });

    // Create as many ballots as state leaves
    this.emptyBallotHash = this.emptyBallot.hash();
    this.ballotTree = new IncrementalQuinTree(this.stateTreeDepth, this.emptyBallotHash, STATE_TREE_ARITY, hash5);
    this.ballotTree.insert(this.emptyBallot.hash());

    // we fill the ballotTree with empty ballots hashes to match the number of signups in the tree
    while (this.ballots.length < this.stateLeaves.length) {
      this.ballotTree.insert(this.emptyBallotHash);
      this.ballots.push(this.emptyBallot);
    }

    this.stateCopied = true;
  };

  /**
   * Process one message.
   * @param message - The message to process.
   * @param encPubKey - The public key associated with the encryption private key.
   * @returns A number of variables which will be used in the zk-SNARK circuit.
   */
  processMessage = (message: Message, encPubKey: PubKey, qv = true): IProcessMessagesOutput => {
    try {
      // Decrypt the message
      const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey);

      const { command, signature } = PCommand.decrypt(message, sharedKey);

      const stateLeafIndex = command.stateIndex;

      // If the state tree index in the command is invalid, do nothing
      if (
        stateLeafIndex >= BigInt(this.ballots.length) ||
        stateLeafIndex < 1n ||
        stateLeafIndex >= BigInt(this.stateTree?.nextIndex || -1)
      ) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidStateLeafIndex);
      }

      // The user to update (or not)
      const stateLeaf = this.stateLeaves[Number(stateLeafIndex)];

      // The ballot to update (or not)
      const ballot = this.ballots[Number(stateLeafIndex)];

      // If the signature is invalid, do nothing
      if (!command.verifySignature(signature, stateLeaf.pubKey)) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidSignature);
      }

      // If the nonce is invalid, do nothing
      if (command.nonce !== ballot.nonce + 1n) {
        throw new ProcessMessageError(ProcessMessageErrors.InvalidNonce);
      }

      // If the vote option index is invalid, do nothing
      if (command.voteOptionIndex < 0n || command.voteOptionIndex >= BigInt(this.maxValues.maxVoteOptions)) {
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
      const voiceCreditsLeft = qv
        ? stateLeaf.voiceCreditBalance +
          originalVoteWeight * originalVoteWeight -
          command.newVoteWeight * command.newVoteWeight
        : stateLeaf.voiceCreditBalance + originalVoteWeight - command.newVoteWeight;

      // If the remaining voice credits is insufficient, do nothing
      if (voiceCreditsLeft < 0n) {
        throw new ProcessMessageError(ProcessMessageErrors.InsufficientVoiceCredits);
      }

      // Deep-copy the state leaf and update its attributes
      const newStateLeaf = stateLeaf.copy();
      newStateLeaf.voiceCreditBalance = voiceCreditsLeft;
      // if the key changes, this is effectively a key-change message too
      newStateLeaf.pubKey = command.newPubKey.copy();

      // Deep-copy the ballot and update its attributes
      const newBallot = ballot.copy();
      // increase the nonce
      newBallot.nonce += 1n;
      // we change the vote for this exact vote option
      newBallot.votes[voteOptionIndex] = command.newVoteWeight;

      // calculate the path elements for the state tree given the original state tree (before any changes)
      // changes could effectively be made by this new vote - either a key change or vote change
      // would result in a different state leaf
      const originalStateLeafPathElements = this.stateTree?.genProof(Number(stateLeafIndex)).pathElements;
      // calculate the path elements for the ballot tree given the original ballot tree (before any changes)
      // changes could effectively be made by this new ballot
      const originalBallotPathElements = this.ballotTree?.genProof(Number(stateLeafIndex)).pathElements;

      // create a new quinary tree where we insert the votes of the origin (up until this message is processed) ballot
      const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, STATE_TREE_ARITY, hash5);
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
   * Top up the voice credit balance of a user.
   * @param message - The message to top up the voice credit balance
   */
  topupMessage = (message: Message): void => {
    assert(message.msgType === 2n, "A Topup message must have msgType 2");

    message.data.forEach((d) => {
      assert(d < SNARK_FIELD_SIZE, "The message data is not in the correct range");
    });

    const padKey = new PubKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);

    // save the message
    this.messages.push(message);
    // save the pad key
    this.encPubKeys.push(padKey);
    // insert the message into the message tree
    this.messageTree.insert(message.hash(padKey));

    // we create a topup command and save it
    const command = new TCommand(message.data[0], message.data[1], BigInt(this.pollId));
    this.commands.push(command as ICommand);
  };

  /**
   * Inserts a Message and the corresponding public key used to generate the
   * ECDH shared key which was used to encrypt said message.
   * @param message - The message to insert
   * @param encPubKey - The public key used to encrypt the message
   */
  publishMessage = (message: Message, encPubKey: PubKey): void => {
    assert(message.msgType === 1n, "A vote or key change message must have msgType 1");
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
    this.messageTree.insert(message.hash(encPubKey));

    // Decrypt the message and store the Command
    // step 1. we generate the shared key
    const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey);
    try {
      // step 2. we decrypt it
      const { command } = PCommand.decrypt(message, sharedKey);
      // step 3. we store it in the commands array
      this.commands.push(command as ICommand);
    } catch (e) {
      // if there is an error we store an empty command
      const keyPair = new Keypair();
      const command = new PCommand(0n, keyPair.pubKey, 0n, 0n, 0n, 0n, 0n);
      this.commands.push(command as ICommand);
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
      // The starting index of the batch of messages to process.
      // Note that we process messages in reverse order.
      // e.g if there are 8 messages and the batch size is 5, then
      // the starting index should be 5.
      assert(
        this.currentMessageBatchIndex === undefined,
        "The current message batch index should not be defined if this is the first batch",
      );
      // Prevent other polls from being processed until this poll has
      // been fully processed
      this.maciStateRef.pollBeingProcessed = true;
      this.maciStateRef.currentPollBeingProcessed = pollId;
    }

    // Only allow one poll to be processed at a time
    if (this.maciStateRef.pollBeingProcessed) {
      assert(this.maciStateRef.currentPollBeingProcessed === pollId, "Another poll is currently being processed");
    }

    if (this.numBatchesProcessed === 0) {
      const r = this.messages.length % batchSize;

      this.currentMessageBatchIndex = this.messages.length;

      // if there are messages
      if (this.currentMessageBatchIndex > 0) {
        if (r === 0) {
          this.currentMessageBatchIndex -= batchSize;
        } else {
          this.currentMessageBatchIndex -= r;
        }
      }

      this.sbSalts[this.currentMessageBatchIndex] = 0n;
    }

    // The starting index must be valid
    assert(this.currentMessageBatchIndex! >= 0, "The starting index must be >= 0");
    assert(this.currentMessageBatchIndex! % batchSize === 0, "The starting index must be a multiple of the batch size");

    // ensure we copy the state from MACI when we start processing the
    // first batch
    if (!this.stateCopied) {
      throw new Error("You must update the poll with the correct data first");
    }

    // Generate circuit inputs
    const circuitInputs = stringifyBigInts(
      this.genProcessMessagesCircuitInputsPartial(this.currentMessageBatchIndex!),
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
      const idx = this.currentMessageBatchIndex! + batchSize - i - 1;
      assert(idx >= 0, "The message index must be >= 0");
      let message: Message;
      let encPubKey: PubKey;
      if (idx < this.messages.length) {
        message = this.messages[idx];
        encPubKey = this.encPubKeys[idx];

        // based on the message type we have to process it differently
        switch (message.msgType) {
          case 1n:
            try {
              // check if the command is valid
              const r = this.processMessage(message, encPubKey, qv);
              const index = r.stateLeafIndex!;

              // we add at position 0 the original data
              currentStateLeaves.unshift(r.originalStateLeaf!);
              currentBallots.unshift(r.originalBallot!);
              currentVoteWeights.unshift(r.originalVoteWeight!);
              currentVoteWeightsPathElements.unshift(r.originalVoteWeightsPathElements!);
              currentStateLeavesPathElements.unshift(r.originalStateLeafPathElements!);
              currentBallotsPathElements.unshift(r.originalBallotPathElements!);

              // update the state leaves with the new state leaf (result of processing the message)
              this.stateLeaves[index] = r.newStateLeaf!.copy();

              // we also update the state tree with the hash of the new state leaf
              this.stateTree?.update(index, r.newStateLeaf!.hash());

              // store the new ballot
              this.ballots[index] = r.newBallot!;
              // update the ballot tree
              this.ballotTree?.update(index, r.newBallot!.hash());
            } catch (e) {
              // if the error is not a ProcessMessageError we throw it and exit here
              // otherwise we continue processing but add the default blank data instead of
              // this invalid message
              if (e instanceof ProcessMessageError) {
                // if logging is enabled, print the error
                if (!quiet) {
                  // eslint-disable-next-line no-console
                  console.log(`Error at message index ${idx} - ${e.message}`);
                }

                // Since the command is invalid, use a blank state leaf
                currentStateLeaves.unshift(this.stateLeaves[0].copy());
                currentStateLeavesPathElements.unshift(this.stateTree!.genProof(0).pathElements);
                // since the command is invalid we use the blank ballot
                currentBallots.unshift(this.ballots[0].copy());
                currentBallotsPathElements.unshift(this.ballotTree!.genProof(0).pathElements);

                // Since the command is invalid, we use a zero vote weight
                currentVoteWeights.unshift(this.ballots[0].votes[0]);

                // create a new quinary tree and add an empty vote
                const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, STATE_TREE_ARITY, hash5);
                vt.insert(this.ballots[0].votes[0]);
                // get the path elements for this empty vote weight leaf
                currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
              } else {
                throw e;
              }
            }
            break;
          case 2n:
            try {
              // --------------------------------------
              // generate topup circuit inputs
              const stateIndex = Number(message.data[0] >= BigInt(this.ballots.length) ? 0n : message.data[0]);
              const amount = message.data[0] >= BigInt(this.ballots.length) ? 0n : message.data[1];

              currentStateLeaves.unshift(this.stateLeaves[stateIndex].copy());
              currentStateLeavesPathElements.unshift(this.stateTree!.genProof(stateIndex).pathElements);

              // create a copy of the state leaf
              const newStateLeaf = this.stateLeaves[stateIndex].copy();
              // update the voice credit balance
              newStateLeaf.voiceCreditBalance += amount;
              // save it
              this.stateLeaves[stateIndex] = newStateLeaf;
              // update the state tree
              this.stateTree?.update(stateIndex, newStateLeaf.hash());

              // we still need them as placeholder for vote command
              const currentBallot = this.ballots[stateIndex].copy();
              currentBallots.unshift(currentBallot);
              currentBallotsPathElements.unshift(this.ballotTree!.genProof(Number(stateIndex)).pathElements);
              currentVoteWeights.unshift(currentBallot.votes[0]);

              // create a quinary tree to fill with the votes of the current ballot
              const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, STATE_TREE_ARITY, hash5);

              for (let j = 0; j < this.ballots[0].votes.length; j += 1) {
                vt.insert(currentBallot.votes[j]);
              }

              // add to the first position the path elements of the vote weight tree
              currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
            } catch (e) {
              if (!quiet) {
                // eslint-disable-next-line no-console
                console.log("Error processing topup message: ", (e as Error).message);
              }
              throw e;
            }
            break;
          default:
            break;
        }
      } else {
        // Since we don't have a command at that position, use a blank state leaf
        currentStateLeaves.unshift(this.stateLeaves[0].copy());
        currentStateLeavesPathElements.unshift(this.stateTree!.genProof(0).pathElements);
        // since the command is invliad we use the blank ballot
        currentBallots.unshift(this.ballots[0].copy());
        currentBallotsPathElements.unshift(this.ballotTree!.genProof(0).pathElements);

        // Since the command is invalid, we use a zero vote weight
        currentVoteWeights.unshift(this.ballots[0].votes[0]);

        // create a new quinary tree and add an empty vote
        const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, 0n, STATE_TREE_ARITY, hash5);
        vt.insert(this.ballots[0].votes[0]);

        // get the path elements for this empty vote weight leaf
        currentVoteWeightsPathElements.unshift(vt.genProof(0).pathElements);
      }
    }

    // store the data in the circuit inputs object
    circuitInputs.currentStateLeaves = currentStateLeaves.map((x) => x.asCircuitInputs());
    circuitInputs.currentStateLeavesPathElements = currentStateLeavesPathElements;
    circuitInputs.currentBallots = currentBallots.map((x) => x.asCircuitInputs());
    circuitInputs.currentBallotsPathElements = currentBallotsPathElements;
    circuitInputs.currentVoteWeights = currentVoteWeights;
    circuitInputs.currentVoteWeightsPathElements = currentVoteWeightsPathElements;

    // record that we processed one batch
    this.numBatchesProcessed += 1;

    if (this.currentMessageBatchIndex! > 0) {
      this.currentMessageBatchIndex! -= batchSize;
    }

    // ensure newSbSalt differs from currentSbSalt
    let newSbSalt = genRandomSalt();
    while (this.sbSalts[this.currentMessageBatchIndex!] === newSbSalt) {
      newSbSalt = genRandomSalt();
    }
    this.sbSalts[this.currentMessageBatchIndex!] = newSbSalt;

    // store the salt in the circuit inputs
    circuitInputs.newSbSalt = newSbSalt;
    const newStateRoot = this.stateTree!.root;
    const newBallotRoot = this.ballotTree!.root;
    // create a commitment to the state and ballot tree roots
    // this will be the hash of the roots with a salt
    circuitInputs.newSbCommitment = hash3([newStateRoot, newBallotRoot, newSbSalt]);

    // here is important that a user validates it matches the one in the
    // smart contract
    const coordPubKeyHash = this.coordinatorKeypair.pubKey.hash();
    // create the input hash which is the only public input to the
    // process messages circuit
    circuitInputs.inputHash = sha256Hash([
      circuitInputs.packedVals as bigint,
      coordPubKeyHash,
      circuitInputs.msgRoot as bigint,
      circuitInputs.currentSbCommitment as bigint,
      circuitInputs.newSbCommitment,
      this.pollEndTimestamp,
    ]);

    // If this is the last batch, release the lock
    if (this.numBatchesProcessed * batchSize >= this.messages.length) {
      this.maciStateRef.pollBeingProcessed = false;
    }

    return stringifyBigInts(circuitInputs) as unknown as IProcessMessagesCircuitInputs;
  };

  /**
   * Generates partial circuit inputs for processing a batch of messages
   * @param index - The index of the partial batch.
   * @returns stringified partial circuit inputs
   */
  private genProcessMessagesCircuitInputsPartial = (index: number): CircuitInputs => {
    const { messageBatchSize } = this.batchSizes;

    assert(index <= this.messages.length, "The index must be <= the number of messages");
    assert(index % messageBatchSize === 0, "The index must be a multiple of the message batch size");

    // fill the msgs array with a copy of the messages we have
    // plus empty messages to fill the batch
    let msgs = this.messages.map((x) => x.asCircuitInputs());
    while (msgs.length % messageBatchSize > 0) {
      msgs.push(msgs[msgs.length - 1]);
    }
    // we only take the messages we need for this batch
    msgs = msgs.slice(index, index + messageBatchSize);

    while (this.messageTree.nextIndex < index + messageBatchSize) {
      this.messageTree.insert(this.messageTree.zeroValue);
    }

    // generate the path to the subroot of the message tree for this batch
    const messageSubrootPath = this.messageTree.genSubrootProof(index, index + messageBatchSize);

    assert(this.messageTree.verifyProof(messageSubrootPath), "The message subroot path is invalid");

    // validate that the batch index is correct, if not fix it
    // this means that the end will be the last message
    let batchEndIndex = index + messageBatchSize;
    if (batchEndIndex > this.messages.length) {
      batchEndIndex = this.messages.length;
    }

    // copy the public keys, pad the array with the last keys if needed
    let encPubKeys = this.encPubKeys.map((x) => x.copy());
    while (encPubKeys.length % messageBatchSize > 0) {
      encPubKeys.push(encPubKeys[encPubKeys.length - 1]);
    }
    // then take the ones part of this batch
    encPubKeys = encPubKeys.slice(index, index + messageBatchSize);

    const msgRoot = this.messageTree.root;
    const currentStateRoot = this.stateTree!.root;
    const currentBallotRoot = this.ballotTree!.root;
    // calculate the current state and ballot root
    // commitment which is the hash of the state tree
    // root, the ballot tree root and a salt
    const currentSbCommitment = hash3([
      currentStateRoot,
      currentBallotRoot,
      this.sbSalts[this.currentMessageBatchIndex!],
    ]);

    // Generate a SHA256 hash of inputs which the contract provides
    /* eslint-disable no-bitwise */
    const packedVals =
      BigInt(this.maxValues.maxVoteOptions) +
      (BigInt(this.numSignups) << 50n) +
      (BigInt(index) << 100n) +
      (BigInt(batchEndIndex) << 150n);
    /* eslint-enable no-bitwise */

    return stringifyBigInts({
      pollEndTimestamp: this.pollEndTimestamp,
      packedVals,
      msgRoot,
      msgs,
      msgSubrootPathElements: messageSubrootPath.pathElements,
      coordPrivKey: this.coordinatorKeypair.privKey.asCircuitInputs(),
      coordPubKey: this.coordinatorKeypair.pubKey.asCircuitInputs(),
      encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
      currentStateRoot,
      currentBallotRoot,
      currentSbCommitment,
      currentSbSalt: this.sbSalts[this.currentMessageBatchIndex!],
    }) as CircuitInputs;
  };

  /**
   * Process all messages. This function does not update the ballots or state
   * leaves; rather, it copies and then updates them. This makes it possible
   * to test the result of multiple processMessage() invocations.
   * @returns The state leaves and ballots of the poll
   */
  processAllMessages = (): { stateLeaves: StateLeaf[]; ballots: Ballot[] } => {
    const stateLeaves = this.stateLeaves.map((x) => x.copy());
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
   * This method checks if there are any unfinished subsidy calculations.
   * @returns Returns true if the product of the row batch index (rbi) and batch size or
   * the product of column batch index (cbi) and batch size is less than the length
   * of the ballots array, indicating that there are still ballots left to be processed.
   * Otherwise, it returns false.
   */
  hasUnfinishedSubsidyCalculation = (): boolean => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    return this.rbi * batchSize < this.ballots.length && this.cbi * batchSize < this.ballots.length;
  };

  /**
   * This method calculates the subsidy per batch.
   * @returns Returns an array of big integers which represent the circuit inputs for the subsidy calculation.
   */
  subsidyPerBatch = (): ISubsidyCircuitInputs => {
    const batchSize = this.batchSizes.subsidyBatchSize;

    assert(this.hasUnfinishedSubsidyCalculation(), "No more subsidy batches to calculate");

    const stateRoot = this.stateTree!.root;
    const ballotRoot = this.ballotTree!.root;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex!];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const currentSubsidy = this.subsidy.map((x) => BigInt(x.toString()));
    let currentSubsidyCommitment = 0n;
    let currentSubsidySalt = 0n;
    let saltIndex = this.previousSubsidyIndexToString();

    if (this.rbi !== 0 || this.cbi !== 0) {
      currentSubsidySalt = BigInt(this.subsidySalts[saltIndex]);
      currentSubsidyCommitment = BigInt(
        genTreeCommitment(this.subsidy, currentSubsidySalt, this.treeDepths.voteOptionTreeDepth).valueOf(),
      );
    }

    const rowStartIndex = this.rbi * batchSize;
    const colStartIndex = this.cbi * batchSize;
    const [ballots1, ballots2] = this.subsidyCalculation(rowStartIndex, colStartIndex);

    const ballotSubrootProof1 = this.ballotTree?.genSubrootProof(rowStartIndex, rowStartIndex + batchSize);
    const ballotSubrootProof2 = this.ballotTree?.genSubrootProof(colStartIndex, colStartIndex + batchSize);

    const newSubsidySalt = genRandomSalt();
    saltIndex = `${this.rbi.toString()}-${this.cbi.toString()}`;
    this.subsidySalts[saltIndex] = newSubsidySalt;
    const newSubsidyCommitment = genTreeCommitment(this.subsidy, newSubsidySalt, this.treeDepths.voteOptionTreeDepth);

    const packedVals = packSubsidySmallVals(this.rbi, this.cbi, Number(this.numSignups));

    const inputHash = sha256Hash([packedVals, sbCommitment, currentSubsidyCommitment, newSubsidyCommitment]);

    const circuitInputs = stringifyBigInts({
      stateRoot,
      ballotRoot,
      sbSalt,
      currentSubsidySalt,
      newSubsidySalt,
      sbCommitment,
      currentSubsidyCommitment,
      newSubsidyCommitment,
      currentSubsidy,
      packedVals,
      inputHash,
      ballots1: ballots1.map((x) => x.asCircuitInputs()),
      ballots2: ballots2.map((x) => x.asCircuitInputs()),
      votes1: ballots1.map((x) => x.votes),
      votes2: ballots2.map((x) => x.votes),
      ballotPathElements1: ballotSubrootProof1!.pathElements,
      ballotPathElements2: ballotSubrootProof2!.pathElements,
    }) as unknown as ISubsidyCircuitInputs;

    this.increaseSubsidyIndex();
    return circuitInputs;
  };

  /**
   * It increases the index for the subsidy calculation.
   */
  private increaseSubsidyIndex = (): void => {
    const batchSize = this.batchSizes.subsidyBatchSize;

    if (this.cbi * batchSize + batchSize < this.ballots.length) {
      this.cbi += 1;
    } else {
      this.rbi += 1;
      this.cbi = this.rbi;
    }
  };

  /**
   * This method converts the previous subsidy index to a string.
   * @returns Returns a string representation of the previous subsidy index.
   * The string is in the format "rbi-cbi", where rbi and cbi are
   * the previous row batch index and column batch index respectively.
   */
  private previousSubsidyIndexToString = (): string => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    const numBatches = Math.ceil(this.ballots.length / batchSize);

    let { cbi } = this;
    let { rbi } = this;

    if (this.cbi === 0 && this.rbi === 0) {
      return "0-0";
    }

    if (this.cbi > this.rbi) {
      cbi -= 1;
    } else {
      rbi -= 1;
      cbi = numBatches - 1;
    }

    return `${rbi.toString()}-${cbi.toString()}`;
  };

  /**
   * This method calculates the coefficient for a pair of ballots.
   * @param rowBallot - The ballot in the row.
   * @param colBallot - The ballot in the column.
   *
   * @returns Returns the calculated coefficient.
   */
  private coefficientCalculation = (rowBallot: Ballot, colBallot: Ballot): bigint => {
    let sum = 0n;
    for (let p = 0; p < this.maxValues.maxVoteOptions; p += 1) {
      sum += BigInt(rowBallot.votes[p].valueOf()) * colBallot.votes[p];
    }
    const res = BigInt(this.MM * 10 ** this.WW) / (BigInt(this.MM) + BigInt(sum));
    return res;
  };

  /**
   * This method calculates the subsidy for a batch of ballots.
   * @param rowStartIndex - The starting index for the row ballots.
   * @param colStartIndex - The starting index for the column ballots.
   * @returns Returns a 2D array of ballots. The first array contains the row ballots and the second array contains the column ballots.
   */
  private subsidyCalculation = (rowStartIndex: number, colStartIndex: number): Ballot[][] => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    const ballots1: Ballot[] = [];
    const ballots2: Ballot[] = [];
    const emptyBallot = new Ballot(this.maxValues.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);

    for (let i = 0; i < batchSize; i += 1) {
      const row = rowStartIndex + i;
      const col = colStartIndex + i;
      const rowBallot = row < this.ballots.length ? this.ballots[row] : emptyBallot;
      const colBallot = col < this.ballots.length ? this.ballots[col] : emptyBallot;
      ballots1.push(rowBallot);
      ballots2.push(colBallot);
    }
    for (let i = 0; i < batchSize; i += 1) {
      for (let j = 0; j < batchSize; j += 1) {
        const row = rowStartIndex + i;
        const col = colStartIndex + j;
        const rowBallot = row < this.ballots.length ? this.ballots[row] : emptyBallot;
        const colBallot = col < this.ballots.length ? this.ballots[col] : emptyBallot;

        const kij = this.coefficientCalculation(rowBallot, colBallot);
        for (let p = 0; p < this.maxValues.maxVoteOptions; p += 1) {
          const vip = BigInt(rowBallot.votes[p].valueOf());
          const vjp = BigInt(colBallot.votes[p].valueOf());
          if (rowStartIndex !== colStartIndex || (rowStartIndex === colStartIndex && i < j)) {
            this.subsidy[p] += 2n * kij * vip * vjp;
          }
        }
      }
    }

    return [ballots1, ballots2];
  };

  /**
   * This method tallies a ballots and updates the tally results.
   * @param useQuadraticVoting - Whether to use quadratic voting or not. Default is true.
   * @returns the circuit inputs for the TallyVotes circuit.
   */
  tallyVotes = (useQuadraticVoting = true): ITallyCircuitInputs => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.sbSalts[this.currentMessageBatchIndex!] === undefined) {
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
      useQuadraticVoting,
    );

    // generate a commitment to the current spent voice credits
    const currentSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      currentSpentVoiceCreditSubtotalSalt,
      batchStartIndex,
      useQuadraticVoting,
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
      for (let j = 0; j < this.maxValues.maxVoteOptions; j += 1) {
        const v = this.ballots[i].votes[j];

        // the vote itself will be a quadratic vote (sqrt(voiceCredits))
        this.tallyResult[j] += v;

        // the per vote option spent voice credits will be the sum of the squares of the votes
        this.perVOSpentVoiceCredits[j] += useQuadraticVoting ? v * v : v;

        // the total spent voice credits will be the sum of the squares of the votes
        this.totalSpentVoiceCredits += useQuadraticVoting ? v * v : v;
      }
    }

    const emptyBallot = new Ballot(this.maxValues.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);

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
      useQuadraticVoting,
    );

    // generate the new per VO spent voice credits commitment with the new salts and data
    const newPerVOSpentVoiceCreditsCommitment = this.genPerVOSpentVoiceCreditsCommitment(
      newPerVOSpentVoiceCreditsRootSalt,
      batchStartIndex + batchSize,
      useQuadraticVoting,
    );

    // generate the new tally commitment
    const newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);

    // cache vars
    const stateRoot = this.stateTree!.root;
    const ballotRoot = this.ballotTree!.root;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex!];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const packedVals = packTallyVotesSmallVals(batchStartIndex, batchSize, Number(this.numSignups));
    const inputHash = sha256Hash([packedVals, sbCommitment, currentTallyCommitment, newTallyCommitment]);

    const ballotSubrootProof = this.ballotTree?.genSubrootProof(batchStartIndex, batchStartIndex + batchSize);

    const votes = ballots.map((x) => x.votes);

    const circuitInputs = stringifyBigInts({
      stateRoot,
      ballotRoot,
      sbSalt,
      sbCommitment,
      currentTallyCommitment,
      newTallyCommitment,
      packedVals, // contains numSignUps and batchStartIndex
      inputHash,
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
        messageTreeDepth: Number(this.treeDepths.messageTreeDepth),
        messageTreeSubDepth: Number(this.treeDepths.messageTreeSubDepth),
        voteOptionTreeDepth: Number(this.treeDepths.voteOptionTreeDepth),
      },
      {
        tallyBatchSize: Number(this.batchSizes.tallyBatchSize.toString()),
        subsidyBatchSize: Number(this.batchSizes.subsidyBatchSize.toString()),
        messageBatchSize: Number(this.batchSizes.messageBatchSize.toString()),
      },
      {
        maxMessages: Number(this.maxValues.maxMessages.toString()),
        maxVoteOptions: Number(this.maxValues.maxVoteOptions.toString()),
      },
      this.maciStateRef,
    );

    copied.stateLeaves = this.stateLeaves.map((x) => x.copy());
    copied.messages = this.messages.map((x) => x.copy());
    copied.commands = this.commands.map((x) => x.copy());
    copied.ballots = this.ballots.map((x) => x.copy());
    copied.encPubKeys = this.encPubKeys.map((x) => x.copy());

    if (this.ballotTree) {
      copied.ballotTree = this.ballotTree.copy();
    }

    copied.currentMessageBatchIndex = this.currentMessageBatchIndex;
    copied.maciStateRef = this.maciStateRef;
    copied.messageTree = this.messageTree.copy();
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

    // subsidy related copy
    copied.subsidy = this.subsidy.map((x: bigint) => BigInt(x.toString()));
    copied.rbi = Number(this.rbi.toString());
    copied.cbi = Number(this.cbi.toString());
    copied.MM = Number(this.MM.toString());
    copied.WW = Number(this.WW.toString());

    Object.keys(this.subsidySalts).forEach((k) => {
      copied.subsidySalts[k] = BigInt(this.subsidySalts[k].toString());
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
      this.treeDepths.messageTreeDepth === p.treeDepths.messageTreeDepth &&
      this.treeDepths.messageTreeSubDepth === p.treeDepths.messageTreeSubDepth &&
      this.treeDepths.voteOptionTreeDepth === p.treeDepths.voteOptionTreeDepth &&
      this.batchSizes.tallyBatchSize === p.batchSizes.tallyBatchSize &&
      this.batchSizes.messageBatchSize === p.batchSizes.messageBatchSize &&
      this.maxValues.maxMessages === p.maxValues.maxMessages &&
      this.maxValues.maxVoteOptions === p.maxValues.maxVoteOptions &&
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
      maxValues: this.maxValues,
      messages: this.messages.map((message) => message.toJSON()),
      commands: this.commands.map((command) => command.toJSON() as IJsonCommand),
      ballots: this.ballots.map((ballot) => ballot.toJSON()),
      encPubKeys: this.encPubKeys.map((encPubKey) => encPubKey.serialize()),
      currentMessageBatchIndex: this.currentMessageBatchIndex!,
      stateLeaves: this.stateLeaves.map((leaf) => leaf.toJSON()),
      results: this.tallyResult.map((result) => result.toString()),
      numBatchesProcessed: this.numBatchesProcessed,
      numSignups: this.numSignups.toString(),
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
      json.maxValues,
      maciState,
    );

    // set all properties
    poll.ballots = json.ballots.map((ballot) => Ballot.fromJSON(ballot));
    poll.encPubKeys = json.encPubKeys.map((key: string) => PubKey.deserialize(key));
    poll.messages = json.messages.map((message) => Message.fromJSON(message as IMessageContractParams));
    poll.commands = json.commands.map((command: IJsonCommand) => {
      switch (command.cmdType) {
        case "1": {
          return PCommand.fromJSON(command as IJsonPCommand) as ICommand;
        }

        case "2": {
          return TCommand.fromJSON(command as IJsonTCommand) as ICommand;
        }

        default: {
          return { cmdType: command.cmdType } as unknown as ICommand;
        }
      }
    });
    poll.tallyResult = json.results.map((result: string) => BigInt(result));
    poll.currentMessageBatchIndex = json.currentMessageBatchIndex;
    poll.numBatchesProcessed = json.numBatchesProcessed;

    // fill the trees
    for (let i = 0; i < poll.messages.length; i += 1) {
      const messageLeaf = poll.messages[i].hash(poll.encPubKeys[i]);
      poll.messageTree.insert(messageLeaf);
    }

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
