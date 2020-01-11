// NOTE: The tests use semaphore-merkle-tree instead

const crypto = require('maci-crypto')

class MerkleTree {
  /*  Creates an optimized MerkleTree with `treeDepth` depth,
   *  of which are initialized with the initial value `zeroValue`.
   *
   *  i.e. the 0th level is initialized with `zeroValue`,
   *       and the 1st level is initialized with
   *       hashLeftRight(`zeroValue`, `zeroValue`)
   */
  constructor (depth        , zeroValue        ) {
    this.depth = depth
    this.zeroValue = zeroValue
    this.leaves = [] // Hash value of the leaves
    this.leavesRaw = [] // Raw hash value of the leaves
    this.leafNumber = Math.pow(2, depth)

    // Values to create the hash values of the leaves
    // NOTE: encryptedValues contains values of the encrypted values
    this.encryptedValues = []

    // TODO: WJ suggests that we separate encryption code from Merkle Tree code
 
    // Public keys used to decrypt the encrypted values
    // (decryption key is generated via ecdh)
    this.ecdhPublicKeys = []

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
      this.zeros[i] = crypto.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1])
      this.filledSubtrees[i] = this.zeros[i]
      this.filledPaths[i] = {}
    }

    this.root = crypto.hashLeftRight(
      this.zeros[this.depth - 1],
      this.zeros[this.depth - 1]
    )

    this.nextIndex = 0
  }

  hash (values                  )         {
    if (Array.isArray(values)) {
      return BigInt(multiHash(values.map((x     )         => bigInt(x))))
    }

    return bigInt(multiHash([BigInt(values)]))
  }

  /*  Helper function to hash the left and right values
   *  of the leaves
   */
  hashLeftRight (left        , right        )         {
    return crypto.hashLeftRight(left, right)
  }

  /* Inserts a new value into the merkle tree */
  insert (leaf        , rawValue         ) {
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

      currentLevelHash = crypto.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    this.root = currentLevelHash
    this.leaves.push(leaf)

    if (rawValue === undefined) {
      this.leavesRaw.push(null)
    } else {
      this.leavesRaw.push(rawValue)
    }
  }

  /* Updates merkletree leaf at `leafIndex` with `newLeafValue` */
  update (
    leafIndex        ,
    leaf        ,
    rawValue         
  ) {
    if (leafIndex >= this.nextIndex) {
      throw new Error("Can't update leafIndex which hasn't been inserted yet!")
    }

    // eslint-disable-next-line no-unused-vars
    const [path, _] = this.getPathUpdate(leafIndex)

    this._update(
      leafIndex,
      leaf,
      rawValue,
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
    leafIndex        ,
    leaf        ,
    rawValue        ,
    path               
  ) {
    if (leafIndex >= this.nextIndex) {
      throw new Error("Can't update leafIndex which hasn't been inserted yet!")
    }

    let curIdx = leafIndex
    let currentLevelHash = this.leaves[leafIndex]
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

      currentLevelHash = crypto.hashLeftRight(left, right)
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

      currentLevelHash = crypto.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    this.root = currentLevelHash
    this.leaves[leafIndex] = leaf
    this.leavesRaw[leafIndex] = rawValue || {}
  }

  /*  Gets the path needed to construct a the tree root
   *  Used for quick verification on updates.
   *  Runs in O(log(N)), where N is the number of leaves
   */
  getPathUpdate (leafIndex        )                                 {
    if (leafIndex >= this.nextIndex) {
      throw new Error('Path not constructed yet, leafIndex >= nextIndex')
    }

    let curIdx = leafIndex
    const path = []
    const pathIndex = []

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        path.push(this.filledPaths[i][curIdx + 1])
        pathIndex.push(0)
      } else {
        path.push(this.filledPaths[i][curIdx - 1])
        pathIndex.push(1)
      }
      curIdx = parseInt(curIdx / 2)
    }

    return [path, pathIndex]
  }

  /*  Gets the path needed to construct a the tree root
   *  Used for quick verification on inserts.
   *  Runs in O(log(N)), where N is the number of leaves
   */
  getPathInsert ()                                                {
    let curIdx = this.nextIndex

    const pathIndex = []

    for (let i = 0; i < this.depth; i++) {
      if (curIdx % 2 === 0) {
        pathIndex.push(0)
      } else {
        pathIndex.push(1)
      }
      curIdx = parseInt(curIdx / 2)
    }

    return [
      this.zeros,
      this.filledSubtrees,
      pathIndex
    ]
  }
}

// Helper function to abstract away `new` keyword for API
const createMerkleTree = (
  treeDepth        ,
  zeroValue        
)             => new MerkleTree(treeDepth, zeroValue)


module.exports = {
  createMerkleTree,
  MerkleTree
}
