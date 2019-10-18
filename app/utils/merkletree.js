// @flow
import type { Pool } from 'pg'

const { mimc7 } = require('circomlib')

const { stringifyBigInts, unstringifyBigInts } = require('./helpers')

class MerkleTree {
  /*  Creates an optimized MerkleTree with `treeDepth` depth,
   *  of which are initialized with the initial value `zeroValue`.
   *
   *  i.e. the 0th level is initialized with `zeroValue`,
   *       and the 1st level is initialized with
   *       hashLeftRight(`zeroValue`, `zeroValue`)
   */
  constructor (depth: Number, zeroValue: BigInt) {
    this.depth = depth
    this.zeroValue = zeroValue
    this.leafs = []
    this.leafNumber = Math.pow(2, depth)

    this.zeros = {
      0: zeroValue
    }
    this.filledSubtrees = {
      0: zeroValue
    }
    this.filledPaths = {
      0: {}
    }

    for (let i = 1; i < depth; i++) {
      this.zeros[i] = this.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1])
      this.filledSubtrees[i] = this.zeros[i]
      this.filledPaths[i] = {}
    }

    this.root = this.hashLeftRight(
      this.zeros[this.depth - 1],
      this.zeros[this.depth - 1]
    )

    this.nextIndex = 0
  }

  /*  Helper function to hash the left and right values
   *  of the leafs
   */
  hashLeftRight (left: BigInt, right: BigInt): BigInt {
    return mimc7.multiHash([left, right])
  }

  /* Inserts a new value into the merkle tree */
  insert (leaf: BigInt) {
    let curIdx = this.nextIndex
    this.nextIndex += 1

    let currentLevelHash = leaf
    let left
    let right

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = this.zeros[i]

        this.filledSubtrees[i] = currentLevelHash

        this.filledPaths[i][curIdx] = left
        this.filledPaths[i][curIdx + 1] = right
      } else {
        left = this.filledSubtrees[i]
        right = currentLevelHash

        this.filledPaths[i][curIdx - 1] = left
        this.filledPaths[i][curIdx] = right
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    this.root = currentLevelHash
    this.leafs.push(leaf)
  }

  /* Updates merkletree leaf at `leafIndex` with `newLeafValue` */
  update (leafIndex: Number, newLeafValue: BigInt) {
    if (leafIndex >= this.nextIndex) {
      throw new Error("Can't update leafIndex which hasn't been inserted yet!")
    }

    // eslint-disable-next-line no-unused-vars
    const [path, _] = this.getPath(leafIndex)

    this._update(
      leafIndex,
      newLeafValue,
      path
    )
  }

  /*  _Verbose_ API to update the value of the leaf in the current tree.
   *  The reason why its so verbose is because I wanted to maintain compatibility
   *  with the merkletree smart contract obtained from semaphore.
   *  (https://github.com/kobigurk/semaphore/blob/2933bce0e41c6d4df82b444b66b4e84793c90893/semaphorejs/contracts/MerkleTreeLib.sol)
   *  It is also very expensive to update if we do it naively on the EVM
   */
  _update (
    leafIndex: Number,
    leaf: BigInt,
    path: Array<BigInt>
  ) {
    if (leafIndex >= this.nextIndex) {
      throw new Error("Can't update leafIndex which hasn't been inserted yet!")
    }

    let curIdx = leafIndex
    let currentLevelHash = this.leafs[leafIndex]
    let left
    let right

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = path[i]
      } else {
        left = path[i]
        right = currentLevelHash
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    if (this.root !== currentLevelHash) {
      throw new Error('MerkleTree: tree root / current level has mismatch')
    }

    curIdx = leafIndex
    currentLevelHash = leaf

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = path[i]

        this.filledPaths[i][curIdx] = left
        this.filledPaths[i][curIdx + 1] = right
      } else {
        left = path[i]
        right = currentLevelHash

        this.filledPaths[i][curIdx - 1] = left
        this.filledPaths[i][curIdx] = right
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    this.root = currentLevelHash
    this.leafs[leafIndex] = leaf
  }

  /*  Gets the path needed to construct a the tree root
   *  Used for quick verification on updates.
   *  Runs in O(log(N)), where N is the number of leafs
   */
  getPath (leafIndex: Number): [Array<BigInt>, Array<Number>] {
    if (leafIndex >= this.nextIndex) {
      throw new Error('Path not constructed yet, leafIndex >= nextIndex')
    }

    let curIdx = leafIndex
    const path = []
    const pathPos = []

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        path.push(this.filledPaths[i][curIdx + 1])
        pathPos.push(0)
      } else {
        path.push(this.filledPaths[i][curIdx - 1])
        pathPos.push(1)
      }
      curIdx = parseInt(curIdx / 2)
    }

    return [path, pathPos]
  }
}

// Helper function to abstract away `new` keyword for API
const createMerkleTree = (
  treeDepth: Number,
  zeroValue: BigInt
): MerkleTree => new MerkleTree(treeDepth, zeroValue)

// Helper function to save merkletree into a database
const saveMerkleTreeToDb = async (
  pool: Pool,
  mkName: String,
  mk: MerkleTree,
) => {
  // See if there's alrea
  const query = {
    text: `INSERT INTO
      merkletrees(
        name,
        depth,
        next_index,
        root,
        zero_value,
        zeros,
        filled_sub_trees,
        filled_paths
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) ON CONFLICT (name) DO UPDATE SET
        name = excluded.name,
        depth = excluded.depth,
        next_index = excluded.next_index,
        root = excluded.root,
        zero_value = excluded.zero_value,
        zeros = excluded.zeros,
        filled_sub_trees = excluded.filled_sub_trees,
        filled_paths = excluded.filled_paths
      ;`,
    values: [
      mkName,
      mk.depth,
      mk.nextIndex,
      stringifyBigInts(mk.root),
      stringifyBigInts(mk.zeroValue),
      stringifyBigInts(mk.zeros),
      stringifyBigInts(mk.filledSubtrees),
      stringifyBigInts(mk.filledPaths)
    ]
  }

  try {
    await pool.query(query)
  } catch (e) {
    console.log(`Error: ${e}`)
  }
}

// Help function to load merkletree from a database
const loadMerkleTreeFromDb = async (
  pool: Pool,
  mkName: String,
): MerkleTree => {
  const query = {
    text: 'SELECT * FROM merkletrees WHERE name = $1 LIMIT 1',
    values: [mkName]
  }
  const results = await pool.query(query)

  if (results.rows.length === 0) {
    throw new Error(`MerkleTree named ${mkName} not found in database`)
  }

  const res = results.rows[0]
  const resBigInt = unstringifyBigInts(results.rows[0])

  const mk = createMerkleTree(
    res.depth,
    resBigInt.zero_value
  )

  mk.nextIndex = res.next_index
  mk.root = resBigInt.root
  mk.zeros = resBigInt.zeros
  mk.filledSubtrees = resBigInt.filled_sub_trees
  mk.filledPaths = resBigInt.filled_paths

  return mk
}

module.exports = {
  createMerkleTree,
  saveMerkleTreeToDb,
  loadMerkleTreeFromDb
}
