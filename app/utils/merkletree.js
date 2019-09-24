// @flow
const { mimc7 } = require('circomlib')

class MerkleTreeClass {
  constructor (treeLevel: Number, zeroValue: BigInt) {
    this.treeLevel = treeLevel
    this.zeroValue = zeroValue
    this.treeLeaves = []

    this.zeros = {
      0: zeroValue
    }
    this.filledSubtrees = {
      0: zeroValue
    }
    this.filledPaths = {
      0: {}
    }

    for (let i = 1; i < treeLevel; i++) {
      this.zeros[i] = this.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1])
      this.filledSubtrees[i] = this.zeros[i]
      this.filledPaths[i] = {}
    }

    this.treeRoot = this.hashLeftRight(
      this.zeros[this.treeLevel - 1],
      this.zeros[this.treeLevel - 1]
    )

    this.nextIndex = 0
    this.treeLeaves.push(BigInt(0))
  }

  hashLeftRight (left: BigInt, right: BigInt): BigInt {
    const k = BigInt(21888242871839275222246405745257275088548364400416034343698204186575808495617)
    let R = BigInt(0)

    R = R + left % k
    R = mimc7.hash(R, BigInt(0))

    R = R + right % k
    R = mimc7.hash(R, BigInt(0))

    return R
  }

  insert (leaf: BigInt) {
    let curIdx = this.nextIndex
    this.nextIndex += 1

    let currentLevelHash = leaf
    let left
    let right

    for (let i = 0; i < this.treeLevel; i++) {
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

    this.treeRoot = currentLevelHash
    this.treeLeaves.push(leaf)
  }

  update (
    oldLeaf: BigInt,
    leaf: BigInt,
    leafIndex: Number,
    oldPath: Array<BigInt>,
    path: Array<BigInt>
  ) {
    let curIdx = leafIndex
    let currentLevelHash = oldLeaf
    let left
    let right

    for (let i = 0; i < this.treeLevel; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = oldPath[i]
      } else {
        left = oldPath[i]
        right = currentLevelHash
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    console.log('successful!')

    if (this.treeRoot !== currentLevelHash) {
      throw new Error('MerkleTree: tree root / current level has mismatch')
    }

    curIdx = leafIndex
    currentLevelHash = leaf

    for (let i = 0; i < this.treeLevel; i++) {
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

    this.treeRoot = currentLevelHash
    this.treeLeaves[leafIndex] = leaf
  }

  getPath (leafIndex: Number): Array<BigInt> {
    let currentLevelHash = this.treeLeaves[leafIndex]
    let curIdx = leafIndex
    let left
    let right

    const path = []

    for (let i = 0; i < this.treeLevel; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = this.filledPaths[i][curIdx + 1]

        path.push(right)
      } else {
        left = this.filledPaths[i][curIdx - 1]
        right = currentLevelHash

        path.push(left)
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    return path
  }

  getNewPath (newLeaf: BigInt, leafIndex: Number): Array<BigInt> {
    let currentLevelHash = newLeaf
    let curIdx = leafIndex
    let left
    let right

    const path = []

    for (let i = 0; i < this.treeLevel; i++) {
      if (curIdx % 2 === 0) {
        left = currentLevelHash
        right = this.filledPaths[i][curIdx + 1]

        path.push(right)
      } else {
        left = this.filledPaths[i][curIdx - 1]
        right = currentLevelHash

        path.push(left)
      }

      currentLevelHash = this.hashLeftRight(left, right)
      curIdx = parseInt(curIdx / 2)
    }

    return path
  }
}

const m = new MerkleTreeClass(4, BigInt(0))

m.insert(BigInt(100))
m.insert(BigInt(2000))

const oldPath = m.getPath(0)
const path = m.getNewPath(BigInt(50), 0)

m.update(
  BigInt(100),
  BigInt(50),
  0,
  oldPath,
  path
)

module.exports = {
}
