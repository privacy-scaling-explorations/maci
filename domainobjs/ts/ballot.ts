import * as assert from "assert"
import { genRandomSalt, hash5, hashLeftRight } from "maci-crypto";
import { OptimisedMT as IncrementalQuinTree } from "optimisedmt";

/**
 * A Ballot represents a User's votes in a Poll, as well as their next valid
 * nonce.
 * @param _voiceCreditBalance The user's voice credit balance
 * @param _nonce The number of valid commands which the user has already
 *               published
*/
export class Ballot {
    public votes: bigint[] = []
    public nonce: bigint = BigInt(0)
    public voteOptionTreeDepth: number

    /**
     * Create a new Ballot instance
     * @param _numVoteOptions How many vote options are available in the poll
     * @param _voteOptionTreeDepth The depth of the merkle tree holding the vote options
     */
    constructor(_numVoteOptions: number, _voteOptionTreeDepth: number) {
        this.voteOptionTreeDepth = _voteOptionTreeDepth
        assert(5 ** _voteOptionTreeDepth >= _numVoteOptions)
        assert(_numVoteOptions >= 0)
        for (let i = 0; i < _numVoteOptions; i++) {
            this.votes.push(BigInt(0))
        }
    }

    /**
     * Generate an hash of this ballot
     * @returns The hash of the ballot
     */
    public hash = (): bigint => {
        const vals = this.asArray()
        return hashLeftRight(vals[0], vals[1]) as bigint 
    }

    /**
     * Convert in a format suitable for the circuit
     * @returns the ballot as a BigInt array
     */
    public asCircuitInputs = (): bigint[] => {
        return this.asArray()
    }

    /**
     * Convert in a an array of bigints
     * @notice this is the nonce and the root of the vote option tree
     * @returns the ballot as a bigint array
     */
    public asArray = (): bigint[] => {
        let lastIndexToInsert = this.votes.length - 1
        while (lastIndexToInsert > 0) {
            if (this.votes[lastIndexToInsert] !== BigInt(0)) {
                break
            }
            lastIndexToInsert--;
        }
        const voTree = new IncrementalQuinTree(
            this.voteOptionTreeDepth,
            BigInt(0),
            5,
            hash5
        )
        for (let i = 0; i <= lastIndexToInsert; i++) {
            voTree.insert(this.votes[i])
        }

        return [this.nonce, voTree.root]
    }

    /**
     * Create a deep clone of this Ballot
     * @returns a copy of the ballot
     */
    public copy = (): Ballot => {
        const b = new Ballot(this.votes.length, this.voteOptionTreeDepth)

        b.votes = this.votes.map((x) => BigInt(x.toString()))
        b.nonce = BigInt(this.nonce.toString())
        return b
    }

    /**
     * Check if two ballots are equal (same votes and same nonce)
     * @param b - The ballot to compare with
     * @returns whether the two ballots are equal
     */
    public equals(b: Ballot): boolean {
        for (let i = 0; i < this.votes.length; i++) {
            if (b.votes[i] !== this.votes[i]) {
                return false
            }
        }
        return b.nonce === this.nonce && this.votes.length === b.votes.length
    }

    /**
     * Generate a random ballot
     * @param _numVoteOptions How many vote options are available
     * @param _voteOptionTreeDepth How deep is the merkle tree holding the vote options
     * @returns a random Ballot
     */
    public static genRandomBallot(
        _numVoteOptions: number,
        _voteOptionTreeDepth: number
    ) {
        const ballot = new Ballot(_numVoteOptions, _voteOptionTreeDepth)
        ballot.nonce = genRandomSalt() as bigint
        return ballot;
    }

    /**
     * Generate a blank ballot
     * @param _numVoteOptions How many vote options are available
     * @param _voteOptionTreeDepth How deep is the merkle tree holding the vote options
     * @returns a Blank Ballot object
     */
    public static genBlankBallot(
        _numVoteOptions: number,
        _voteOptionTreeDepth: number
    ) {
        const ballot = new Ballot(_numVoteOptions, _voteOptionTreeDepth)
        return ballot
    }
}
