import * as Artifactor from 'truffle-artifactor'
const poseidonGenContract = require('circomlib/src/poseidon_gencontract.js')
const artifactor = new Artifactor('compiled/')
const SEED = 'poseidon'

const buildPoseidonT3 = async () => {
  await artifactor.save({
    contractName: 'PoseidonT3',
    abi: poseidonGenContract.abi,
    unlinked_binary: poseidonGenContract.createCode(3, 8, 49, SEED),
  })
}

const buildPoseidonT6 = async () => {
  await artifactor.save({
    contractName: 'PoseidonT6',
    abi: poseidonGenContract.abi,
    unlinked_binary: poseidonGenContract.createCode(6, 8, 50, SEED),
  })
}

if (require.main === module) {
  buildPoseidonT3()
  buildPoseidonT6()
}

export { buildPoseidonT3, buildPoseidonT6 }
