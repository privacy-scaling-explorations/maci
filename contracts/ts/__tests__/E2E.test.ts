import { Contract, Signer, ethers, getDefaultProvider } from "ethers";
import { deployConstantInitialVoiceCreditProxy, deployFreeForAllSignUpGatekeeper, deployMaci, deployMessageProcessor, deployTally, deployTopupCredit, deployVerifier, deployVkRegistry, getDefaultSigner, parseArtifact } from "../deploy";
import path = require("path");
import { Keypair, Message, PCommand, PubKey, VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-circuits"
import { genProcessVkSig, genTallyVkSig, genDeactivationVkSig } from 'maci-core'
import { compareVks, formatProofForVerifierContract } from "../utils";
import { timeTravel, validateSaltFormat, validateSaltSize } from "./utils";
import { MaciState } from "maci-core"
import { groth16 } from "snarkjs"
import { getCurveFromName } from "ffjavascript"
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
    const stateNumSrQueueOps = 1 // The number of subroot queue operations to merge for the MACI state tree.
    const deactivatedKeysNumSrQueueOps = 1 // The number of subroot queue operations to merge for the deactivated keys tree.
    const maciState = new MaciState(); // A reproduction of MACI on-chain state.

    // Keys.
    let coordinatorKeyPair: Keypair
    let user1KeyPair: Keypair
    let newUser1KeyPair: Keypair

    // Data from contracts/state interactions.
    let userStateIndex: Number
    let circuitInputs: any

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
    // Wasm.
    const pdmWasmName = `${pdmZkeyName}_js/${pdmZkeyName}`
    const pdmWasmFile = path.resolve(`${zKeysPath}/${pdmWasmName}.wasm`)

    // Vkeys.
    let rawPmVk: any
    let rawTvVk: any
    let rawPdmVk: any
    let pmVk: VerifyingKey
    let tvVk: VerifyingKey
    let pdmVk: VerifyingKey
    let pmVkOnChain: VerifyingKey
    let tvVkOnChain: VerifyingKey
    let pdmVkOnChain: VerifyingKey

    // Snarkjs.
    let curve: any

    // Test configs.
    /// @dev quiet = true - avoid console.log from deploy methods.
    const quiet = true

    beforeAll(async () => {
        // Get default signer and provider.
        signer = await getDefaultSigner();
        provider = signer.provider

        // Snarkjs workaround for graceful termination.
        curve = await getCurveFromName("bn128")
    })

    afterAll(async () => {
        // Snarkjs workaround for graceful termination.
        await curve.terminate()
    })

    it("should initialize MACI infrastructure", async () => {
        vkRegistryContract = await deployVkRegistry(quiet)
        await vkRegistryContract.deployTransaction.wait()

        // extract verification keys.
        rawPmVk = extractVk(pmZkeyFile)
        rawTvVk = extractVk(tvZkeyFile)
        rawPdmVk = extractVk(pdmZkeyFile)

        pmVk = VerifyingKey.fromObj(rawPmVk)
        tvVk = VerifyingKey.fromObj(rawTvVk)
        pdmVk = VerifyingKey.fromObj(rawPdmVk)

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

        // Checks.
        expect(receipt.status).toBe(1)
        expect(isPmVkSet).toBe(false)
        expect(isTvVkSet).toBe(false)
        expect(isPdmVkSet).toBe(false)
        expect(compareVks(pmVk, pmVkOnChain)).toBe(true)
        expect(compareVks(tvVk, tvVkOnChain)).toBe(true)
        expect(compareVks(pdmVk, pdmVkOnChain)).toBe(true)
    })

    it("should deploy Poll", async () => {
        // Create coordinator keypair.
        coordinatorKeyPair = new Keypair()

        // Deploy Message Processor contract.
        messageProcessorContract = await deployMessageProcessor(
            verifierContract.address,
            poseidonT3ContractAddress,
            poseidonT4ContractAddress,
            poseidonT5ContractAddress,
            poseidonT6ContractAddress,
            quiet
        )
        await messageProcessorContract.deployTransaction.wait()

        // Deploy Tally Votes contract.
        tallyContract = await deployTally(
            verifierContract.address,
            poseidonT3ContractAddress,
            poseidonT4ContractAddress,
            poseidonT5ContractAddress,
            poseidonT6ContractAddress,
            quiet
        )
        await tallyContract.deployTransaction.wait()

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

        // Get tx data.
        const block = await signer.provider.getBlock(receipt.blockHash);
        const deployTime = block.timestamp;

        // Events.
        const iface = maciContract.interface
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        const name = log.name

        // Instantiate Poll smart contract.
        const [pollContractAbi] = parseArtifact('Poll')
        pollContract = new ethers.Contract(
            log.args._pollAddr,
            pollContractAbi,
            signer,
        )

        // Update maci state.
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

        // Checks.
        expect(name).toBe("DeployPoll")
        expect(pollId).toBe(Number(log.args._pollId))
        expect(PubKey.isValidSerializedPubKey(coordinatorKeyPair.pubKey.serialize())).toBe(true)
        expect(poll.toString()).toEqual(pollId.toString());
    })

    it("should signup one user", async () => {
        // Create user1 keypair.
        user1KeyPair = new Keypair()

        // Prepare data.
        const signUpGatekeeperData = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
        const initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(["uint256"], [0]);

        // Signup the user.
        const tx = await maciContract.signUp(
            user1KeyPair.pubKey.asContractParam(),
            signUpGatekeeperData,
            initialVoiceCreditProxyData,
            { gasLimit: 1000000 }
        )
        const receipt = await tx.wait()

        // Events.
        const iface = maciContract.interface
        const stateIndex = iface.parseLog(receipt.logs[0]).args[0]
        const event = iface.parseLog(receipt.logs[receipt.logs.length - 1]);

        // Update MACI state.
        userStateIndex = stateIndex
        maciState.signUp(
            user1KeyPair.pubKey,
            BigInt(event.args._voiceCreditBalance.toString()),
            BigInt(event.args._timestamp.toString())
        );

        expect(event.args._stateIndex.toString()).toEqual((1).toString());
        expect(Number(stateIndex)).toBe(1)
        expect(PubKey.isValidSerializedPubKey(user1KeyPair.pubKey.serialize())).toBe(true)
    })

    it("should deactivate the user key", async () => {
        // Prepare data.
        const pollAddr = await maciContract.getPoll(pollId);
        const voteOptionIndex = BigInt(0) // must be zero for key deactivation.
        const newVoteWeight = BigInt(0) // must be zero for key deactivation.
        const messageNonce = BigInt(2)
        /// @todo using random salt can lead to invalid salt size.
        // const salt = genRandomSalt()
        const salt = "0x798D81BE4A9870C079B8DE539496AB95"

        // Generate a new keypair for the user.
        newUser1KeyPair = new Keypair()

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
                newUser1KeyPair.privKey,
                coordinatorKeyPair.pubKey,
            )
        )

        // Send tx.
        const tx = await pollContract.deactivateKey(
            message.asContractParam(),
            newUser1KeyPair.pubKey.asContractParam(),
            { gasLimit: 10000000 },
        )
        const receipt = await tx.wait()

        // Events.
        const iface = pollContract.interface
        const logPublishMessage = iface.parseLog(receipt.logs[0])
        const logAttemptKeyDeactivation = iface.parseLog(receipt.logs[1])

        // update maci state.
        maciState.polls[pollId].deactivateKey(message, newUser1KeyPair.pubKey)

        // Checks.
        expect(logPublishMessage.name).toBe("PublishMessage")
        expect(Number(message.msgType)).toBe(Number(logPublishMessage.args._message.msgType))
        expect(message.data).toStrictEqual(logPublishMessage.args._message.data.map((x: any) => BigInt(x)))
        expect(String(newUser1KeyPair.pubKey.asContractParam().x)).toBe(String(logPublishMessage.args._encPubKey.x))
        expect(String(newUser1KeyPair.pubKey.asContractParam().y)).toBe(String(logPublishMessage.args._encPubKey.y))

        expect(logAttemptKeyDeactivation.name).toBe("AttemptKeyDeactivation")
        expect(Number(message.msgType)).toBe(Number(logAttemptKeyDeactivation.args._message.msgType))
        expect(message.data).toStrictEqual(logAttemptKeyDeactivation.args._message.data.map((x: any) => BigInt(x)))
        expect(String(newUser1KeyPair.pubKey.asContractParam().x)).toBe(String(logAttemptKeyDeactivation.args._encPubKey.x))
        expect(String(newUser1KeyPair.pubKey.asContractParam().y)).toBe(String(logAttemptKeyDeactivation.args._encPubKey.y))

        expect(pollAddr).toBe(pollContract.address)
        expect(Number(userStateIndex)).toBeGreaterThan(0)
        expect(validateSaltFormat(salt) && validateSaltSize(salt)).toBe(true)
        expect(PubKey.isValidSerializedPubKey(user1KeyPair.pubKey.serialize())).toBe(true)
    })

    it("should confirm the deactivation of user key", async () => {
        // Time-travel (1m).
        await timeTravel(signer.provider, 60);

        // Process the deactivation messages on MACI state.
        const data = maciState.polls[pollId].processDeactivationMessages(seed);
        circuitInputs = data.circuitInputs

        // Get ElGamal ciphertext.
        const c1 = circuitInputs.elGamalEnc[0][0]
        const c2 = circuitInputs.elGamalEnc[0][1]

        // Prepare batch.
        // nb. there should be just one batch.
        const numBatches = Math.ceil(data.deactivatedLeaves.length / messageBatchSize);
        const batch = data.deactivatedLeaves.map((leaf: any) => leaf.asArray());

        const tx = await messageProcessorContract.confirmDeactivation(
            batch,
            batch.length,
            pollContract.address,
        );
        const receipt = await tx.wait()

        // Events.
        const iface = messageProcessorContract.interface
        const log = iface.parseLog(receipt.logs[0])

        // Checks.
        expect(log.name).toBe("DeactivateKey")
        expect(c1).toStrictEqual(log.args.c1.map((x: any) => String(x)))
        expect(c2).toStrictEqual(log.args.c2.map((x: any) => String(x)))
        expect(batch[0][0]).toBe(BigInt(log.args.keyHash))
        expect(data.deactivatedLeaves.length).toBe(1)
        expect(numBatches).toBe(1)
    })

    it("should complete the deactivation of user key", async () => {
        // Time-travel (signUpDuration + 1m).
        await timeTravel(signer.provider, signUpDuration + 3600)

        // Generate proof to confirm deactivation.
        const { proof, publicSignals } = await groth16.fullProve(
            {
                inputHash: circuitInputs.inputHash,
                chainHash: circuitInputs.chainHash,
                coordPrivKey: circuitInputs.coordPrivKey,
                coordPubKey: circuitInputs.coordPubKey,
                encPubKeys: circuitInputs.encPubKeys,
                msgs: circuitInputs.msgs,
                deactivatedTreePathElements: circuitInputs.deactivatedTreePathElements,
                stateLeafPathElements: circuitInputs.stateLeafPathElements,
                currentStateLeaves: circuitInputs.currentStateLeaves,
                elGamalEnc: circuitInputs.elGamalEnc,
                maskingValues: circuitInputs.maskingValues,
                deactivatedTreeRoot: circuitInputs.deactivatedTreeRoot,
                currentStateRoot: circuitInputs.currentStateRoot,
                numSignUps: circuitInputs.numSignUps
            },
            pdmWasmFile,
            pdmZkeyFile
        )

        // Check proof validity.
        const isValidProof = await groth16.verify(
            rawPdmVk,
            publicSignals,
            proof
        )

        // Format proof for verifier contract.
        const formattedProof = formatProofForVerifierContract(proof);

        // Merge for deactivation.
        let tx = await messageProcessorContract.mergeForDeactivation(
            stateNumSrQueueOps,
            pollContract.address,
            pollId
        )
        const receipt = await tx.wait()

        // Complete deactivation.
        tx = await messageProcessorContract.completeDeactivation(
            formattedProof,
            pollContract.address,
        )
        await tx.wait()
        
        // Events.
        const logMergeStateAqSubRoots = maciContract.interface.parseLog(receipt.logs[0])
        const logMergeMaciStateAqSubRoots = pollContract.interface.parseLog(receipt.logs[1])
        const logMergeStateAq = maciContract.interface.parseLog(receipt.logs[2])
        const logMergeMaciStateAq = pollContract.interface.parseLog(receipt.logs[3])

        // Checks.
        expect(isValidProof).toBe(true)
        expect(logMergeStateAqSubRoots.name).toBe("MergeStateAqSubRoots")
        expect(Number(logMergeStateAqSubRoots.args._pollId)).toBe(Number(pollId))
        expect(Number(logMergeStateAqSubRoots.args._numSrQueueOps)).toBe(Number(stateNumSrQueueOps))
        expect(logMergeMaciStateAqSubRoots.name).toBe("MergeMaciStateAqSubRoots")
        expect(Number(logMergeMaciStateAqSubRoots.args._numSrQueueOps)).toBe(Number(stateNumSrQueueOps))
        expect(logMergeStateAq.name).toBe("MergeStateAq")
        expect(Number(logMergeStateAq.args._pollId)).toBe(Number(pollId))
        expect(logMergeMaciStateAq.name).toBe("MergeMaciStateAq")
        expect(BigInt(logMergeMaciStateAq.args._stateRoot)).toBe(BigInt(maciState.stateTree.root))
    })
})