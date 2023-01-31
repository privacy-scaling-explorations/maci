interface SnarkProof {
    pi_a: BigInt[];
    pi_b: BigInt[][];
    pi_c: BigInt[];
}

import {
    deployVkRegistry,
    deployTopupCredit,
    deployMaci,
    deployMockVerifier,
    deployContract,
    deployFreeForAllSignUpGatekeeper,
    deployConstantInitialVoiceCreditProxy,
} from './'

const formatProofForVerifierContract = (
    _proof: SnarkProof,
) => {

    return ([
        _proof.pi_a[0],
        _proof.pi_a[1],

        _proof.pi_b[0][1],
        _proof.pi_b[0][0],
        _proof.pi_b[1][1],
        _proof.pi_b[1][0],

        _proof.pi_c[0],
        _proof.pi_c[1],
    ]).map((x) => x.toString())
}

const deployTestContracts = async (
    initialVoiceCreditBalance,
    gatekeeperContract?
) => {
    const mockVerifierContract = await deployMockVerifier()

    if (!gatekeeperContract) {
        gatekeeperContract = await deployFreeForAllSignUpGatekeeper()
    }

    const constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
        initialVoiceCreditBalance,
    )

    const mpContract = await deployContract('MessageProcessor', true, mockVerifierContract.address)
    // VkRegistry
    const vkRegistryContract = await deployVkRegistry()
    const topupCreditContract = await deployTopupCredit()

    const contracts = await deployMaci(
        gatekeeperContract.address,
        constantIntialVoiceCreditProxyContract.address,
        mockVerifierContract.address,
        vkRegistryContract.address,
        topupCreditContract.address
    )

    const maciContract = contracts.maciContract
    const stateAqContract = contracts.stateAqContract

    return {
        mockVerifierContract,
        gatekeeperContract,
        constantIntialVoiceCreditProxyContract,
        maciContract,
        stateAqContract,
        vkRegistryContract,
        mpContract,
    }
}

export {
    deployTestContracts,
    formatProofForVerifierContract,
}
