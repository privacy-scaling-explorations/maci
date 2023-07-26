import { Contract, Signer, ethers, getDefaultProvider } from "ethers";
import { deployConstantInitialVoiceCreditProxy, deployFreeForAllSignUpGatekeeper, deployMaci, deployMessageProcessor, deployTally, deployTopupCredit, deployVerifier, deployVkRegistry, getDefaultSigner, parseArtifact } from "../deploy";
import path = require("path");
import { Keypair, Message, PCommand, PubKey, VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-circuits"
import { genProcessVkSig, genTallyVkSig, genDeactivationVkSig } from 'maci-core'
import { compareVks } from "../utils";
import { timeTravel, validateSaltFormat, validateSaltSize } from "./utils";
import { MaciState } from "maci-core"
// import { genRandomSalt } from "maci-crypto";
jest.setTimeout(2000000)

describe("MACI - E2E", () => {
    // Agents.
    let signer: Signer;
    let user1: Signer;
    let project1: Signer;
    let project2: Signer;
    let provider: ethers.providers.Provider

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
    let messageProcessorContract: Contract
    let tallyContract: Contract
    let pollContract: Contract
    // Contracts Addresses.
    let poseidonT3ContractAddress: string
    let poseidonT4ContractAddress: string
    let poseidonT5ContractAddress: string
    let poseidonT6ContractAddress: string

    // Costants.
    const initialVoiceCredits = 100
    const signUpDuration = 86400 // The sign up period duration expressed in seconds.
    const signUpDeadline = Math.floor(new Date().getTime() / 1000) + (signUpDuration) // The deadline for signing up on MACI expressed as unix timestamp in seconds.
    const deactivationPeriod = 86400 // The length of the deactivation period in seconds.
    const pollDuration = 90 // The Poll duration expressed in seconds.
    const maxMessages = 25 // The max number of supported messages.
    const maxVoteOptions = 25 // The max number of supported vote options.
    const seed = 42 // Random generator seed value used for masking values during the message deactivation processing.
    const fromBlock = 0 // Indicates which block to start from to find events.

    const maciState = new MaciState(); // A reproduction of MACI on-chain state.

    // Keys.
    let coordinatorKeyPair: Keypair
    let user1KeyPair: Keypair

    // Data from contracts interactions.
    let userStateIndex: Number

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
    /// @dev quiet = true - avoid console.log from deploy methods.
    /// @dev debug = false - avoid console.log from test case.
    const quiet = true
    const debug = false

    beforeAll(async () => {
        // Get default signer and provider.
        signer = await getDefaultSigner();
        provider = signer.provider
    })

    it("should initialize MACI infrastructure", async () => {
        vkRegistryContract = await deployVkRegistry(quiet)
        await vkRegistryContract.deployTransaction.wait()

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

        expect(compareVks(pmVk, pmVkOnChain)).toBe(true)
        expect(compareVks(tvVk, tvVkOnChain)).toBe(true)
        expect(compareVks(pdmVk, pdmVkOnChain)).toBe(true)

        // DEBUG.
        if (debug) {
            console.log("pmVkOnChain: ", pmVkOnChain)
            console.log("tvVkOnChain: ", tvVkOnChain)
            console.log("pdmVkOnChain: ", pdmVkOnChain)
        }

        // Create.
        topUpCreditContract = await deployTopupCredit(quiet)
        await topUpCreditContract.deployTransaction.wait()

        constantInitialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(initialVoiceCredits, quiet)
        await constantInitialVoiceCreditProxyContract.deployTransaction.wait()

        freeForAllSignUpGatekeeperContract = await deployFreeForAllSignUpGatekeeper(quiet)
        await freeForAllSignUpGatekeeperContract.deployTransaction.wait()

        verifierContract = await deployVerifier(quiet)
        await verifierContract.deployTransaction.wait()

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
        await data.maciContract.deployTransaction.wait()

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

    it("should deploy Poll", async () => {
        // Create coordinator keypair.
        coordinatorKeyPair = new Keypair()

        expect(PubKey.isValidSerializedPubKey(coordinatorKeyPair.pubKey.serialize())).toBe(true)

        // Create.
        messageProcessorContract = await deployMessageProcessor(
            verifierContract.address,
            poseidonT3ContractAddress,
            poseidonT4ContractAddress,
            poseidonT5ContractAddress,
            poseidonT6ContractAddress,
            quiet
        )
        await messageProcessorContract.deployTransaction.wait()

        tallyContract = await deployTally(
            verifierContract.address,
            poseidonT3ContractAddress,
            poseidonT4ContractAddress,
            poseidonT5ContractAddress,
            poseidonT6ContractAddress,
            quiet
        )
        await tallyContract.deployTransaction.wait()

        if (debug) {
            console.log("MessageProcessorContract: ", messageProcessorContract.address)
            console.log("TallyContract: ", tallyContract.address)
        }

        // Deploy Poll contract from MACI.
        const tx = await maciContract.deployPoll(
            messageProcessorContract.address,
            pollDuration,
            {
                maxMessages,
                maxVoteOptions
            },
            {
                intStateTreeDepth,
                messageTreeSubDepth: msgBatchDepth,
                messageTreeDepth: msgTreeDepth,
                voteOptionTreeDepth,
            },
            coordinatorKeyPair.pubKey.asContractParam(),
            { gasLimit: 10000000 }
        )
        const receipt = await tx.wait()
        const block = await signer.provider.getBlock(receipt.blockHash);
        const deployTime = block.timestamp;

        // Events.
        const iface = maciContract.interface
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        const name = log.name

        expect(name).toBe("DeployPoll")
        expect(pollId).toBe(Number(log.args._pollId))

        if (debug) {
            console.log("PollContractAddress: ", log.args._pollAddr)
            console.log("PollId: ", pollId)
        }

        // Instantiate Poll smart contract.
        const [pollContractAbi] = parseArtifact('Poll')
        pollContract = new ethers.Contract(
            log.args._pollAddr,
            pollContractAbi,
            signer,
        )

        /// @todo add checks.
        // expect

        // if (debug) {
        //     console.log("MaxValues: ", maxValues)
        //     console.log("CoordinatorPubKeyResult: ", coordinatorPubKeyResult)
        // }

        // update maci state.
        const poll = maciState.deployPoll(
            pollDuration,
            BigInt(deployTime + pollDuration),
            {
                maxMessages,
                maxVoteOptions
            },
            {
                intStateTreeDepth,
                messageTreeSubDepth: msgBatchDepth,
                messageTreeDepth: msgTreeDepth,
                voteOptionTreeDepth,
            },
            messageBatchSize,
            coordinatorKeyPair
        );
        expect(poll.toString()).toEqual(pollId.toString());

        if (debug)
            console.log("MACI State: ", maciState)
    })

    it("should signup one user", async () => {
        // Create user1 keypair.
        user1KeyPair = new Keypair()

        expect(PubKey.isValidSerializedPubKey(user1KeyPair.pubKey.serialize())).toBe(true)

        const signUpGatekeeperData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
        const initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(["uint256"], [0]);

        // signup user1.
        const tx = await maciContract.signUp(
            user1KeyPair.pubKey.asContractParam(),
            signUpGatekeeperData,
            initialVoiceCreditProxyData,
            { gasLimit: 1000000 }
        )
        const receipt = await tx.wait()

        // Events.
        const iface = maciContract.interface

        // Get data.
        const stateIndex = iface.parseLog(receipt.logs[0]).args[0]
        const event = iface.parseLog(receipt.logs[receipt.logs.length - 1]);

        expect(event.args._stateIndex.toString()).toEqual((1).toString());
        expect(Number(stateIndex)).toBe(1)

        if (debug) {
            console.log("TransactionHash: ", tx.hash)
            console.log("StateIndex: ", stateIndex)
        }

        userStateIndex = stateIndex

        // update maci state.
        maciState.signUp(
            user1KeyPair.pubKey,
            BigInt(event.args._voiceCreditBalance.toString()),
            BigInt(event.args._timestamp.toString())
        );

        if (debug)
            console.log("MACI State: ", maciState)
    })

    if (debug) {
        it("should not be possible to signup when period ends", async () => {
            // Time-travel.
            await timeTravel(signer.provider, signUpDuration);

            // Should revert when trying to signup.
            const user2KeyPair = new Keypair()

            expect(PubKey.isValidSerializedPubKey(user2KeyPair.pubKey.serialize())).toBe(true)

            const signUpGatekeeperData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
            const initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(["uint256"], [0]);

            // Should revert.
            ///@todo add waffle chai matchers.
            try {
                await maciContract.signUp(
                    user2KeyPair.pubKey.asContractParam(),
                    signUpGatekeeperData,
                    initialVoiceCreditProxyData,
                    { gasLimit: 1000000 }
                )
            } catch (e) {
                const error = "'MACI: the sign-up period has passed'";
                expect(e.message.endsWith(error)).toBeTruthy();
            }
        })
    }

    it("should deactivate the user key", async () => {
        const pollAddr = await maciContract.getPoll(pollId);

        expect(pollAddr).toBe(pollContract.address)
        expect(PubKey.isValidSerializedPubKey(user1KeyPair.pubKey.serialize())).toBe(true)
        expect(Number(userStateIndex)).toBeGreaterThan(0)

        // Prepare data.
        const voteOptionIndex = BigInt(0) // must be zero for key deactivation.
        const newVoteWeight = BigInt(0) // must be zero for key deactivation.
        const messageNonce = BigInt(2)
        const maxValues = await pollContract.maxValues()
        const maxVoteOptions = Number(maxValues.maxVoteOptions)
        const salt = "0x798D81BE4A9870C079B8DE539496AB95"
        /// @todo using random salt can lead to invalid salt size.
        // const salt = genRandomSalt()

        expect(validateSaltFormat(salt) && validateSaltSize(salt)).toBe(true)

        // New keypair.
        const newUserKeyPair = new Keypair()

        // Create new command.
        const command: PCommand = new PCommand(
            BigInt(userStateIndex.toString()),
            user1KeyPair.pubKey,
            voteOptionIndex,
            newVoteWeight,
            messageNonce,
            BigInt(pollId.toString()),
            BigInt(salt),
        )
        // Sign the command with the user private key.
        const signature = command.sign(user1KeyPair.privKey)
        // Encrypt the command with an ECDH shared key between user1 (new key) and coordinator.
        const message = command.encrypt(
            signature,
            Keypair.genEcdhSharedKey(
                newUserKeyPair.privKey,
                coordinatorKeyPair.pubKey,
            )
        )

        // Send tx.
        const tx = await pollContract.deactivateKey(
            message.asContractParam(),
            newUserKeyPair.pubKey.asContractParam(),
            { gasLimit: 10000000 },
        )
        await tx.wait()

        // update maci state.
        maciState.polls[pollId].deactivateKey(message, newUserKeyPair.pubKey)
    })

    it("should confirm the deactivation of user key", async () => {
        // Time-travel (1m).
        await timeTravel(signer.provider, 60);

        // Process the deactivation messages on MACI state.
        const { circuitInputs, deactivatedLeaves } = maciState.polls[pollId].processDeactivationMessages(seed);
        const numBatches = Math.ceil(deactivatedLeaves.length / messageBatchSize);

        expect(deactivatedLeaves.length).toBe(1)
        expect(numBatches).toBe(1)

        // Prepare batch.
        // nb. there should be just one batch.
        const batch = deactivatedLeaves.map((leaf: any) => leaf.asArray());

        const tx = await messageProcessorContract.confirmDeactivation(
            batch, 
            batch.length,
            pollContract.address,
        );
        const receipt = await tx.wait()

        // Events.
        const iface = messageProcessorContract.interface
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        
        // Checks.
        expect(log.name).toBe("DeactivateKey")
        // expect(log.args.keyHash).toBe()
        // expect(log.args.c1).toBe()
        // expect(log.args.c2).toBe()
        
        if (debug) {
            console.log("CircuitInputs: ", circuitInputs)
            console.log("DeactivatedLeaves: ", deactivatedLeaves)
            console.log("Batch: ", batch)
        }
    })
})