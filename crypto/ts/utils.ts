import * as ff from 'ffjavascript'
import { IncrementalQuinTree, hash5, hashLeftRight } from './index'

/**
 * Convert a bigint to a string 
 * @param obj - the object to convert
 * @returns the converted object
 */
export const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

/**
 * Convert a string to a bigint
 * @param obj - the object to convert
 * @returns the converted object
 */
export const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

/**
 * Convert a BigInt to a Buffer
 * @param i - the bigint to convert
 * @returns the buffer
 */
export const bigInt2Buffer = (i: bigint): Buffer => {
    return Buffer.from(i.toString(16), 'hex')
}

/**
 * Create a copy of a bigint array
 * @param arr - the array of bigints to copy
 * @returns a deep copy of the array
 */
export const deepCopyBigIntArray = (arr: bigint[]): bigint[] => {
    return arr.map((x) => BigInt(x.toString()))
}

/**
 * Calcualte the depth of a tree given the number of leaves
 * @param hashLength the hashing function param length
 * @param numLeaves how many leaves
 * @returns the depth
 */
export const calcDepthFromNumLeaves = (
    hashLength: number,
    numLeaves: number,
): number => {
    let depth = 1
    while (true) {
        const max = hashLength ** depth
        if (BigInt(max) >= numLeaves) {
            break
        }
        depth ++
    }

    return depth
}

/**
 * A helper function which hashes a list of results with a salt and returns the
 * hash.
 * @param results A list of values
 * @parm salt A random salt
 * @returns The hash of the leavees and the salt, with the salt last
 */
export const genTreeCommitment = (
    leaves: bigint[],
    salt: bigint,
    depth: number,
): bigint => {
    const tree = new IncrementalQuinTree(depth, BigInt(0), 5, hash5)
    for (const leaf of leaves) {
        tree.insert(leaf)
    }
    return hashLeftRight(tree.root, salt)
}