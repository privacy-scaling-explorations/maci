interface SnarkProof {
    pi_a: BigInt[];
    pi_b: BigInt[][];
    pi_c: BigInt[];
}

import {
    deployVkRegistry,
    deployMaci,
    deployPpt,
    deployMockVerifier,
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
    const pptContract = await deployPpt(mockVerifierContract.address)

    // VkRegistry
    const vkRegistryContract = await deployVkRegistry()
    await vkRegistryContract.deployTransaction.wait()

    const contracts = await deployMaci(
        gatekeeperContract.address,
        constantIntialVoiceCreditProxyContract.address,
        mockVerifierContract.address,
        vkRegistryContract.address,
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
        pptContract,
    }
}

export {
    deployTestContracts,
    formatProofForVerifierContract,
}
