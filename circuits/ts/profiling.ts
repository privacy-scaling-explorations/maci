import { compileAndLoadCircuit } from '.'
import { stringifyBigInts, genRandomSalt, hashLeftRight } from 'maci-crypto'
import { mimcsponge } from 'circomlib'

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

const profileHashLeftRight = async circuit => {
  const [left, right] = [genRandomSalt(), genRandomSalt()]

  const circuitInputs = stringifyBigInts({ left, right })

  console.log('HashLeftRight')
  const witness = profileCircuit(circuit, circuitInputs)

  // perform checks
  console.assert(circuit.checkWitness(witness))
  const outputIdx = circuit.getSignalIdx('main.hash')
  const output = witness[outputIdx]
  const outputJS = hashLeftRight(left, right)
  console.assert(output.toString() === outputJS.toString())
}

const main = async () => {
  const hasher5 = await compileAndLoadCircuit('hasher5_test.circom')
  const hasher10 = await compileAndLoadCircuit('hasher10_test.circom')
  const hashLeftRight = await compileAndLoadCircuit('hashleftright_test.circom')
  await profileHasherN(5, hasher5)
  await profileHasherN(10, hasher10)
  await profileHashLeftRight(hashLeftRight)
}

main()
