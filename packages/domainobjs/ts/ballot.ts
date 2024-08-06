import { genRandomSalt, hash5, hashLeftRight, IncrementalQuinTree } from "maci-crypto";

import assert from "assert";

import type { IJsonBallot } from "./types";

/**
 * A Ballot represents a User's votes in a Poll, as well as their next valid
 * nonce.
 */
export class Ballot {
  votes: bigint[] = [];

  nonce = BigInt(0);

  voteOptionTreeDepth: number;

  /**
   * Create a new Ballot instance
   * @param _numVoteOptions How many vote options are available in the poll
   * @param _voteOptionTreeDepth The depth of the merkle tree holding the vote options
   */
  constructor(_numVoteOptions: number, _voteOptionTreeDepth: number) {
    this.voteOptionTreeDepth = _voteOptionTreeDepth;
    assert(5 ** _voteOptionTreeDepth >= _numVoteOptions);
    assert(_numVoteOptions >= 0);
    for (let i = 0; i < _numVoteOptions; i += 1) {
      this.votes.push(BigInt(0));
    }
  }

  /**
   * Generate an hash of this ballot
   * @returns The hash of the ballot
   */
  hash = (): bigint => {
    const vals = this.asArray();
    return hashLeftRight(vals[0], vals[1]);
  };

  /**
   * Convert in a format suitable for the circuit
   * @returns the ballot as a BigInt array
   */
  asCircuitInputs = (): bigint[] => this.asArray();

  /**
   * Convert in a an array of bigints
   * @notice this is the nonce and the root of the vote option tree
   * @returns the ballot as a bigint array
   */
  asArray = (): bigint[] => {
    const lastIndex = this.votes.length - 1;
    const foundIndex = this.votes.findIndex((_, index) => this.votes[lastIndex - index] !== BigInt(0));
    const lastIndexToInsert = foundIndex < 0 ? -1 : lastIndex - foundIndex;
    const voTree = new IncrementalQuinTree(this.voteOptionTreeDepth, BigInt(0), 5, hash5);
    for (let i = 0; i <= lastIndexToInsert; i += 1) {
      voTree.insert(this.votes[i]);
    }

    return [this.nonce, voTree.root];
  };

  /**
   * Create a deep clone of this Ballot
   * @returns a copy of the ballot
   */
  copy = (): Ballot => {
    const b = new Ballot(this.votes.length, this.voteOptionTreeDepth);

    b.votes = this.votes.map((x) => BigInt(x.toString()));
    b.nonce = BigInt(this.nonce.toString());
    return b;
  };

  /**
   * Check if two ballots are equal (same votes and same nonce)
   * @param b - The ballot to compare with
   * @returns whether the two ballots are equal
   */
  equals(b: Ballot): boolean {
    const isEqualVotes = this.votes.every((vote, index) => vote === b.votes[index]);
    return isEqualVotes ? b.nonce === this.nonce && this.votes.length === b.votes.length : false;
  }

  /**
   * Generate a random ballot
   * @param numVoteOptions How many vote options are available
   * @param voteOptionTreeDepth How deep is the merkle tree holding the vote options
   * @returns a random Ballot
   */
  static genRandomBallot(numVoteOptions: number, voteOptionTreeDepth: number): Ballot {
    const ballot = new Ballot(numVoteOptions, voteOptionTreeDepth);
    ballot.nonce = genRandomSalt();
    return ballot;
  }

  /**
   * Generate a blank ballot
   * @param numVoteOptions How many vote options are available
   * @param voteOptionTreeDepth How deep is the merkle tree holding the vote options
   * @returns a Blank Ballot object
   */
  static genBlankBallot(numVoteOptions: number, voteOptionTreeDepth: number): Ballot {
    const ballot = new Ballot(numVoteOptions, voteOptionTreeDepth);
    return ballot;
  }

  /**
   * Serialize to a JSON object
   */
  toJSON(): IJsonBallot {
    return {
      votes: this.votes.map((x) => x.toString()),
      nonce: this.nonce.toString(),
      voteOptionTreeDepth: this.voteOptionTreeDepth.toString(),
    };
  }

  /**
   * Deserialize into a Ballot instance
   * @param json - the json representation
   * @returns the deserialized object as a Ballot instance
   */
  static fromJSON(json: IJsonBallot): Ballot {
    const ballot = new Ballot(json.votes.length, Number.parseInt(json.voteOptionTreeDepth.toString(), 10));
    ballot.votes = json.votes.map((x) => BigInt(x));
    ballot.nonce = BigInt(json.nonce);
    return ballot;
  }
}
