const { ethers, overwriteArtifact } = require('hardhat')
const poseidonGenContract = require('circomlib/src/poseidon_gencontract.js')

const buildPoseidon = async (numInputs: number) => {
    await overwriteArtifact(`PoseidonT${numInputs + 1}`, poseidonGenContract.createCode(numInputs))
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
