import assert from "assert";
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
import { PubKey, Command, PCommand, TCommand, Message, Keypair, StateLeaf, Ballot, PrivKey } from "maci-domainobjs";

import { MaciState } from "./MaciState";
import { TreeDepths, MaxValues, BatchSizes, packTallyVotesSmallVals, packSubsidySmallVals } from "./utils/utils";
import { STATE_TREE_ARITY, MESSAGE_TREE_ARITY, VOTE_OPTION_TREE_ARITY } from "./utils/constants";

// todo: organize this in domainobjs
const blankStateLeaf = StateLeaf.genBlankLeaf();
const blankStateLeafHash = blankStateLeaf.hash();

/*
 * File Overview:
 * - IPoll: Interface detailing `Poll`'s public API
 * - Poll: Core class implementing the above interface
 */

interface IPoll {
  topupMessage(_message: Message): void;
  publishMessage(_message: Message, _encPubKey: PubKey): void;
  hasUnprocessedMessages(): boolean;
  processMessages(_pollId: number): any;
  genProcessMessagesCircuitInputsPartial(_index: number): any;
  processAllMessages(): { stateLeaves: StateLeaf[]; ballots: Ballot[] };
  hasUntalliedBallots(): boolean;
  hasUnfinishedSubsidyCalculation(): boolean;
  subsidyPerBatch(): bigint[];
  increaseSubsidyIndex(): void;
  previousSubsidyIndexToString(): string;
  tallyVotes(): any;
  coefficientCalculation(rowBallot: Ballot, colBallot: Ballot): bigint;
  subsidyCalculation(rowStartIndex: number, colStartIndex: number): Ballot[][];
  genResultsCommitment(_salt: bigint): bigint;
  genSpentVoiceCreditSubtotalCommitment(_salt: bigint, _numBallotsToCount: number): bigint;
  genPerVOSpentVoiceCreditsCommitment(_salt: bigint, _numBallotsToCount: number): bigint;
  copy(): Poll;
  equals(p: Poll): boolean;
  toJSON(): any;
  setCoordinatorKeypair(serializedPrivateKey: string): void;
}

// Also see: Polls.sol
class Poll implements IPoll {
  public duration: number;
  // Note that we only store the PubKey on-chain while this class stores the
  // Keypair for the sake of convenience
  public coordinatorKeypair: Keypair;
  public treeDepths: TreeDepths;
  public batchSizes: BatchSizes;
  public maxValues: MaxValues;

  // the depth of the state tree
  public stateTreeDepth: number;

  public numSignUps: number;

  public pollEndTimestamp: bigint;

  public ballots: Ballot[] = [];
  public ballotTree: IncrementalQuinTree;

  public messages: Message[] = [];
  public messageTree: IncrementalQuinTree;
  public commands: Command[] = [];

  public encPubKeys: PubKey[] = [];

  public stateCopied = false;
  public stateLeaves: StateLeaf[] = [blankStateLeaf];
  public stateTree: IncrementalQuinTree;

  // For message processing
  public numBatchesProcessed = 0;
  public currentMessageBatchIndex;
  public maciStateRef: MaciState;
  public pollId: number;

  public sbSalts: { [key: number]: bigint } = {};
  public resultRootSalts: { [key: number]: bigint } = {};
  public preVOSpentVoiceCreditsRootSalts: { [key: number]: bigint } = {};
  public spentVoiceCreditSubtotalSalts: { [key: number]: bigint } = {};

  // For vote tallying
  public results: bigint[] = [];
  public perVOSpentVoiceCredits: bigint[] = [];
  public numBatchesTallied = 0;

  public totalSpentVoiceCredits = BigInt(0);

  // For coefficient and subsidy calculation
  public subsidy: bigint[] = []; // size: M, M is number of vote options
  public subsidySalts: { [key: number]: bigint } = {};
  public rbi = 0; // row batch index
  public cbi = 0; // column batch index
  public MM = 50; // adjustable parameter
  public WW = 4; // number of digits for float representation

  constructor(
    _duration: number,
    _pollEndTimestamp: bigint,
    _coordinatorKeypair: Keypair,
    _treeDepths: TreeDepths,
    _batchSizes: BatchSizes,
    _maxValues: MaxValues,
    _maciStateRef: MaciState,
    _stateTreeDepth: number,
  ) {
    this.duration = _duration;
    this.pollEndTimestamp = _pollEndTimestamp;
    this.coordinatorKeypair = _coordinatorKeypair;
    this.treeDepths = _treeDepths;
    this.batchSizes = _batchSizes;
    this.maxValues = _maxValues;
    this.maciStateRef = _maciStateRef;
    this.pollId = _maciStateRef.polls.length;
    this.numSignUps = Number(_maciStateRef.numSignUps.toString());
    this.stateTreeDepth = _stateTreeDepth;

    this.stateTree = new IncrementalQuinTree(this.stateTreeDepth, blankStateLeafHash, STATE_TREE_ARITY, hash5);
    this.messageTree = new IncrementalQuinTree(
      this.treeDepths.messageTreeDepth,
      NOTHING_UP_MY_SLEEVE,
      MESSAGE_TREE_ARITY,
      hash5,
    );

    for (let i = 0; i < this.maxValues.maxVoteOptions; i++) {
      this.results.push(BigInt(0));
      this.perVOSpentVoiceCredits.push(BigInt(0));
      this.subsidy.push(BigInt(0));
    }

    const blankBallot = Ballot.genBlankBallot(this.maxValues.maxVoteOptions, _treeDepths.voteOptionTreeDepth);
    this.ballots.push(blankBallot);
  }

