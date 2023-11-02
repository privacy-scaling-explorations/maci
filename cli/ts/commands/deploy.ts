import { banner } from "../utils/banner"
import { readContractAddress, storeContractAddress } from "../utils/storage"
import { 
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployVerifier,
    deployMaci,
    deployTopupCredit
 } from "maci-contracts"
import { logError, logGreen, success, DeployArgs, DEFAULT_INITIAL_VOICE_CREDITS, DeployedContracts } from "../utils/"

/**
 * Deploy MACI and related contracts
 * @param vkRegistryAddress 
 * @param initialVoiceCredits 
 * @param initialVoiceCreditsProxyAddress 
 * @param signupGatekeeperAddress
 * @param quiet
 * @returns the addresses of the deployed contracts
 */
export const deploy = async ({
    vkRegistryAddress,
    initialVoiceCredits,
    initialVoiceCreditsProxyAddress,
    signupGatekeeperAddress,
    quiet
}: DeployArgs): Promise<DeployedContracts> => {
    if(!quiet) banner()
    // check if we have a vkRegistry already deployed or passed as arg
    const vkRegistryContractAddress = readContractAddress("VkRegistry")
    if (!vkRegistryContractAddress && !vkRegistryAddress) {
        logError("Please provide a VkRegistry contract address")
    }

    const vkRegistry = vkRegistryAddress ? vkRegistryAddress: vkRegistryContractAddress

    if (initialVoiceCreditsProxyAddress && initialVoiceCredits) {
        logError("Please provide either an initialVoiceCreditProxyAddress or initialVoiceCredits, not both")
    }

    // if we did not deploy it before, then deploy it now
    let initialVoiceCreditProxyContractAddress: string 
    if (!initialVoiceCreditsProxyAddress) {
        const contract = await deployConstantInitialVoiceCreditProxy(
            initialVoiceCredits ? initialVoiceCredits: DEFAULT_INITIAL_VOICE_CREDITS,
            true
        )

        initialVoiceCreditProxyContractAddress = contract.address
    }

    // check if we have a signupGatekeeper already deployed or passed as arg
    let signupGatekeeperContractAddress = readContractAddress("SignUpGatekeeper")
    if (!signupGatekeeperContractAddress && !signupGatekeeperAddress) {
        const contract = await deployFreeForAllSignUpGatekeeper(true)
        signupGatekeeperContractAddress = contract.address
    }

    // deploy a verifier contract
    const verifierContract = await deployVerifier(true)

    // topup credit 
    const topUpCredit = await deployTopupCredit(true)

    // deploy MACI, stateAq, PollFactory and poseidon 
    const {
        maciContract,
        stateAqContract,
        pollFactoryContract,
        poseidonAddrs
    } = await deployMaci(
        signupGatekeeperContractAddress,
        initialVoiceCreditProxyContractAddress,
        verifierContract.address,
        vkRegistry,
        topUpCredit.address,
        10,
        true
    )

    // save to the JSON File 
    storeContractAddress("InitialVoiceCreditProxy", initialVoiceCreditProxyContractAddress)
    storeContractAddress("SignUpGatekeeper", signupGatekeeperContractAddress)
    storeContractAddress("Verifier", verifierContract.address)
    storeContractAddress("MACI", maciContract.address)
    storeContractAddress("StateAq", stateAqContract.address)
    storeContractAddress("PollFactory", pollFactoryContract.address)
    storeContractAddress("TopupCredit", topUpCredit.address)
    storeContractAddress("PoseidonT3", poseidonAddrs[0])
    storeContractAddress("PoseidonT4", poseidonAddrs[1])
    storeContractAddress("PoseidonT5", poseidonAddrs[2])
    storeContractAddress("PoseidonT6", poseidonAddrs[3])

    if (!quiet) {
        logGreen(
            success(`MACI deployed at:  ${maciContract.address}`),
        )
    }

    return {
        maciAddress: maciContract.address,
        stateAqAddress: stateAqContract.address,
        pollFactoryAddress: pollFactoryContract.address,
        verifierAddress: verifierContract.address,
        topupCreditAddress: topUpCredit.address,
        poseidonT3Address: poseidonAddrs[0],
        poseidonT4Address: poseidonAddrs[1],
        poseidonT5Address: poseidonAddrs[2],
        poseidonT6Address: poseidonAddrs[3],
        signUpGatekeeperAddress: signupGatekeeperContractAddress,
        initialVoiceCreditProxyAddress: initialVoiceCreditProxyContractAddress
    }
}