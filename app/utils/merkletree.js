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

    for (let i = 1; i < treeLevel; i++) {
      this.zeros[i] = this.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1])
      this.filledSubtrees[i] = this.zeros[i]
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
        right = this.zeros[i] || this.zeroValue
      } else {
        left = this.filledSubtrees[i] || this.zeroValue
        right = currentLevelHash
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

    if (this.treeRoot !== currentLevelHash) {
      throw new Error('MerkleTree: tree root / current level has mismatch')
    }

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
}

const m = new MerkleTreeClass(7, BigInt(0))

console.log(m.hashLeftRight(BigInt(0), BigInt(0)))

module.exports = {
}