  private copyStateFromMaci = () => {
    // Copy the state tree, ballot tree, state leaves, and ballot leaves
    assert(this.maciStateRef.stateLeaves.length === this.maciStateRef.stateTree.nextIndex);

    this.stateLeaves = this.maciStateRef.stateLeaves.map((x) => x.copy());
    this.stateTree = this.maciStateRef.stateTree.copy();

    // Create as many ballots as state leaves
    const emptyBallot = new Ballot(this.maxValues.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);
    const emptyBallotHash = emptyBallot.hash();
    this.ballotTree = new IncrementalQuinTree(this.stateTreeDepth, emptyBallot.hash(), STATE_TREE_ARITY, hash5);
    this.ballotTree.insert(emptyBallotHash);

    while (this.ballots.length < this.stateLeaves.length) {
      this.ballotTree.insert(emptyBallotHash);
      this.ballots.push(emptyBallot);
    }

    this.numSignUps = Number(this.maciStateRef.numSignUps.toString());

    this.stateCopied = true;
  };

  /**
   * Process one message
   */
  private processMessage = (_index: number) => {
    //TODO: throw custom errors for no-ops

    try {
      // Ensure that the index is valid
      assert(_index >= 0);
      assert(this.messages.length > _index);

      // Ensure that there is the correct number of ECDH shared keys
      assert(this.encPubKeys.length === this.messages.length);

      const message = this.messages[_index];
      const encPubKey = this.encPubKeys[_index];

      // Decrypt the message
      const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey);
      const { command, signature } = PCommand.decrypt(message, sharedKey);

      const stateLeafIndex = BigInt(`${command.stateIndex}`);

      // If the state tree index in the command is invalid, do nothing
      if (stateLeafIndex >= BigInt(this.ballots.length) || stateLeafIndex < BigInt(1)) {
        throw Error("no-op");
        // console.log("invalid state tree index")
        return {};
      }

      if (stateLeafIndex >= BigInt(this.stateTree.nextIndex)) {
        // console.log("invalid state tree index")
        //TODO: handle error
        return {};
      }

      // The user to update (or not)
      const stateLeaf = this.stateLeaves[Number(stateLeafIndex)];

      // The ballot to update (or not)
      const ballot = this.ballots[Number(stateLeafIndex)];

      // If the signature is invalid, do nothing
      if (!command.verifySignature(signature, stateLeaf.pubKey)) {
        // console.log('Invalid signature. pubkeyx =', stateLeaf.pubKey.rawPubKey[0], 'sig', signature)
        throw Error("no-op");
        return {};
      }

      //console.log('Valid signature. pubkeyx =', stateLeaf.pubKey.rawPubKey[0], 'sig', signature)

      // If the nonce is invalid, do nothing
      if (command.nonce !== BigInt(`${ballot.nonce}`) + BigInt(1)) {
        // console.log('Invalid nonce. nonce =', ballot.nonce, 'command.nonce =', command.nonce)
        throw Error("no-op");
        return {};
      }

      const prevSpentCred = ballot.votes[Number(command.voteOptionIndex)];

      const voiceCreditsLeft =
        BigInt(`${stateLeaf.voiceCreditBalance}`) +
        BigInt(`${prevSpentCred}`) * BigInt(`${prevSpentCred}`) -
        BigInt(`${command.newVoteWeight}`) * BigInt(`${command.newVoteWeight}`);

      // If the remaining voice credits is insufficient, do nothing
      if (voiceCreditsLeft < BigInt(0)) {
        // console.log("no op")
        throw Error("no-op");
        return {};
      }

      // If the vote option index is invalid, do nothing
      if (command.voteOptionIndex < BigInt(0) || command.voteOptionIndex >= BigInt(this.maxValues.maxVoteOptions)) {
        // console.log("no op")
        throw Error("no-op");
        return {};
      }

      // Deep-copy the state leaf and update its attributes
      const newStateLeaf = stateLeaf.copy();
      newStateLeaf.voiceCreditBalance = voiceCreditsLeft;
      newStateLeaf.pubKey = command.newPubKey.copy();

      // Deep-copy the ballot and update its attributes
      const newBallot = ballot.copy();
      newBallot.nonce = BigInt(`${newBallot.nonce}`) + BigInt(1);
      newBallot.votes[Number(command.voteOptionIndex)] = command.newVoteWeight;

      const originalStateLeafPathElements = this.stateTree.genMerklePath(Number(stateLeafIndex)).pathElements;

      const originalBallotPathElements = this.ballotTree.genMerklePath(Number(stateLeafIndex)).pathElements;

      const voteOptionIndex = Number(command.voteOptionIndex);

      const originalVoteWeight = ballot.votes[voteOptionIndex];
      const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, BigInt(0), 5, hash5);
      for (let i = 0; i < this.ballots[0].votes.length; i++) {
        vt.insert(ballot.votes[i]);
      }

