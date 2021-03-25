interface SnarkProof {
    pi_a: BigInt[];
    pi_b: BigInt[][];
    pi_c: BigInt[];
}

import {
    deployMaci,
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
) => {
    const mockVerifierContract = await deployMockVerifier()
    const freeForAllSignUpGatekeeperContract = await deployFreeForAllSignUpGatekeeper()
    const constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
        initialVoiceCreditBalance,
    )

    const contracts = await deployMaci(
        freeForAllSignUpGatekeeperContract.address,
        constantIntialVoiceCreditProxyContract.address,
        mockVerifierContract.address,
    )

    const maciContract = contracts.maciContract
    const stateAqContract = contracts.stateAqContract
    const vkRegistryContract = contracts.vkRegistryContract
    const pptContract = contracts.pptContract

    return {
        mockVerifierContract,
        freeForAllSignUpGatekeeperContract,
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
