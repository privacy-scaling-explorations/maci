import { IncrementalQuinTree, hash5 } from "maci-crypto";
import { PubKey, Keypair, StateLeaf, blankStateLeaf, blankStateLeafHash } from "maci-domainobjs";

import { Poll } from "./Poll";
import { TreeDepths, MaxValues } from "./utils/utils";
import { STATE_TREE_ARITY } from "./utils/constants";

/**
 * Represents the public API of the MaciState class.
 */
interface IMaciState {
  // This method is used for signing up users to the state tree.
  signUp(_pubKey: PubKey, _initialVoiceCreditBalance: bigint, _timestamp: bigint): number;
  // This method is used for deploying poll.
  deployPoll(
    _duration: number,
    _pollEndTimestamp: bigint,
    _maxValues: MaxValues,
    _treeDepths: TreeDepths,
    _messageBatchSize: number,
    _coordinatorKeypair: Keypair,
  ): number;
  // These methods are helper functions.
  deployNullPoll(): void;
  copy(): MaciState;
  equals(m: MaciState): boolean;
  toJSON(): any;
}

/**
 * A representation of the MACI contract.
 */
class MaciState implements IMaciState {
  public polls: Poll[] = [];

  public stateTree: IncrementalQuinTree;
  public stateLeaves: StateLeaf[] = [];

  public numSignUps = 0;

  public stateTreeDepth: number;

  public pollBeingProcessed: boolean;
  public currentPollBeingProcessed: number;

  /**
   * Constructs a new MaciState object.
   * @param _stateTreeDepth - The depth of the state tree.
   */
  constructor(_stateTreeDepth: number) {
    this.stateTreeDepth = _stateTreeDepth;
    this.stateTree = new IncrementalQuinTree(this.stateTreeDepth, blankStateLeafHash, STATE_TREE_ARITY, hash5);

    this.stateLeaves.push(blankStateLeaf);
    this.stateTree.insert(blankStateLeafHash);
  }

  /**
   * Sign up a user with the given public key, initial voice credit balance, and timestamp.
   * @param _pubKey - The public key of the user.
   * @param _initialVoiceCreditBalance - The initial voice credit balance of the user.
   * @param _timestamp - The timestamp of the sign-up.
   * @returns The index of the newly signed-up user in the state tree.
   */
  public signUp(_pubKey: PubKey, _initialVoiceCreditBalance: bigint, _timestamp: bigint): number {
    this.numSignUps++;
    const stateLeaf = new StateLeaf(_pubKey, _initialVoiceCreditBalance, _timestamp);
    const hash = stateLeaf.hash();
    this.stateTree.insert(hash);

    return this.stateLeaves.push(stateLeaf.copy()) - 1;
  }

  /**
   * Deploy a new poll with the given parameters.
   * @param _duration - The duration of the poll in seconds.
   * @param _pollEndTimestamp - The Unix timestamp at which the poll ends.
   * @param _maxValues - The maximum number of values for each vote option.
   * @param _treeDepths - The depths of the tree.
   * @param _messageBatchSize - The batch size for processing messages.
   * @param _coordinatorKeypair - The keypair of the MACI round coordinator.
   * @returns The index of the newly deployed poll.
   */
  public deployPoll(
    _duration: number,
    _pollEndTimestamp: bigint,
    _maxValues: MaxValues,
    _treeDepths: TreeDepths,
    _messageBatchSize: number,
    _coordinatorKeypair: Keypair,
  ): number {
    // TODO: fix the order of the arguments
    const poll: Poll = new Poll(
      _duration,
      _pollEndTimestamp,
      _coordinatorKeypair,
      _treeDepths,
      {
        messageBatchSize: _messageBatchSize,
        subsidyBatchSize: STATE_TREE_ARITY ** _treeDepths.intStateTreeDepth,
        tallyBatchSize: STATE_TREE_ARITY ** _treeDepths.intStateTreeDepth,
      },
      _maxValues,
      this,
      this.stateTreeDepth,
    );

    this.polls.push(poll);
    return this.polls.length - 1;
  }

  /**
   * Deploy a null poll.
   */
  public deployNullPoll() {
    this.polls.push(null);
  }

  /**
   * Create a deep copy of the MaciState object.
   * @returns A new instance of the MaciState object with the same properties.
   */
  public copy = (): MaciState => {
    const copied = new MaciState(this.stateTreeDepth);

    copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy());
    copied.polls = this.polls.map((x: Poll) => x.copy());

    return copied;
  };

  /**
   * Check if the MaciState object is equal to another MaciState object.
   * @param m - The MaciState object to compare.
   * @returns True if the two MaciState objects are equal, false otherwise.
   */
  public equals = (m: MaciState): boolean => {
    const result =
      this.stateTreeDepth === m.stateTreeDepth &&
      this.polls.length === m.polls.length &&
      this.stateLeaves.length === m.stateLeaves.length;

    if (!result) return false;

    for (let i = 0; i < this.polls.length; i++) {
      if (!this.polls[i].equals(m.polls[i])) {
        return false;
      }
    }
    for (let i = 0; i < this.stateLeaves.length; i++) {
      if (!this.stateLeaves[i].equals(m.stateLeaves[i])) {
        return false;
      }
    }

    return true;
  };

  /**
   * Serialize the MaciState object to a JSON object.
   * @returns A JSON object representing the MaciState object.
   */
  toJSON() {
    return {
      stateTreeDepth: this.stateTreeDepth,
      polls: this.polls.map((poll) => poll.toJSON()),
      stateLeaves: this.stateLeaves.map((leaf) => leaf.toJSON()),
      pollBeingProcessed: this.pollBeingProcessed,
      currentPollBeingProcessed: this.currentPollBeingProcessed ? this.currentPollBeingProcessed.toString() : "",
      numSignUps: this.numSignUps,
    };
  }

  /**
   * Create a new MaciState object from a JSON object.
   * @param json - The JSON object representing the MaciState object.
   * @returns A new instance of the MaciState object with the properties from the JSON object.
   */
  static fromJSON(json: any) {
    const maciState = new MaciState(json.stateTreeDepth);

    // assign the json values to the new instance
    maciState.stateLeaves = json.stateLeaves.map((leaf) => StateLeaf.fromJSON(leaf));
    maciState.pollBeingProcessed = json.pollBeingProcessed;
    maciState.currentPollBeingProcessed = json.currentPollBeingProcessed;
    maciState.numSignUps = json.numSignUps;

    // re create the state tree (start from index 1 as in the constructor we already add the blank leaf)
    for (let i = 1; i < json.stateLeaves.length; i++) {
      const leaf = StateLeaf.fromJSON(json.stateLeaves[i]);
      const leafHash = leaf.hash();
      maciState.stateTree.insert(leafHash);
    }

    // re-generate the polls and set the maci state ref
    maciState.polls = json.polls.map((jsonPoll: Poll) => Poll.fromJSON(jsonPoll, maciState));
    return maciState;
  }
}

export { MaciState };
