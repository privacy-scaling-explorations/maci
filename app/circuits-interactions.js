const { createMerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')

const provingKey = require('./circuits/proving_key.json')
const verificationKey = require('./circuits/verification_key.json')
const circuitDef = require('./circuits/circuit.json')

const { Circuit, groth } = require('snarkjs')
const { mimc7 } = require('circomlib')

const zkSnark = groth

const leaf1 = [1n, 2n, 3n, 4n, 5n, 6n]
const leaf2 = [2n, 3n, 4n, 5n, 6n, 7n]
const leaf3 = [3n, 4n, 5n, 6n, 7n, 8n]

// const newLeaf1 = [0n, 0n, 0n, 0n, 42n, 0n]

const merkletree = createMerkleTree(4, 0n)
merkletree.insert(leaf1, [0n, 0n])
merkletree.insert(leaf2, [0n, 0n])
merkletree.insert(leaf3, [0n, 0n])

const leaf = mimc7.multiHash(leaf3)
const [pathElements, pathIndex] = merkletree.getPathUpdate(2)

const circuit = new Circuit(circuitDef)
const circuitInput = {
  leaf: stringifyBigInts(leaf),
  path_elements: stringifyBigInts(pathElements),
  path_index: pathIndex.map(x => x.toString()),
  expected_root: stringifyBigInts(merkletree.root)
}

const witness = circuit.calculateWitness(circuitInput)

console.log(circuit.nOutputs)
const outputRootIdx = circuit.getSignalIdx('main.root')
const calculatedRoot = witness[outputRootIdx]

console.log(`Circuit merkleroot: ${calculatedRoot}`)
console.log(`Actual merkleroot: ${merkletree.root.toString()}`)

const { proof, publicSignals } = zkSnark.genProof(
  unstringifyBigInts(provingKey), witness
)

const isValid = zkSnark.isValid(
  unstringifyBigInts(verificationKey),
  proof,
  publicSignals
)

console.log(`merkletree valid: ${isValid}`)
console.log(publicSignals)
