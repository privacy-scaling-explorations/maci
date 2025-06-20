import { hash5, hashLeftRight, IncrementalQuinTree } from "@maci-protocol/crypto";

import assert from "assert";

import type { IJsonVoteCounts } from "./types";

/**
 * A VoteCounts represents a User's vote counts in a Poll, as well as their next valid
 * nonce.
 */
export class VoteCounts {
  counts: bigint[] = [];

  nonce = 0n;

  voteOptionTreeDepth: number;

  /**
   * Create a new VoteCounts instance
   * @param totalVoteOptions How many vote options are available in the poll
   * @param voteOptionTreeDepth The depth of the merkle tree holding the vote options
   */
  constructor(totalVoteOptions: number, voteOptionTreeDepth: number) {
    assert(5 ** voteOptionTreeDepth >= totalVoteOptions);
    assert(totalVoteOptions >= 0);

    this.voteOptionTreeDepth = voteOptionTreeDepth;

    for (let i = 0; i < totalVoteOptions; i += 1) {
      this.counts.push(0n);
    }
  }

  /**
   * Generate a blank VoteCounts object
   * @param totalVoteOptions How many vote options are available
   * @param voteOptionTreeDepth How deep is the merkle tree holding the vote options
   * @returns a Blank VoteCounts object
   */
  static generateBlank(totalVoteOptions: number, voteOptionTreeDepth: number): VoteCounts {
    return new VoteCounts(totalVoteOptions, voteOptionTreeDepth);
  }

  /**
   * Generate an hash of this vote counts
   * @returns The hash of the vote counts
   */
  hash = (): bigint => {
    const [nonce, root] = this.asArray();

    return hashLeftRight(nonce, root);
  };

  /**
   * Convert in a format suitable for the circuit
   * @returns the vote counts as a BigInt array
   */
  asCircuitInputs = (): bigint[] => this.asArray();

  /**
   * Convert in a an array of bigints
   * @notice this is the nonce and the root of the vote option tree
   * @returns the vote counts as a bigint array
   */
  asArray = (): bigint[] => {
    const lastIndex = this.counts.length - 1;
    const foundIndex = this.counts.findIndex((_, index) => this.counts[lastIndex - index] !== 0n);
    const lastIndexToInsert = foundIndex >= 0 ? lastIndex - foundIndex : -1;
    const voteCountsTree = new IncrementalQuinTree(this.voteOptionTreeDepth, 0n, 5, hash5);

    for (let i = 0; i <= lastIndexToInsert; i += 1) {
      voteCountsTree.insert(this.counts[i]);
    }

    return [this.nonce, voteCountsTree.root];
  };

  /**
   * Create a deep clone of this VoteCounts
   * @returns a copy of the vote counts
   */
  copy = (): VoteCounts => {
    const voteCounts = new VoteCounts(this.counts.length, this.voteOptionTreeDepth);

    voteCounts.counts = this.counts.map((x) => BigInt(x.toString()));
    voteCounts.nonce = BigInt(this.nonce.toString());

    return voteCounts;
  };

  /**
   * Check if two vote counts are equal (same counts and same nonce)
   * @param voteCounts - The vote counts to compare with
   * @returns whether the two vote counts are equal
   */
  equals(voteCounts: VoteCounts): boolean {
    const isEqualVotes = this.counts.every((vote, index) => vote === voteCounts.counts[index]);

    return isEqualVotes ? voteCounts.nonce === this.nonce && this.counts.length === voteCounts.counts.length : false;
  }

  /**
   * Serialize to a JSON object
   *
   * @returns the JSON representation of the vote counts
   */
  toJSON(): IJsonVoteCounts {
    return {
      counts: this.counts.map((x) => x.toString()),
      nonce: this.nonce.toString(),
      voteOptionTreeDepth: this.voteOptionTreeDepth.toString(),
    };
  }

  /**
   * Deserialize into a VoteCounts instance
   * @param json - the json representation
   * @returns the deserialized object as a VoteCounts instance
   */
  static fromJSON(json: IJsonVoteCounts): VoteCounts {
    const voteCounts = new VoteCounts(json.counts.length, Number.parseInt(json.voteOptionTreeDepth.toString(), 10));
    voteCounts.counts = json.counts.map((x) => BigInt(x));
    voteCounts.nonce = BigInt(json.nonce);

    return voteCounts;
  }
}
