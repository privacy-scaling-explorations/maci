// @flow
const { mimc7 } = require('circomlib')

const randomHash = (): BigInt => mimc7.hash(BigInt(parseInt(Math.random() * 1000)), 0)

const Zero = BigInt(0)
const K = BigInt(21888242871839275222246405745257275088548364400416034343698204186575808495617)

// Main MerkleTree object
const merkleTree = {
  root: Zero,
  treeLeaves: [],
  zeros: [],
  filledSubtrees: []
}

const treeLevel = 3
let nextIndex = 0

const hashLeftRight = (l: BigInt, r: BigInt): BigInt => {
  let temp

  temp = l % K
  temp = mimc7.hash(temp, 0)
  temp = temp + r % K
  temp = mimc7.hash(temp, 0)

  return temp
}

const insert = (leaf: BigInt) => {
  let curIdx = nextIndex
  nextIndex += 1

  let curLevelHash = leaf
  let left
  let right

  for (let i = 0; i < treeLevel; i++) {
    if (curIdx % 2 === 0) {
      left = curLevelHash
      right = merkleTree.zeros[i]

      merkleTree.filledSubtrees[i] = curLevelHash
    } else {
      left = merkleTree.filledSubtrees[i]
      right = curLevelHash
    }

    curLevelHash = hashLeftRight(left, right)

    curIdx = parseInt(curIdx / 2)
  }

  merkleTree.root = curLevelHash
  merkleTree.treeLeaves.push(leaf)
}

const update = (
  oldLeaf: BigInt,
  newLeaf: BigInt,
  leafIdx: Number,
  oldPath: Array<BigInt>,
  newPath: Array<BigInt>
) => {
  let curIdx = leafIdx

  let curLevelHash = oldLeaf
  let left
  let right

  for (let i = 0; i < treeLevel; i++) {
    if (curIdx % 2 === 0) {
      left = curLevelHash
      right = oldPath[i]
    } else {
      left = oldPath[i]
      right = curLevelHash
    }

    curLevelHash = hashLeftRight(left, right)
    curIdx = parseInt(curIdx / 2)
  }

  if (merkleTree.root !== curLevelHash) {
    throw new Error('Tree root mismatch')
  }

  curIdx = leafIdx
  curLevelHash = newLeaf

  for (let i = 0; i < treeLevel; i++) {
    if (curIdx % 2 === 0) {
      left = curLevelHash
      right = newPath[i]
    } else {
      left = newPath[i]
      right = curLevelHash
    }

    curLevelHash = hashLeftRight(left, right)
    curIdx = parseInt(curIdx / 2)
  }

  merkleTree.root = curLevelHash
  merkleTree.treeLeaves[leafIdx] = newLeaf
}

// Initialization
merkleTree.zeros = Array(treeLevel).fill(0)
merkleTree.zeros[0] = randomHash() // Zero-th value

merkleTree.filledSubtrees = Array(treeLevel).fill(0)
merkleTree.filledSubtrees[0] = merkleTree.zeros[0]

for (let i = 1; i < treeLevel; i++) {
  merkleTree.zeros[i] = hashLeftRight(
    merkleTree.zeros[i - 1],
    merkleTree.zeros[i - 1]
  )
  merkleTree.filledSubtrees[i] = merkleTree.zeros[i]
}

merkleTree.root = hashLeftRight(
  merkleTree.zeros[treeLevel - 1],
  merkleTree.zeros[treeLevel - 1]
)

const i1 = randomHash()
const i2 = randomHash()

console.log(merkleTree)

insert(i1)

console.log(merkleTree)

update(
  i1, i2, 0, merkleTree.zeros, merkleTree.zeros
)
