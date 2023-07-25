import { Contract, Signer } from "ethers";
import { deployConstantInitialVoiceCreditProxy, deployFreeForAllSignUpGatekeeper, deployMaci, deployTopupCredit, deployVerifier, deployVkRegistry } from "../deploy";
import path = require("path");
import { VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-circuits"
import { genProcessVkSig, genTallyVkSig, genDeactivationVkSig } from 'maci-core'
import { compareVks } from "../utils";

jest.setTimeout(2000000)

describe("MACI - E2E", () => {
    // Agents.
    let deployer: Signer;
    let user1: Signer;
    let project1: Signer;
    let project2: Signer;
    let deployerAddress: string;

    // Circuits configs.
    const pollId = 0
    const stateTreeDepth = 10
    const intStateTreeDepth = 1
    const msgTreeDepth = 2
    const voteOptionTreeDepth = 2
    const msgBatchDepth = 1
    const msgQueueSize = 5
    const messageBatchSize = msgQueueSize ** msgBatchDepth

    // Contracts.
    let vkRegistryContract: Contract
    let topUpCreditContract: Contract
    let constantInitialVoiceCreditProxyContract: Contract
    let freeForAllSignUpGatekeeperContract: Contract
    let verifierContract: Contract
    let maciContract: Contract
    let stateAQContract: Contract
    let pollFactoryContract: Contract
    // Contracts Addresses.
    let poseidonT3ContractAddress: string
    let poseidonT4ContractAddress: string
    let poseidonT5ContractAddress: string
    let poseidonT6ContractAddress: string

    // Costants.
    const initialVoiceCredits = 100
    const signUpDeadline = 1692424915 // The deadline for signing up on MACI expressed as unix timestamp in seconds.
    const deactivationPeriod = 86400 // The length of the deactivation period in ms.

    // zkeys folder path.
    const zKeysPath = `${__dirname}../../../../cli/zkeys`
    const zKeyPostfix = "test"
    // zkeys filenames and paths.
    const pmZkeyName = `ProcessMessages_${stateTreeDepth}-${msgTreeDepth}-${msgBatchDepth}-${voteOptionTreeDepth}_${zKeyPostfix}`
    const tvZkeyName = `TallyVotes_${stateTreeDepth}-${intStateTreeDepth}-${voteOptionTreeDepth}_${zKeyPostfix}`
    // const spbZkeyName = `SubsidyPerBatch_${stateTreeDepth}-${intStateTreeDepth}-${voteOptionTreeDepth}_${zKeyPostfix}` // subsidy x batch.
    const pdmZkeyName = `ProcessDeactivationMessages_${msgQueueSize}-${stateTreeDepth}_${zKeyPostfix}`
    const pmZkeyFile = path.resolve(`${zKeysPath}/${pmZkeyName}.0.zkey`)
    const tvZkeyFile = path.resolve(`${zKeysPath}/${tvZkeyName}.0.zkey`)
    const pdmZkeyFile = path.resolve(`${zKeysPath}/${pdmZkeyName}.0.zkey`)

    // Vkeys.
    let pmVk: VerifyingKey
    let tvVk: VerifyingKey
    let pdmVk: VerifyingKey
    let pmVkOnChain: VerifyingKey
    let tvVkOnChain: VerifyingKey
    let pdmVkOnChain: VerifyingKey

    // Test configs.
    // quiet = true - avoid console.log from deploy methods.
    // debug = false - avoid console.log from test case.
    const quiet = true
    const debug = false

    it("should initialize MACI infrastructure", async () => {
        vkRegistryContract = await deployVkRegistry(quiet)

        // DEBUG.
        if (debug)
            console.log('VkRegistry: ', vkRegistryContract.address)

        // extract verification keys.
        pmVk = VerifyingKey.fromObj(extractVk(pmZkeyFile))
        tvVk = VerifyingKey.fromObj(extractVk(tvZkeyFile))
        pdmVk = VerifyingKey.fromObj(extractVk(pdmZkeyFile))

        // Query the contract to check if the pmVk, tvVk and pdmVk have already been set.
        const pmVkSig = genProcessVkSig(
            stateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize,
        )
        const tvVkSig = genTallyVkSig(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth,
        )
        const pdmVkSig = genDeactivationVkSig(
            stateTreeDepth,
            msgTreeDepth
        )

        const isPmVkSet = await vkRegistryContract.isProcessVkSet(pmVkSig)
        const isTvVkSet = await vkRegistryContract.isTallyVkSet(tvVkSig)
        const isPdmVkSet = await vkRegistryContract.isProcessVkSet(pdmVkSig)

        expect(isPmVkSet).toBe(false)
        expect(isTvVkSet).toBe(false)
        expect(isPdmVkSet).toBe(false)

        // Set VKeys.
        const tx = await vkRegistryContract.setVerifyingKeys(
            stateTreeDepth,
            intStateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize,
            pmVk.asContractParam(),
            pdmVk.asContractParam(),
            tvVk.asContractParam()
        )
        const receipt = await tx.wait()
        expect(receipt.status).toBe(1)

        // Checks.
        pmVkOnChain = await vkRegistryContract.getProcessVk(
            stateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize
        )

        tvVkOnChain = await vkRegistryContract.getTallyVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth
        )

        pdmVkOnChain = await vkRegistryContract.getProcessDeactivationVk(
            stateTreeDepth,
            msgTreeDepth
        )

        // DEBUG.
        if (debug) {
            console.log("pmVkOnChain: ", pmVkOnChain)
            console.log("tvVkOnChain: ", tvVkOnChain)
            console.log("pdmVkOnChain: ", pdmVkOnChain)
        }

        // Create.
        topUpCreditContract = await deployTopupCredit(quiet)
        constantInitialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(initialVoiceCredits, quiet)
        freeForAllSignUpGatekeeperContract = await deployFreeForAllSignUpGatekeeper(quiet)
        verifierContract = await deployVerifier(quiet)

        const data =
            await deployMaci(
                freeForAllSignUpGatekeeperContract.address,
                constantInitialVoiceCreditProxyContract.address,
                verifierContract.address,
                vkRegistryContract.address,
                topUpCreditContract.address,
                signUpDeadline,
                deactivationPeriod,
                quiet
            );
        maciContract = data.maciContract
        pollFactoryContract = data.pollFactoryContract
        stateAQContract = data.stateAqContract
        poseidonT3ContractAddress = data.poseidonAddrs[0]
        poseidonT4ContractAddress = data.poseidonAddrs[1]
        poseidonT5ContractAddress = data.poseidonAddrs[2]
        poseidonT6ContractAddress = data.poseidonAddrs[3]

        // DEBUG.
        if (debug) {
            console.log('TopUpCredit: ', topUpCreditContract.address)
            console.log('CostantInitialVoiceCreditProxyContract: ', constantInitialVoiceCreditProxyContract.address)
            console.log('FreeForAllSignUpGatekeeperContract: ', freeForAllSignUpGatekeeperContract.address)
            console.log('VerifierContract: ', verifierContract.address)
            console.log('MACI: ', maciContract.address)
            console.log('StateAQContract: ', stateAQContract.address)
            console.log('PollFactoryContract: ', pollFactoryContract.address)
            console.log('PoseidonT3Contract: ', poseidonT3ContractAddress)
            console.log('PoseidonT4Contract: ', poseidonT4ContractAddress)
            console.log('PoseidonT5Contract: ', poseidonT5ContractAddress)
            console.log('PoseidonT6Contract: ', poseidonT6ContractAddress)
        }
    })
})