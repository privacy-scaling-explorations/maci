import { compileAndLoadCircuit } from '.'
import { stringifyBigInts, genRandomSalt, hashLeftRight } from 'maci-crypto'
import { mimcsponge, poseidon } from 'circomlib'

const poseidonT = (t: number) => poseidon.createHash(t, 8, 57, 'poseidon')

// mimcsponge setting

const profileCircuit = (circuit, circuitInputs) => {
  const start = process.hrtime.bigint()
  const witness = circuit.calculateWitness(circuitInputs)
  const end = process.hrtime.bigint()

  console.log('circuit.nConstraints', circuit.nConstraints)
  console.log(`Benchmark took ${end - start} nanoseconds`)
  console.log('--------------------------')
  return witness
}

const profileHasherN = async (n, circuit) => {
  const preImages = Array.from({ length: n }, () => genRandomSalt())
  const key = 0
  const circuitInputs = stringifyBigInts({ in: preImages, key })

  console.log('Hasher', n)
  const witness = profileCircuit(circuit, circuitInputs)

  // perform checks
  console.assert(circuit.checkWitness(witness))
  const outputIdx = circuit.getSignalIdx('main.hash')
  const output = witness[outputIdx]
  const outputJS = mimcsponge.multiHash(preImages, key, 1)
  console.assert(output.toString() === outputJS.toString())
}

const profileHasherNPoseidon = async (n, circuit) => {
  const preImages = Array.from({ length: n }, () => genRandomSalt())
  const circuitInputs = stringifyBigInts({ in: preImages })

  console.log('Hasher', n)
  const witness = profileCircuit(circuit, circuitInputs)

  // perform checks
  console.assert(circuit.checkWitness(witness))
  const outputIdx = circuit.getSignalIdx('main.hash')
  const output = witness[outputIdx]
  const outputJS = poseidonT(n + 1)(preImages)
  console.assert(output.toString() === outputJS.toString())
}

const profileHashLeftRight = async (circuit, check) => {
  const [left, right] = [genRandomSalt(), genRandomSalt()]

  const circuitInputs = stringifyBigInts({ left, right })

  console.log('HashLeftRight')
  const witness = profileCircuit(circuit, circuitInputs)

  // perform checks
  console.assert(circuit.checkWitness(witness))
  const outputIdx = circuit.getSignalIdx('main.hash')
  const output = witness[outputIdx]
  const outputJS = check(left, right)
  console.assert(output.toString() === outputJS.toString())
}

const HashLeftRightPoseidon = (left, right) => poseidonT(3)([left, right])

const main = async () => {
  const hasher5 = await compileAndLoadCircuit('hasher5_test.circom')
  const hasher10 = await compileAndLoadCircuit('hasher10_test.circom')
  const hashLeftRightCircuit = await compileAndLoadCircuit('hashLeftRight_test.circom')

  const hasher5Poseidon = await compileAndLoadCircuit('hasher5Poseidon_test.circom')
  const hasher10Poseidon = await compileAndLoadCircuit('hasher10Poseidon_test.circom')
  const hashLeftRightPoseidon = await compileAndLoadCircuit('hashLeftRightPoseidon_test.circom')

  console.log('=========MIMC=============')

  await profileHasherN(5, hasher5)
  await profileHasherN(10, hasher10)
  await profileHashLeftRight(hashLeftRightCircuit, hashLeftRight)

  console.log('=========Poseidon=========')

  await profileHasherNPoseidon(5, hasher5Poseidon)
  await profileHasherNPoseidon(10, hasher10Poseidon)
  await profileHashLeftRight(hashLeftRightPoseidon, HashLeftRightPoseidon)
}

main()
