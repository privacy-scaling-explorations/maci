import { IncrementalQuinTree, hash5 } from "maci-crypto";
import { PubKey, Keypair, StateLeaf } from "maci-domainobjs";

import { Poll } from "./Poll";
import { TreeDepths, MaxValues } from "./utils/utils";
import { STATE_TREE_ARITY } from "./utils/constants";

// todo: organize this in domainobjs
const blankStateLeaf = StateLeaf.genBlankLeaf();
const blankStateLeafHash = blankStateLeaf.hash();

/*
 * File Overview:
 * - IMaciState: Interface detailing `MaciState`'s public API.
 * - MaciState: Core class implementing the above interface.
 */

interface IMaciState {
  signUp(_pubKey: PubKey, _initialVoiceCreditBalance: bigint, _timestamp: bigint): number;

  deployPoll(
    _duration: number,
    _pollEndTimestamp: bigint,
    _maxValues: MaxValues,
    _treeDepths: TreeDepths,
    _messageBatchSize: number,
    _coordinatorKeypair: Keypair,
  ): number;
  deployNullPoll(): void;
  copy(): MaciState;
  equals(m: MaciState): boolean;
  toJSON(): any;
}

// A representation of the MACI contract
// Also see MACI.sol
class MaciState implements IMaciState {
  public polls: Poll[] = [];

  public stateTree: IncrementalQuinTree;
  public stateLeaves: StateLeaf[] = [];

  public numSignUps = 0;

  public stateTreeDepth: number;

  public pollBeingProcessed: boolean;
  public currentPollBeingProcessed: number;

  constructor(_stateTreeDepth: number) {
    this.stateTreeDepth = _stateTreeDepth;
    this.stateTree = new IncrementalQuinTree(this.stateTreeDepth, blankStateLeafHash, STATE_TREE_ARITY, hash5);

    this.stateLeaves.push(blankStateLeaf);
    this.stateTree.insert(blankStateLeafHash);
  }

  public signUp(_pubKey: PubKey, _initialVoiceCreditBalance: bigint, _timestamp: bigint): number {
    this.numSignUps++;
    const stateLeaf = new StateLeaf(_pubKey, _initialVoiceCreditBalance, _timestamp);
    const h = stateLeaf.hash();

    this.stateTree.insert(h);
    const arrayLength = this.stateLeaves.push(stateLeaf.copy());
    const leafIndex = arrayLength - 1;
    return leafIndex;
  }

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

  public deployNullPoll() {
    this.polls.push(null);
  }

  /*
   * Deep-copy this object
   */
  public copy = (): MaciState => {
    const copied = new MaciState(this.stateTreeDepth);

    copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy());
    copied.polls = this.polls.map((x: Poll) => x.copy());

    return copied;
  };

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
   * Serialize the MaciState object to a JSON object
   * @returns a JSON object
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

  // create a new object from JSON
  static fromJSON(json: any) {
    // create new instance
    const maciState = new MaciState(json.stateTreeDepth);

    // assign the json values to the new instance
    maciState.stateLeaves = json.stateLeaves.map((leaf: string) => StateLeaf.fromJSON(leaf));
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

// todo: remove re-export `IncrementalQuinTree` it's originally exported by `maci-crypto`
export { IncrementalQuinTree, MaciState };
