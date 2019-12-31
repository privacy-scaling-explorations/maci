const path = require('path')
const { assert } = require('chai')
const compiler = require('circom')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { Circuit } = require('snarkjs')
const { hashLeftRight, randomPrivateKey } = require('../_build/utils/crypto')
const { createMerkleTree } = require('../_build/utils/merkletree')
const { multiHash } = require('../_build/utils/crypto')

const ZERO_VALUE = 0

describe('Quadratic vote tallying circuit', () => {
  it('CalculateTotal', async () => {
  const circuitDef = await compiler(path.join(__dirname, 'calculateTotal_test.circom'))
  const circuit = new Circuit(circuitDef)

  const nums = [3, 3, 3, 3, 2, 4]
  const sum = nums.reduce((a, b) => a + b, 0)

  const circuitInputs = {}
  for (let i=0; i < nums.length; i++) {
  circuitInputs['nums[' + i.toString() + ']'] = nums[i].toString()
  }

  const witness = circuit.calculateWitness(circuitInputs)
  const resultIdx = circuit.getSignalIdx('main.sum')
  const result = witness[resultIdx]
  assert.equal(result.toString(), sum.toString())
  })

  it('QuadVoteTally', async () => {
    // Set inputs
    let circuitInputs = {}

    // as set in quadVoteTally_test.circom
    const fullStateTreeDepth = 4
    const intermediateStateTreeDepth = 2
    const voteOptionTreeDepth = 3
    const messageLength = 5
    const numUsers = 2 ** intermediateStateTreeDepth
    const numVoteOptions = 2 ** voteOptionTreeDepth

    const salt = randomPrivateKey()

    // The depth at which the intermediate state tree leaves exist in the full state tree
    const k = fullStateTreeDepth - intermediateStateTreeDepth

    // The batch #
    for (let intermediatePathIndex = 0; intermediatePathIndex < 2 ** k; intermediatePathIndex ++) {

      // Generate sample votes
      let voteLeaves = []
      for (let i = 0; i < 2 ** fullStateTreeDepth; i++) {
        const votes = []
        for (let j = 0; j < numVoteOptions; j++) {
          votes.push(Math.round(Math.random() * 10))
        }
        voteLeaves.push(votes)
      }

      const fullStateTree = createMerkleTree(fullStateTreeDepth, ZERO_VALUE)

      let rawStateLeaves = []
      let voteOptionTrees = []

      // Populate the state tree
      for (let i = 0; i < 2 ** fullStateTreeDepth; i++) {

        // Insert the vote option leaves to calculate the voteOptionRoot
        const voteOptionMT = createMerkleTree(voteOptionTreeDepth, ZERO_VALUE)

        for (let j = 0; j < voteLeaves[i].length; j++) {
          voteOptionMT.insert(voteLeaves[i][j])
        }

        const rawStateLeaf = [0, 0, voteOptionMT.root, 0, 0]
        rawStateLeaves.push(rawStateLeaf)

        // Insert the state leaf
        fullStateTree.insert(multiHash(rawStateLeaf))
      }

      // The leaves of the intermediate state tree (which are the roots of each batch)
      let intermediateLeaves = []
      const batchSize = 2 ** intermediateStateTreeDepth

      // Compute the Merkle proof for the batch
      const intermediateStateTree = createMerkleTree(k, ZERO_VALUE)

      // For each batch, create a tree of the leaves in the batch, and insert the
      // tree root into another tree
      for (let i = 0; i < fullStateTree.leaves.length; i += batchSize) {
        const tree = createMerkleTree(intermediateStateTreeDepth, ZERO_VALUE)
        for (let j = 0; j < batchSize; j++) {
          tree.insert(fullStateTree.leaves[i + j])
        }
        intermediateLeaves.push(tree.root)

        intermediateStateTree.insert(tree.root)
      }

      const intermediatePathElements = intermediateStateTree.getPathUpdate(intermediatePathIndex)[0]

      for (let i = 0; i < intermediatePathElements.length; i++) {
        circuitInputs['intermediatePathElements[' + i + ']'] = stringifyBigInts(intermediatePathElements[i])
      }

      for (let i = 0; i < batchSize; i++) {
        for (let j = 0; j < numVoteOptions; j++) {
          circuitInputs['voteLeaves[' + i + '][' + j + ']'] = stringifyBigInts(voteLeaves[intermediatePathIndex * batchSize + i][j])
        }

        for (let j = 0; j < messageLength; j++) {
          circuitInputs['stateLeaves[' + i + '][' + j + ']'] = stringifyBigInts(rawStateLeaves[intermediatePathIndex * batchSize + i][j])
        }
      }

      for (let i = 0; i < numVoteOptions; i++) {
        circuitInputs['currentResults[' + i + ']'] = stringifyBigInts(0)
      }

      circuitInputs['fullStateRoot'] = stringifyBigInts(fullStateTree.root)
      circuitInputs['intermediateStateRoot'] = stringifyBigInts(intermediateStateTree.leaves[intermediatePathIndex])
      circuitInputs['intermediatePathIndex'] = stringifyBigInts(intermediatePathIndex)
      circuitInputs['salt'] = stringifyBigInts(salt)

      // Compile circuit
      const circuitDef = await compiler(path.join(__dirname, 'quadVoteTally_test.circom'))
      const circuit = new Circuit(circuitDef)

      const witness = circuit.calculateWitness(circuitInputs)

      let expected = []
      for (let i = 0; i < numVoteOptions; i++) {

        let subtotal = 0
        for (let j = 0; j < batchSize; j++){
          if (j === 0 && intermediatePathIndex === 0) {
            continue
          }
          subtotal += voteLeaves[intermediatePathIndex * batchSize + j][i]
        }

        expected.push(subtotal)

      }

      const result = witness[circuit.getSignalIdx('main.newResultsCommitment')]
      const expectedCommitment = multiHash([...expected, salt])
      assert.equal(result.toString(), expectedCommitment.toString())
    }

  })
})
