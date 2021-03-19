import * as Artifactor from 'truffle-artifactor'

const poseidonGenContract = require('circomlib/src/poseidon_gencontract.js')
const artifactor = new Artifactor('artifacts/')

const buildPoseidon = async (numInputs: number) => {
    await artifactor.save({
        contractName: `PoseidonT${numInputs + 1}`,
        abi: poseidonGenContract.generateABI(numInputs),
        unlinked_binary: poseidonGenContract.createCode(numInputs)
    })
}

const buildPoseidonT3 = () => buildPoseidon(2)
const buildPoseidonT4 = () => buildPoseidon(3)
const buildPoseidonT5 = () => buildPoseidon(4)
const buildPoseidonT6 = () => buildPoseidon(5)

if (require.main === module) {
    buildPoseidonT3()
    buildPoseidonT4()
    buildPoseidonT5()
    buildPoseidonT6()
}

export {
    buildPoseidonT3,
    buildPoseidonT4,
    buildPoseidonT5,
    buildPoseidonT6,
}