      const originalVoteWeightsPathElements = vt.genMerklePath(voteOptionIndex).pathElements;

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
      //TODO: throw custom errors for no-ops
      switch (e.message) {
        default:
          throw Error("no-op");
      }
    }
  };

  // Insert topup message into commands
  public topupMessage = (_message: Message) => {
    assert(_message.msgType == BigInt(2));
    for (const d of _message.data) {
      assert((d as bigint) < SNARK_FIELD_SIZE);
    }
    this.messages.push(_message);
    const padKey = new PubKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);

    this.encPubKeys.push(padKey);
    const messageLeaf = _message.hash(padKey);
    this.messageTree.insert(messageLeaf);

    const command = new TCommand(_message.data[0], _message.data[1], BigInt(this.pollId));
    this.commands.push(command);
  };

  /*
   * Inserts a Message and the corresponding public key used to generate the
   * ECDH shared key which was used to encrypt said message.
   */
  public publishMessage = (_message: Message, _encPubKey: PubKey) => {
    assert(_message.msgType == BigInt(1));
    assert(
      (_encPubKey.rawPubKey[0] as bigint) < SNARK_FIELD_SIZE && (_encPubKey.rawPubKey[1] as bigint) < SNARK_FIELD_SIZE,
    );
    for (const d of _message.data) {
      assert((d as bigint) < SNARK_FIELD_SIZE);
    }

    this.encPubKeys.push(_encPubKey);
    this.messages.push(_message);

    const messageLeaf = _message.hash(_encPubKey);
    this.messageTree.insert(messageLeaf);

    // Decrypt the message and store the Command
    const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, _encPubKey);
    try {
      const { command } = PCommand.decrypt(_message, sharedKey);
      this.commands.push(command);
    } catch (e) {
      //console.log(`error cannot decrypt: ${e.message}`)
      const keyPair = new Keypair();
      const command = new PCommand(BigInt(0), keyPair.pubKey, BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0));
      this.commands.push(command);
    }
  };

  public hasUnprocessedMessages = (): boolean => {
    const batchSize = this.batchSizes.messageBatchSize;

    let totalBatches = this.messages.length <= batchSize ? 1 : Math.floor(this.messages.length / batchSize);

    if (this.messages.length > batchSize && this.messages.length % batchSize > 0) {
      totalBatches++;
    }

    return this.numBatchesProcessed < totalBatches;
  };

  /**
   * Process _batchSize messages starting from the saved index.  This
   * function will process messages even if the number of messages is not an
   * exact multiple of _batchSize. e.g. if there are 10 messages, _index is
   * 8, and _batchSize is 4, this function will only process the last two
   * messages in this.messages, and finally update the zeroth state leaf.
   * Note that this function will only process as many state leaves as there
   * are ballots to prevent accidental inclusion of a new user after this
   * poll has concluded.
   * @param _pollId The ID of the poll associated with the messages to
   *        process
   */
  public processMessages = (_pollId: number): any => {
    assert(this.hasUnprocessedMessages(), "No more messages to process");

    const batchSize = this.batchSizes.messageBatchSize;

    if (this.numBatchesProcessed === 0) {
      // The starting index of the batch of messages to process.
      // Note that we process messages in reverse order.
      // e.g if there are 8 messages and the batch size is 5, then
      // the starting index should be 5.
      assert(this.currentMessageBatchIndex == undefined);
    }

    if (this.numBatchesProcessed === 0) {
      // Prevent other polls from being processed until this poll has
      // been fully processed
      this.maciStateRef.pollBeingProcessed = true;
      this.maciStateRef.currentPollBeingProcessed = _pollId;
    }

    // Only allow one poll to be processed at a time
    if (this.maciStateRef.pollBeingProcessed) {
      assert(this.maciStateRef.currentPollBeingProcessed === _pollId);
    }

    if (this.numBatchesProcessed === 0) {
      const r = this.messages.length % batchSize;

      if (r === 0) {
        this.currentMessageBatchIndex = Math.floor(this.messages.length / batchSize) * batchSize;
      } else {
        this.currentMessageBatchIndex = this.messages.length;
      }

      if (this.currentMessageBatchIndex > 0) {
        if (r === 0) {
          this.currentMessageBatchIndex -= batchSize;
        } else {
          this.currentMessageBatchIndex -= r;
        }
      }

      this.sbSalts[this.currentMessageBatchIndex] = BigInt(0);
    }

    // The starting index must be valid
    assert(this.currentMessageBatchIndex >= 0);
    assert(this.currentMessageBatchIndex % batchSize === 0);

    if (!this.stateCopied) {
      this.copyStateFromMaci();
    }

    // Generate circuit inputs
    const circuitInputs = stringifyBigInts(
      this.genProcessMessagesCircuitInputsPartial(this.currentMessageBatchIndex),
    ) as Record<string, bigint | bigint[] | bigint[][]>;

    const currentStateLeaves: StateLeaf[] = [];
    const currentStateLeavesPathElements: any[] = [];

    const currentBallots: Ballot[] = [];
    const currentBallotsPathElements: any[] = [];

    const currentVoteWeights: bigint[] = [];
    const currentVoteWeightsPathElements: any[] = [];

    for (let i = 0; i < batchSize; i++) {
      const idx = this.currentMessageBatchIndex + batchSize - i - 1;
      assert(idx >= 0);
      let message: Message;
      if (idx >= this.messages.length) {
        message = new Message(BigInt(1), Array(10).fill(BigInt(0))); // when idx large than actual size, just use something to pass to switch
      } else {
        message = this.messages[idx];
      }
      switch (message.msgType) {
        case BigInt(1):
          try {
            // If the command is valid
            const r = this.processMessage(idx);
            // console.log(messageIndex, r ? 'valid' : 'invalid')
            // console.log("r:"+r.newStateLeaf )
            // DONE: replace with try/catch after implementing error
            // handling
            const index = r.stateLeafIndex;

            currentStateLeaves.unshift(r.originalStateLeaf);
            currentBallots.unshift(r.originalBallot);
            currentVoteWeights.unshift(r.originalVoteWeight);
            currentVoteWeightsPathElements.unshift(r.originalVoteWeightsPathElements);

            currentStateLeavesPathElements.unshift(r.originalStateLeafPathElements);
            currentBallotsPathElements.unshift(r.originalBallotPathElements);

            this.stateLeaves[index] = r.newStateLeaf.copy();
            this.stateTree.update(index, r.newStateLeaf.hash());

            this.ballots[index] = r.newBallot;
            this.ballotTree.update(index, r.newBallot.hash());
          } catch (e) {
            if (e.message === "no-op") {
              // Since the command is invalid, use a blank state leaf
              currentStateLeaves.unshift(this.stateLeaves[0].copy());
              currentStateLeavesPathElements.unshift(this.stateTree.genMerklePath(0).pathElements);

              currentBallots.unshift(this.ballots[0].copy());
              currentBallotsPathElements.unshift(this.ballotTree.genMerklePath(0).pathElements);

              // Since the command is invalid, use vote option index 0
              currentVoteWeights.unshift(this.ballots[0].votes[0]);

              // No need to iterate through the entire votes array if the
              // remaining elements are 0
              let lastIndexToInsert = this.ballots[0].votes.length - 1;
              while (lastIndexToInsert > 0) {
                if (this.ballots[0].votes[lastIndexToInsert] === BigInt(0)) {
                  lastIndexToInsert--;
                } else {
                  break;
                }
              }

              const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, BigInt(0), 5, hash5);
              for (let i = 0; i <= lastIndexToInsert; i++) {
                vt.insert(this.ballots[0].votes[i]);
              }
              currentVoteWeightsPathElements.unshift(vt.genMerklePath(0).pathElements);
            } else {
              throw e;
            }
          }
          break;
        case BigInt(2):
          try {
            // --------------------------------------
            // generate topup circuit inputs
            let stateIndex = BigInt(message.data[0]);
            let amount = BigInt(message.data[1]);

            if (stateIndex >= BigInt(this.ballots.length)) {
              stateIndex = BigInt(0);
              amount = BigInt(0);
            }

            currentStateLeaves.unshift(this.stateLeaves[Number(stateIndex)].copy());
            currentStateLeavesPathElements.unshift(this.stateTree.genMerklePath(Number(stateIndex)).pathElements);

            const newStateLeaf = this.stateLeaves[Number(stateIndex)].copy();
            newStateLeaf.voiceCreditBalance = BigInt(newStateLeaf.voiceCreditBalance.valueOf()) + BigInt(amount);
            this.stateLeaves[Number(stateIndex)] = newStateLeaf;
            this.stateTree.update(Number(stateIndex), newStateLeaf.hash());

            // we still need them as placeholder for vote command
            const currentBallot = this.ballots[Number(stateIndex)].copy();
            currentBallots.unshift(currentBallot);
            currentBallotsPathElements.unshift(this.ballotTree.genMerklePath(Number(stateIndex)).pathElements);
            currentVoteWeights.unshift(currentBallot.votes[0]);

            const vt = new IncrementalQuinTree(this.treeDepths.voteOptionTreeDepth, BigInt(0), 5, hash5);
            for (let i = 0; i < this.ballots[0].votes.length; i++) {
              vt.insert(currentBallot.votes[i]);
            }

            currentVoteWeightsPathElements.unshift(vt.genMerklePath(0).pathElements);
          } catch (e) {
            console.error("An error occurred: ", e.message);
            throw e;
          }
          break;
        default:
          break;
      } // end msgType switch
    }

    // loop for batch
    circuitInputs.currentStateLeaves = currentStateLeaves.map((x) => x.asCircuitInputs());
    circuitInputs.currentStateLeavesPathElements = currentStateLeavesPathElements;
    circuitInputs.currentBallots = currentBallots.map((x) => x.asCircuitInputs());
    circuitInputs.currentBallotsPathElements = currentBallotsPathElements;
    circuitInputs.currentVoteWeights = currentVoteWeights;
    circuitInputs.currentVoteWeightsPathElements = currentVoteWeightsPathElements;

    this.numBatchesProcessed++;

    if (this.currentMessageBatchIndex > 0) {
      this.currentMessageBatchIndex -= batchSize;
    }

    // TODO: ensure newSbSalt differs from currentSbSalt
    const newSbSalt = genRandomSalt();
    this.sbSalts[this.currentMessageBatchIndex] = newSbSalt;

    circuitInputs.newSbSalt = newSbSalt;
    const newStateRoot = this.stateTree.root;
    const newBallotRoot = this.ballotTree.root;
    circuitInputs.newSbCommitment = hash3([newStateRoot, newBallotRoot, newSbSalt]);

    const coordPubKeyHash = this.coordinatorKeypair.pubKey.hash();
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
    return stringifyBigInts(circuitInputs);
  };

  /**
   * Generates inputs for the ProcessMessages circuit.
   */
  public genProcessMessagesCircuitInputsPartial = (_index: number) => {
    const messageBatchSize = this.batchSizes.messageBatchSize;

    assert(_index <= this.messages.length);
    assert(_index % messageBatchSize === 0);

    let msgs = this.messages.map((x) => x.asCircuitInputs());
    while (msgs.length % messageBatchSize > 0) {
      msgs.push(msgs[msgs.length - 1]);
    }

    msgs = msgs.slice(_index, _index + messageBatchSize);

    let commands = this.commands.map((x) => x.copy());
    while (commands.length % messageBatchSize > 0) {
      commands.push(commands[commands.length - 1]);
    }
    commands = commands.slice(_index, _index + messageBatchSize);

    while (this.messageTree.nextIndex < _index + messageBatchSize) {
      this.messageTree.insert(this.messageTree.zeroValue);
    }

    const messageSubrootPath = this.messageTree.genMerkleSubrootPath(_index, _index + messageBatchSize);

    assert(IncrementalQuinTree.verifyMerklePath(messageSubrootPath, this.messageTree.hashFunc) === true);

    let batchEndIndex = _index + messageBatchSize;
    if (batchEndIndex > this.messages.length) {
      batchEndIndex = this.messages.length;
    }

    let encPubKeys = this.encPubKeys.map((x) => x.copy());
    while (encPubKeys.length % messageBatchSize > 0) {
      encPubKeys.push(encPubKeys[encPubKeys.length - 1]);
    }
    encPubKeys = encPubKeys.slice(_index, _index + messageBatchSize);

    const msgRoot = this.messageTree.root;
    const currentStateRoot = this.stateTree.root;
    const currentBallotRoot = this.ballotTree.root;
    const currentSbCommitment = hash3([
      currentStateRoot,
      currentBallotRoot,
      this.sbSalts[this.currentMessageBatchIndex],
    ]);

    // Generate a SHA256 hash of inputs which the contract provides
    const packedVals =
      BigInt(this.maxValues.maxVoteOptions) +
      (BigInt(this.numSignUps) << BigInt(50)) +
      (BigInt(_index) << BigInt(100)) +
      (BigInt(batchEndIndex) << BigInt(150));

    const coordPubKey = this.coordinatorKeypair.pubKey;

    return stringifyBigInts({
      pollEndTimestamp: this.pollEndTimestamp,
      packedVals,
      msgRoot,
      msgs,
      msgSubrootPathElements: messageSubrootPath.pathElements,
      coordPrivKey: this.coordinatorKeypair.privKey.asCircuitInputs(),
      coordPubKey: coordPubKey.asCircuitInputs(),
      encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
      currentStateRoot,
      currentBallotRoot,
      currentSbCommitment,
      currentSbSalt: this.sbSalts[this.currentMessageBatchIndex],
    });
  };

  /**
   * Process all messages. This function does not update the ballots or state
   * leaves; rather, it copies and then updates them. This makes it possible
   * to test the result of multiple processMessage() invocations.
   */
  public processAllMessages = () => {
    if (!this.stateCopied) {
      this.copyStateFromMaci();
    }
    const stateLeaves = this.stateLeaves.map((x) => x.copy());
    const ballots = this.ballots.map((x) => x.copy());
    while (this.hasUnprocessedMessages()) {
      this.processMessages(this.pollId);
    }

    return { stateLeaves, ballots };
  };

  public hasUntalliedBallots = () => {
    const batchSize = this.batchSizes.tallyBatchSize;
    return this.numBatchesTallied * batchSize < this.ballots.length;
  };

  public hasUnfinishedSubsidyCalculation = () => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    return this.rbi * batchSize < this.ballots.length && this.cbi * batchSize < this.ballots.length;
  };

  public subsidyPerBatch = (): bigint[] => {
    const batchSize = this.batchSizes.subsidyBatchSize;

    assert(this.hasUnfinishedSubsidyCalculation(), "No more subsidy batches to calculate");

    const stateRoot = this.stateTree.root;
    const ballotRoot = this.ballotTree.root;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const currentSubsidy = this.subsidy.map((x) => BigInt(x.toString()));
    let currentSubsidyCommitment = BigInt(0);
    let currentSubsidySalt = BigInt(0);
    let saltIndex = this.previousSubsidyIndexToString();
    console.log(`prevIdx=${saltIndex}, curIdx=${this.rbi}-${this.cbi}`);
    if (this.rbi !== 0 || this.cbi !== 0) {
      currentSubsidySalt = BigInt(this.subsidySalts[saltIndex]);
      currentSubsidyCommitment = BigInt(
        genTreeCommitment(this.subsidy, currentSubsidySalt, this.treeDepths.voteOptionTreeDepth).valueOf(),
      );
    }

    const rowStartIndex = this.rbi * batchSize;
    const colStartIndex = this.cbi * batchSize;
    const [ballots1, ballots2] = this.subsidyCalculation(rowStartIndex, colStartIndex);

    const ballotSubrootProof1 = this.ballotTree.genMerkleSubrootPath(rowStartIndex, rowStartIndex + batchSize);
    const ballotSubrootProof2 = this.ballotTree.genMerkleSubrootPath(colStartIndex, colStartIndex + batchSize);

    const newSubsidySalt = genRandomSalt();
    saltIndex = this.rbi.toString() + "-" + this.cbi.toString();
    this.subsidySalts[saltIndex] = newSubsidySalt;
    const newSubsidyCommitment = genTreeCommitment(this.subsidy, newSubsidySalt, this.treeDepths.voteOptionTreeDepth);

    const packedVals = packSubsidySmallVals(this.rbi, this.cbi, this.numSignUps);

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
      ballotPathElements1: ballotSubrootProof1.pathElements,
      ballotPathElements2: ballotSubrootProof2.pathElements,
    });

    this.increaseSubsidyIndex();
    return circuitInputs as bigint[];
  };

  public increaseSubsidyIndex = () => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    if (this.cbi * batchSize + batchSize < this.ballots.length) {
      this.cbi++;
    } else {
      this.rbi++;
      this.cbi = this.rbi;
    }
    return;
  };

  public previousSubsidyIndexToString = (): string => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    const numBatches = Math.ceil(this.ballots.length / batchSize);
    let cbi = this.cbi;
    let rbi = this.rbi;
    if (this.cbi === 0 && this.rbi === 0) {
      return "0-0";
    }
    if (this.cbi > this.rbi) {
      cbi--;
    } else {
      rbi--;
      cbi = numBatches - 1;
    }
    return rbi.toString() + "-" + cbi.toString();
  };

  public coefficientCalculation = (rowBallot: Ballot, colBallot: Ballot): bigint => {
    let sum = BigInt(0);
    for (let p = 0; p < this.maxValues.maxVoteOptions; p++) {
      sum += BigInt(rowBallot.votes[p].valueOf()) * BigInt(colBallot.votes[p].valueOf());
    }
    const res = BigInt(this.MM * 10 ** this.WW) / (BigInt(this.MM) + BigInt(sum));
    return res;
  };

  public subsidyCalculation = (rowStartIndex: number, colStartIndex: number): Ballot[][] => {
    const batchSize = this.batchSizes.subsidyBatchSize;
    const ballots1: Ballot[] = [];
    const ballots2: Ballot[] = [];
    const emptyBallot = new Ballot(this.maxValues.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);
    for (let i = 0; i < batchSize; i++) {
      const row = rowStartIndex + i;
      const col = colStartIndex + i;
      const rowBallot = row < this.ballots.length ? this.ballots[row] : emptyBallot;
      const colBallot = col < this.ballots.length ? this.ballots[col] : emptyBallot;
      ballots1.push(rowBallot);
      ballots2.push(colBallot);
    }
    for (let i = 0; i < batchSize; i++) {
      for (let j = 0; j < batchSize; j++) {
        const row = rowStartIndex + i;
        const col = colStartIndex + j;
        const rowBallot = row < this.ballots.length ? this.ballots[row] : emptyBallot;
        const colBallot = col < this.ballots.length ? this.ballots[col] : emptyBallot;

        const kij = this.coefficientCalculation(rowBallot, colBallot);
        for (let p = 0; p < this.maxValues.maxVoteOptions; p++) {
          const vip = BigInt(rowBallot.votes[p].valueOf());
          const vjp = BigInt(colBallot.votes[p].valueOf());
          if (rowStartIndex !== colStartIndex || (rowStartIndex === colStartIndex && i < j)) {
            this.subsidy[p] = BigInt(this.subsidy[p].valueOf()) + BigInt(2) * BigInt(kij.valueOf()) * vip * vjp;
          }
        }
      }
    }

    return [ballots1, ballots2];
  };

  /**
   * Tally a batch of Ballots and update this.results
   */
  public tallyVotes = (): any => {
    const batchSize = this.batchSizes.tallyBatchSize;

    assert(this.hasUntalliedBallots(), "No more ballots to tally");

    const batchStartIndex = this.numBatchesTallied * batchSize;

    const currentResultsRootSalt =
      batchStartIndex === 0 ? BigInt(0) : this.resultRootSalts[batchStartIndex - batchSize];

    const currentPerVOSpentVoiceCreditsRootSalt =
      batchStartIndex === 0 ? BigInt(0) : this.preVOSpentVoiceCreditsRootSalts[batchStartIndex - batchSize];

    const currentSpentVoiceCreditSubtotalSalt =
      batchStartIndex === 0 ? BigInt(0) : this.spentVoiceCreditSubtotalSalts[batchStartIndex - batchSize];

    const currentResultsCommitment = this.genResultsCommitment(currentResultsRootSalt);

    const currentPerVOSpentVoiceCreditsCommitment = this.genPerVOSpentVoiceCreditsCommitment(
      currentPerVOSpentVoiceCreditsRootSalt,
      batchStartIndex,
    );

    const currentSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      currentSpentVoiceCreditSubtotalSalt,
      batchStartIndex,
    );

    const currentTallyCommitment =
      batchStartIndex === 0
        ? BigInt(0)
        : hash3([
            currentResultsCommitment,
            currentSpentVoiceCreditsCommitment,
            currentPerVOSpentVoiceCreditsCommitment,
          ]);

    const ballots: Ballot[] = [];
    const currentResults = this.results.map((x) => BigInt(x.toString()));
    const currentPerVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x) => BigInt(x.toString()));
    const currentSpentVoiceCreditSubtotal = BigInt(this.totalSpentVoiceCredits.toString());

    for (let i = this.numBatchesTallied * batchSize; i < this.numBatchesTallied * batchSize + batchSize; i++) {
      if (i >= this.ballots.length) {
        break;
      }

      ballots.push(this.ballots[i]);

      for (let j = 0; j < this.maxValues.maxVoteOptions; j++) {
        const v = BigInt(`${this.ballots[i].votes[j]}`);

        this.results[j] = BigInt(`${this.results[j]}`) + v;

        this.perVOSpentVoiceCredits[j] = BigInt(`${this.perVOSpentVoiceCredits[j]}`) + BigInt(v) * BigInt(v);

        this.totalSpentVoiceCredits = BigInt(`${this.totalSpentVoiceCredits}`) + BigInt(v) * BigInt(v);
      }
    }

    const emptyBallot = new Ballot(this.maxValues.maxVoteOptions, this.treeDepths.voteOptionTreeDepth);

    while (ballots.length < batchSize) {
      ballots.push(emptyBallot);
    }

    const newResultsRootSalt = genRandomSalt();
    const newPerVOSpentVoiceCreditsRootSalt = genRandomSalt();
    const newSpentVoiceCreditSubtotalSalt = genRandomSalt();

    this.resultRootSalts[batchStartIndex] = newResultsRootSalt;
    this.preVOSpentVoiceCreditsRootSalts[batchStartIndex] = newPerVOSpentVoiceCreditsRootSalt;
    this.spentVoiceCreditSubtotalSalts[batchStartIndex] = newSpentVoiceCreditSubtotalSalt;

    const newResultsCommitment = this.genResultsCommitment(newResultsRootSalt);

    const newSpentVoiceCreditsCommitment = this.genSpentVoiceCreditSubtotalCommitment(
      newSpentVoiceCreditSubtotalSalt,
      batchStartIndex + batchSize,
    );

    const newPerVOSpentVoiceCreditsCommitment = this.genPerVOSpentVoiceCreditsCommitment(
      newPerVOSpentVoiceCreditsRootSalt,
      batchStartIndex + batchSize,
    );

    const newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);

    //debugger

    const stateRoot = this.stateTree.root as bigint;
    const ballotRoot = this.ballotTree.root as bigint;
    const sbSalt = this.sbSalts[this.currentMessageBatchIndex];
    const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt]);

    const packedVals = packTallyVotesSmallVals(batchStartIndex, batchSize, this.numSignUps);
    const inputHash = sha256Hash([packedVals, sbCommitment, currentTallyCommitment, newTallyCommitment]);

    const ballotSubrootProof = this.ballotTree.genMerkleSubrootPath(batchStartIndex, batchStartIndex + batchSize);

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
      ballotPathElements: ballotSubrootProof.pathElements,
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
    });

    this.numBatchesTallied++;

    return circuitInputs;
  };

  public genResultsCommitment = (_salt: bigint) => {
    const resultsTree = new IncrementalQuinTree(
      this.treeDepths.voteOptionTreeDepth,
      BigInt(0),
      VOTE_OPTION_TREE_ARITY,
      hash5,
    );

    for (const r of this.results) {
      resultsTree.insert(r);
    }

    return hashLeftRight(resultsTree.root, _salt);
  };

  public genSpentVoiceCreditSubtotalCommitment = (_salt: bigint, _numBallotsToCount: number) => {
    let subtotal = BigInt(0);
    for (let i = 0; i < _numBallotsToCount; i++) {
      if (i >= this.ballots.length) {
        break;
      }
      for (let j = 0; j < this.results.length; j++) {
        const v = BigInt(`${this.ballots[i].votes[j]}`);
        subtotal = BigInt(subtotal) + v * v;
      }
    }
    return hashLeftRight(subtotal, _salt);
  };

  public genPerVOSpentVoiceCreditsCommitment = (_salt: bigint, _numBallotsToCount: number) => {
    const resultsTree = new IncrementalQuinTree(
      this.treeDepths.voteOptionTreeDepth,
      BigInt(0),
      VOTE_OPTION_TREE_ARITY,
      hash5,
    );

    const leaves: bigint[] = [];

    for (let i = 0; i < this.results.length; i++) {
      leaves.push(BigInt(0));
    }

    for (let i = 0; i < _numBallotsToCount; i++) {
      if (i >= this.ballots.length) {
        break;
      }
      for (let j = 0; j < this.results.length; j++) {
        const v = BigInt(`${this.ballots[i].votes[j]}`);
        leaves[j] = BigInt(`${leaves[j]}`) + v * v;
      }
    }

    for (let i = 0; i < leaves.length; i++) {
      resultsTree.insert(leaves[i]);
    }

    return hashLeftRight(resultsTree.root, _salt);
  };

  public copy = (): Poll => {
    const copied = new Poll(
      Number(this.duration.toString()),
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
      this.stateTreeDepth,
    );

    copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy());
    copied.messages = this.messages.map((x: Message) => x.copy());
    copied.commands = this.commands.map((x: Command) => x.copy());
    copied.ballots = this.ballots.map((x: Ballot) => x.copy());
    copied.encPubKeys = this.encPubKeys.map((x: PubKey) => x.copy());
    if (this.ballotTree) {
      copied.ballotTree = this.ballotTree.copy();
    }
    copied.currentMessageBatchIndex = this.currentMessageBatchIndex;
    copied.maciStateRef = this.maciStateRef;
    copied.messageTree = this.messageTree.copy();
    copied.results = this.results.map((x: bigint) => BigInt(x.toString()));
    copied.perVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x: bigint) => BigInt(x.toString()));

    copied.numBatchesProcessed = Number(this.numBatchesProcessed.toString());
    copied.numBatchesTallied = Number(this.numBatchesTallied.toString());
    copied.pollId = Number(this.pollId.toString());
    copied.totalSpentVoiceCredits = BigInt(this.totalSpentVoiceCredits.toString());

    copied.sbSalts = {};
    copied.resultRootSalts = {};
    copied.preVOSpentVoiceCreditsRootSalts = {};
    copied.spentVoiceCreditSubtotalSalts = {};

    for (const k of Object.keys(this.sbSalts)) {
      copied.sbSalts[k] = BigInt(this.sbSalts[k].toString());
    }
    for (const k of Object.keys(this.resultRootSalts)) {
      copied.resultRootSalts[k] = BigInt(this.resultRootSalts[k].toString());
    }
    for (const k of Object.keys(this.preVOSpentVoiceCreditsRootSalts)) {
      copied.preVOSpentVoiceCreditsRootSalts[k] = BigInt(this.preVOSpentVoiceCreditsRootSalts[k].toString());
    }
    for (const k of Object.keys(this.spentVoiceCreditSubtotalSalts)) {
      copied.spentVoiceCreditSubtotalSalts[k] = BigInt(this.spentVoiceCreditSubtotalSalts[k].toString());
    }

    // subsidy related copy
    copied.subsidy = this.subsidy.map((x: bigint) => BigInt(x.toString()));
    copied.rbi = Number(this.rbi.toString());
    copied.cbi = Number(this.cbi.toString());
    copied.MM = Number(this.MM.toString());
    copied.WW = Number(this.WW.toString());
    for (const k of Object.keys(this.subsidySalts)) {
      copied.subsidySalts[k] = BigInt(this.subsidySalts[k].toString());
    }
    return copied;
  };

  public equals = (p: Poll): boolean => {
    const result =
      this.duration === p.duration &&
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
      this.encPubKeys.length === p.encPubKeys.length;

    if (!result) return false;

    for (let i = 0; i < this.messages.length; i++) {
      if (!this.messages[i].equals(p.messages[i])) {
        return false;
      }
    }
    for (let i = 0; i < this.encPubKeys.length; i++) {
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
  toJSON() {
    return {
      duration: this.duration,
      pollEndTimestamp: this.pollEndTimestamp.toString(),
      treeDepths: this.treeDepths,
      batchSizes: this.batchSizes,
      maxValues: this.maxValues,
      messages: this.messages.map((message) => message.toJSON()),
      commands: this.commands.map((command) => command.toJSON()),
      ballots: this.ballots.map((ballot) => ballot.toJSON()),
      encPubKeys: this.encPubKeys.map((encPubKey) => encPubKey.serialize()),
      ballotTree: this.ballotTree,
      currentMessageBatchIndex: this.currentMessageBatchIndex,
      stateLeaves: this.stateLeaves.map((leaf) => leaf.toJSON()),
      results: this.results.map((result) => result.toString()),
      numBatchesProcessed: this.numBatchesProcessed,
    };
  }

  /**
   * Deserialize a json object into a Poll instance
   * @param json the json object to deserialize
   * @param maciState the reference to the MaciState Class
   * @returns a new Poll instance
   */
  static fromJSON(json: any, maciState: MaciState): Poll {
    const poll = new Poll(
      json.duration,
      BigInt(json.pollEndTimestamp),
      new Keypair(),
      json.treeDepths,
      json.batchSizes,
      json.maxValues,
      maciState,
      maciState.stateTreeDepth,
    );

    // set all properties
    poll.ballots = json.ballots.map((ballot: Ballot) => Ballot.fromJSON(ballot));
    poll.encPubKeys = json.encPubKeys.map((key: string) => PubKey.deserialize(key));
    poll.messages = json.messages.map((message: Message) => Message.fromJSON(message));
    poll.commands = json.commands.map((command: any) => {
      switch (command.cmdType) {
        case "1": {
          return PCommand.fromJSON(command);
        }
        case "2": {
          return TCommand.fromJSON(command);
        }
        default: {
          return Command.fromJSON(command);
        }
      }
    });
    poll.results = json.results.map((result: string) => BigInt(result));
    poll.currentMessageBatchIndex = json.currentMessageBatchIndex;
    poll.numBatchesProcessed = json.numBatchesProcessed;

    // fill the trees
    for (let i = 0; i < poll.messages.length; i++) {
      const messageLeaf = poll.messages[i].hash(poll.encPubKeys[i]);
      poll.messageTree.insert(messageLeaf);
    }

    // copy maci state
    poll.copyStateFromMaci();

    return poll;
  }

  /**
   * Set the coordinator's keypair
   * @param serializedPrivateKey - the serialized private key
   */
  public setCoordinatorKeypair = (serializedPrivateKey: string) => {
    this.coordinatorKeypair = new Keypair(PrivKey.deserialize(serializedPrivateKey));
  };
}

export { Poll };
