import * as assert from 'assert'
import {
    AccQueue,
    IncrementalQuinTree,
    genRandomSalt,
    SNARK_FIELD_SIZE,
    NOTHING_UP_MY_SLEEVE,
    hashLeftRight,
    hash3,
    sha256Hash,
    stringifyBigInts,
    Signature,
} from 'maci-crypto'
import {
    PubKey,
    VerifyingKey,
    Command,
    Message,
    Keypair,
    StateLeaf,
    Ballot,
} from 'maci-domainobjs'

interface TreeDepths {
    intStateTreeDepth: number;
    messageTreeDepth: number;
    messageTreeSubDepth: number;
    voteOptionTreeDepth: number;
}

interface BatchSizes {
    tallyBatchSize: number;
    messageBatchSize: number;
}

interface MaxValues {
    maxUsers: number;
    maxMessages: number;
    maxVoteOptions: number;
}

const STATE_TREE_DEPTH = 10

// Also see: Polls.sol
class Poll {
    public duration: number
    // Note that we only store the PubKey on-chain while this class stores the
    // Keypair for the sake of convenience
    public coordinatorKeypair: Keypair
    public processParamsFilename: string
    public tallyParamsFilename: string
    public treeDepths: TreeDepths
    public batchSizes: BatchSizes
    public maxValues: MaxValues

    public numSignUps: number

    public processVk: VerifyingKey
    public tallyVk: VerifyingKey

    public ballots: Ballot[] = []
    public ballotTree: IncrementalQuinTree

    public messages: Message[] = []
    public messageAq: AccQueue
    public messageTree: IncrementalQuinTree
    public commands: Command[] = []

    public signatures: Signature[] = []
    public encPubKeys: PubKey[] = []
    public STATE_TREE_ARITY = 5
    public MESSAGE_TREE_ARITY = 5
    public VOTE_OPTION_TREE_ARITY = 5

    public stateLeaves: StateLeaf[] = []
    public stateTree = new IncrementalQuinTree(
        STATE_TREE_DEPTH,
        NOTHING_UP_MY_SLEEVE,
        this.STATE_TREE_ARITY,
    )

    // For message processing
    public numBatchesProcessed = 0
    public currentMessageBatchIndex
    public maciStateRef: MaciState
    public pollId: number

    public sbSalts: {[key: number]: BigInt} = {}
    public resultRootSalts: {[key: number]: BigInt} = {}
    public preVOSpentVoiceCreditsRootSalts: {[key: number]: BigInt} = {}
    public spentVoiceCreditSubtotalSalts: {[key: number]: BigInt} = {}

    // For vote tallying
    public results: BigInt[] = []
    public perVOSpentVoiceCredits: BigInt[] = []
    public numBatchesTallied = 0

    public totalSpentVoiceCredits: BigInt = BigInt(0)

    constructor(
        _duration: number,
        _coordinatorKeypair: Keypair,
        _processParamsFilename: string,
        _tallyParamsFilename: string,
        _treeDepths: TreeDepths,
        _batchSizes: BatchSizes,
        _maxValues: MaxValues,
        _processVk: VerifyingKey,
        _tallyVk: VerifyingKey,
        _maciStateRef: MaciState,
    ) {
        this.duration = _duration
        this.coordinatorKeypair = _coordinatorKeypair
        this.processParamsFilename = _processParamsFilename
        this.tallyParamsFilename = _tallyParamsFilename
        this.treeDepths = _treeDepths
        this.batchSizes = _batchSizes
        this.maxValues = _maxValues
        this.processVk = _processVk
        this.tallyVk = _tallyVk
        this.maciStateRef = _maciStateRef
        this.pollId = _maciStateRef.polls.length
        this.numSignUps = Number(_maciStateRef.numSignUps.toString())

        assert(this.numSignUps > 0)

        this.messageTree = new IncrementalQuinTree(
            this.treeDepths.messageTreeDepth,
            NOTHING_UP_MY_SLEEVE,
            this.MESSAGE_TREE_ARITY,
        )
        this.messageAq = new AccQueue(
            this.treeDepths.messageTreeSubDepth,
            this.MESSAGE_TREE_ARITY,
            NOTHING_UP_MY_SLEEVE,
        )

        for (let i = 0; i < this.maxValues.maxVoteOptions; i ++) {
            this.results.push(BigInt(0))
            this.perVOSpentVoiceCredits.push(BigInt(0))
        }

        // Copy state leaves
        assert(_maciStateRef.stateLeaves.length === _maciStateRef.stateTree.leaves.length)

        this.stateLeaves = _maciStateRef.stateLeaves.map(
            (x) => x.copy()
        )
        this.stateTree = _maciStateRef.stateTree.copy()


        // Create as many ballots as state leaves
        const emptyBallot = new Ballot(
            this.maxValues.maxVoteOptions,
            this.treeDepths.voteOptionTreeDepth,
        )
        const emptyBallotHash = emptyBallot.hash()
        this.ballotTree = new IncrementalQuinTree(
            STATE_TREE_DEPTH,
            emptyBallot.hash(),
        )

        for (let i = 0; i < this.stateLeaves.length; i ++) {
            this.ballotTree.insert(emptyBallotHash)
            this.ballots.push(emptyBallot)
        }
    }

    /*
     * Inserts a Message and the corresponding public key used to generate the
     * ECDH shared key which was used to encrypt said message.
     */
    public publishMessage = (
        _message: Message,
        _encPubKey: PubKey,
    ) => {
        assert(
            _encPubKey.rawPubKey[0] < SNARK_FIELD_SIZE &&
            _encPubKey.rawPubKey[1] < SNARK_FIELD_SIZE
        )
        assert(_message.iv < SNARK_FIELD_SIZE)
        for (const d of _message.data) {
            assert(d < SNARK_FIELD_SIZE)
        }

        this.encPubKeys.push(_encPubKey)
        this.messages.push(_message)

        const messageLeaf = _message.hash()
        this.messageAq.enqueue(messageLeaf)
        this.messageTree.insert(messageLeaf)

        // Decrypt the message and store the Command
        const sharedKey = Keypair.genEcdhSharedKey(
            this.coordinatorKeypair.privKey,
            _encPubKey,
        )
        const { command, signature } = Command.decrypt(_message, sharedKey)
        this.commands.push(command)
        this.signatures.push(signature)
    }

    /*
     * Merge all enqueued messages into a tree.
     */
    public mergeAllMessages = (
    ) => {
        this.messageAq.mergeSubRoots(0)
        this.messageAq.merge(this.treeDepths.messageTreeDepth)
        assert(this.isMessageAqMerged())

        // TODO: Validate that a tree from this.messages matches the messageAq
        // main root
    }

    public hasUnprocessedMessages = (): boolean => {
        const batchSize = this.batchSizes.messageBatchSize

        let totalBatches =
            this.messages.length <= batchSize ?
            1
            : 
            Math.floor(this.messages.length / batchSize)

        if (this.messages.length % batchSize > 0) {
            totalBatches ++
        }

        return this.numBatchesProcessed < totalBatches
    }

    /*
     * Process _batchSize messages starting from the saved index.  This
     * function will process messages even if the number of messages is not an
     * exact multiple of _batchSize. e.g. if there are 10 messages, _index is
     * 8, and _batchSize is 4, this function will only process the last two
     * messages in this.messages, and finally update the zeroth state leaf.
     * Note that this function will only process as many state leaves as there
     * are ballots to prevent accidental inclusion of a new user after this
     * poll has concluded.
     * @param _pollId The ID of the poll associated with the messages to
     *        process
     */
    public processMessages = (
        _pollId: number,
    ) => {
        const batchSize = this.batchSizes.messageBatchSize

        assert(this.hasUnprocessedMessages(), 'No more messages to process')

        // Require that the message queue has been merged
        assert(this.isMessageAqMerged())
        assert(this.messageAq.hasRoot(this.treeDepths.messageTreeDepth))

        if (this.numBatchesProcessed === 0) {
            // The starting index of the batch of messages to process.
            // Note that we process messages in reverse order.
            // e.g if there are 8 messages and the batch size is 5, then
            // the starting index should be 5.
            assert(this.currentMessageBatchIndex == undefined)
        }

        if (this.numBatchesProcessed === 0) {
            // Prevent other polls from being processed until this poll has
            // been fully processed
            this.maciStateRef.pollBeingProcessed = true
            this.maciStateRef.currentPollBeingProcessed = _pollId
        }

        // Only allow one poll to be processed at a time
        if (this.maciStateRef.pollBeingProcessed) {
            assert(this.maciStateRef.currentPollBeingProcessed === _pollId)
        }

        if (this.numBatchesProcessed === 0) {
            this.currentMessageBatchIndex = (
                Math.floor(this.messageAq.numLeaves / batchSize)  - 1
            ) * batchSize
            this.sbSalts[this.currentMessageBatchIndex] = BigInt(0)
        }

        // The starting index must be valid
        assert(this.currentMessageBatchIndex >= 0)
        assert(this.currentMessageBatchIndex % batchSize === 0)

        // Generate circuit inputs
        const circuitInputs = stringifyBigInts(
            this.genProcessMessagesCircuitInputsPartial(
                this.currentMessageBatchIndex
            )
        )

        const currentStateLeaves: StateLeaf[] = []
        const currentStateLeavesPathElements: any[] = []

        const currentBallots: Ballot[] = []
        const currentBallotsPathElements: any[] = []

        const currentVoteWeights: BigInt[] = []
        const currentVoteWeightsPathElements: any[] = []

        for (let i = 0; i < batchSize; i ++) {
            const m = this.currentMessageBatchIndex + batchSize - i - 1
            const messageIndex = m >= this.messages.length ?
                this.messages.length - 1
                :
                m

            const r = this.processMessage(messageIndex)

            // If the command is valid
            if (r) {
                // TODO: replace with try/catch after implementing error
                // handling
                const index = r.stateLeafIndex

                currentStateLeaves.unshift(r.originalStateLeaf)
                currentBallots.unshift(r.originalBallot)
                currentVoteWeights.unshift(r.originalVoteWeight)
                currentVoteWeightsPathElements.unshift(r.originalVoteWeightsPathElements)

                currentStateLeavesPathElements.unshift(r.originalStateLeafPathElements)
                currentBallotsPathElements.unshift(r.originalBallotPathElements)

                this.stateLeaves[index] = r.newStateLeaf.copy()
                this.stateTree.update(index, r.newStateLeaf.hash())

                this.ballots[index] = r.newBallot
                this.ballotTree.update(index, r.newBallot.hash())

            } else {
                // If the command is invalid
                currentStateLeaves.unshift(this.stateLeaves[0].copy())
                currentStateLeavesPathElements.unshift(
                    this.stateTree.genMerklePath(0).pathElements
                )

                currentBallots.unshift(this.ballots[0].copy())
                currentBallotsPathElements.unshift(
                    this.ballotTree.genMerklePath(0).pathElements
                )
                const voteOptionIndex = Number(this.commands[messageIndex].voteOptionIndex)

                currentVoteWeights.unshift(
                    this.ballots[0].votes[voteOptionIndex]
                )

                // No need to iterate through the entire votes array if the
                // remaining elements are 0
                let lastIndexToInsert = this.ballots[0].votes.length - 1
                while (lastIndexToInsert >= 0) {
                    if (this.ballots[0].votes[lastIndexToInsert] !== BigInt(0)) {
                        break
                    }
                    lastIndexToInsert --
                }

                if (voteOptionIndex > lastIndexToInsert) {
                    lastIndexToInsert = voteOptionIndex
                }

                const vt = new IncrementalQuinTree(
                    this.treeDepths.voteOptionTreeDepth,
                    BigInt(0),
                )
                for (let i = 0; i <= lastIndexToInsert; i ++) {
                    vt.insert(this.ballots[0].votes[i])
                }
                currentVoteWeightsPathElements.unshift(
                    vt.genMerklePath(voteOptionIndex).pathElements
                )

            }
        }
        circuitInputs.currentStateLeaves = currentStateLeaves.map((x) => x.asCircuitInputs())
        circuitInputs.currentStateLeavesPathElements = currentStateLeavesPathElements
        circuitInputs.currentBallots = currentBallots.map((x) => x.asCircuitInputs())
        circuitInputs.currentBallotsPathElements = currentBallotsPathElements
        circuitInputs.currentVoteWeights = currentVoteWeights
        circuitInputs.currentVoteWeightsPathElements = currentVoteWeightsPathElements

        this.numBatchesProcessed ++

        if (this.currentMessageBatchIndex > 0) {
            this.currentMessageBatchIndex -= batchSize
        }

        const newSbSalt = genRandomSalt()
        this.sbSalts[this.currentMessageBatchIndex] = newSbSalt

        circuitInputs.newSbSalt = newSbSalt
        const newStateRoot = this.stateTree.root
        const newBallotRoot = this.ballotTree.root
        circuitInputs.newSbCommitment = hash3([
            newStateRoot,
            newBallotRoot,
            newSbSalt,
        ])

        // If this is the last batch, release the lock
        if (this.numBatchesProcessed * batchSize >= this.messages.length) {
            this.maciStateRef.pollBeingProcessed = false
        }
        return stringifyBigInts(circuitInputs)
    }

    /*
     * Generates inputs for the ProcessMessages circuit. 
     */
    public genProcessMessagesCircuitInputsPartial = (
        _index: number,
    ) => {
        const messageBatchSize = this.batchSizes.messageBatchSize

        assert(_index < this.messages.length)

        let msgs = this.messages.map((x) => x.asCircuitInputs())
        while (msgs.length % messageBatchSize > 0) {
            msgs.push(msgs[msgs.length - 1])
        }

        msgs = msgs.slice(_index, _index + messageBatchSize)

        let commands = this.commands.map((x) => x.copy())
        while (commands.length % messageBatchSize > 0) {
            commands.push(commands[commands.length - 1])
        }
        commands = commands.slice(_index, _index + messageBatchSize)

        const messageSubrootPath = this.messageTree.genMerkleSubrootPath(
            _index,
            _index + messageBatchSize,
        )

        const batchEndIndex = this.messages.length - _index >= messageBatchSize ?
            _index + messageBatchSize
            :
            this.messages.length - _index - 1

        let encPubKeys = this.encPubKeys.map((x) => x.copy())
        while (encPubKeys.length % messageBatchSize > 0) {
            encPubKeys.push(encPubKeys[encPubKeys.length - 1])
        }
        encPubKeys = encPubKeys.slice(_index, _index + messageBatchSize)

        const stateIndices: number[] = []
        for (let i = 0; i < messageBatchSize; i ++) {
            const stateIndex = Number(commands[i].stateIndex)
            stateIndices.push(stateIndex)
        }

        const msgRoot = this.messageAq.getRoot(this.treeDepths.messageTreeDepth)

        const currentStateRoot = this.stateTree.root
        const currentBallotRoot = this.ballotTree.root
        const currentSbCommitment = hash3([
            currentStateRoot,
            currentBallotRoot,
            this.sbSalts[this.currentMessageBatchIndex],
        ])

        // Generate a SHA256 hash of inputs which the contract provides
        const packedVals = 
            BigInt(this.maxValues.maxVoteOptions) +
            (BigInt(this.numSignUps) << BigInt(50)) +
            (BigInt(_index) << BigInt(100)) +
            (BigInt(batchEndIndex) << BigInt(150))

        const coordPubKey = this.coordinatorKeypair.pubKey

        const coordPubKeyHash = coordPubKey.hash()

        const inputHash = sha256Hash([
            packedVals,
            coordPubKeyHash,
            msgRoot,
            currentSbCommitment,
        ])

        return stringifyBigInts({
            inputHash,
            packedVals,
            msgRoot,
            msgs,
            msgSubrootPathElements: messageSubrootPath.pathElements,
            coordPrivKey: this.coordinatorKeypair.privKey.asCircuitInputs(),
            coordPubKey: coordPubKey.asCircuitInputs(),
            encPubKeys: encPubKeys.map((x) => x.asCircuitInputs()),
            currentStateRoot,
            currentBallotRoot,
            currentSbCommitment,
            currentSbSalt: this.sbSalts[this.currentMessageBatchIndex],
        })
    }

    /*
     * Process all messages. This function does not update the ballots or state
     * leaves; rather, it copies and then updates them. This makes it possible
     * to test the result of multiple processMessage() invocations.
     */
    public processAllMessages = () => {
        const stateLeaves = this.stateLeaves.map((x) => x.copy())
        const ballots = this.ballots.map((x) => x.copy())
        
        for (let i = 0; i < this.messages.length; i ++) {
            const messageIndex = this.messages.length - i - 1
            const r = this.processMessage(messageIndex)
            if (r) {
                // TODO: replace with try/catch after implementing error
                // handling
                const index = r.stateLeafIndex
                stateLeaves[index] = r.newStateLeaf
                ballots[index] = r.newBallot
            }
        }

        return { stateLeaves, ballots }
    }

    /*
     * Process one message
     */
    private processMessage = (
        _index: number,
    ) => {
        //TODO: throw custom errors for no-ops

        // Ensure that the index is valid
        assert(_index >= 0)
        assert(this.messages.length > _index)

        // Ensure that there is the correct number of ECDH shared keys
        assert(this.encPubKeys.length === this.messages.length)

        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]

        // Decrypt the message
        const sharedKey = Keypair.genEcdhSharedKey(
            this.coordinatorKeypair.privKey,
            encPubKey,
        )
        const { command, signature } = Command.decrypt(message, sharedKey)

        const stateLeafIndex = BigInt(command.stateIndex)

        // If the state tree index in the command is invalid, do nothing
        if (
            stateLeafIndex > BigInt(this.ballots.length) ||
            stateLeafIndex < BigInt(0)
        ) {
            return
        }

        if (stateLeafIndex >= BigInt(this.stateTree.leaves.length)) {
            return
        }

        // The user to update (or not)
        const stateLeaf = this.stateLeaves[Number(stateLeafIndex)]

        // The ballot to update (or not)
        const ballot = this.ballots[Number(stateLeafIndex)]

        // If the signature is invalid, do nothing
        if (!command.verifySignature(signature, stateLeaf.pubKey)) {
            return
        }

        // If the nonce is invalid, do nothing
        if (command.nonce !== BigInt(ballot.nonce) + BigInt(1)) {
            return
        }

        const prevSpentCred = ballot.votes[Number(command.voteOptionIndex)]

        const voiceCreditsLeft =
            BigInt(stateLeaf.voiceCreditBalance) +
            (BigInt(prevSpentCred) * BigInt(prevSpentCred)) -
            (BigInt(command.newVoteWeight) * BigInt(command.newVoteWeight))

        // If the remaining voice credits is insufficient, do nothing
        if (voiceCreditsLeft < BigInt(0)) {
            return
        }

        // If the vote option index is invalid, do nothing
        if (
            command.voteOptionIndex < BigInt(-1) ||
            command.voteOptionIndex > BigInt(this.maxValues.maxVoteOptions)
        ) {
            return
        }

        // Deep-copy the state leaf and update its attributes
        const newStateLeaf = stateLeaf.copy()
        newStateLeaf.voiceCreditBalance = voiceCreditsLeft
        newStateLeaf.pubKey = command.newPubKey.copy()

        // Deep-copy the ballot and update its attributes
        const newBallot = ballot.copy()
        newBallot.nonce = BigInt(newBallot.nonce) + BigInt(1)
        newBallot.votes[Number(command.voteOptionIndex)] =
            command.newVoteWeight

        const originalStateLeafPathElements
            = this.stateTree.genMerklePath(Number(stateLeafIndex)).pathElements

        const originalBallotPathElements
            = this.ballotTree.genMerklePath(Number(stateLeafIndex)).pathElements

        const voteOptionIndex = Number(command.voteOptionIndex)

        const originalVoteWeight = ballot.votes[voteOptionIndex]
        const vt = new IncrementalQuinTree(
            this.treeDepths.voteOptionTreeDepth,
            BigInt(0),
        )
        for (let i = 0; i < this.ballots[0].votes.length; i ++) {
            vt.insert(ballot.votes[i])
        }

        const originalVoteWeightsPathElements =
            vt.genMerklePath(voteOptionIndex).pathElements

        return {
            stateLeafIndex: Number(stateLeafIndex),

            newStateLeaf,
            originalStateLeaf: stateLeaf.copy(),
            originalStateLeafPathElements,
            originalVoteWeight,
            originalVoteWeightsPathElements,

            newBallot,
            originalBallot: ballot.copy(),
            originalBallotPathElements,
        }
    }

    private isMessageAqMerged = (): boolean => {
        return this.messageAq.getRoot(this.treeDepths.messageTreeDepth) ===
            this.messageTree.root
    }

    public hasUntalliedBallots = () => {
        const batchSize = this.batchSizes.tallyBatchSize
        return this.numBatchesTallied * batchSize < this.ballots.length
    }

    /*
     * Tally a batch of Ballots and update this.results
     */
    public tallyVotes = () => {

        const batchSize = this.batchSizes.tallyBatchSize

        assert(
            this.hasUntalliedBallots(),
            'No more ballots to tally',
        )

        const batchStartIndex = this.numBatchesTallied * batchSize

        const currentResultsRootSalt = batchStartIndex === 0 ?
            BigInt(0)
            :
            this.resultRootSalts[batchStartIndex - batchSize]

        const currentPerVOSpentVoiceCreditsRootSalt = batchStartIndex === 0 ?
            BigInt(0)
            :
            this.preVOSpentVoiceCreditsRootSalts[batchStartIndex - batchSize]

        const currentSpentVoiceCreditSubtotalSalt = batchStartIndex === 0 ?
            BigInt(0)
            :
            this.spentVoiceCreditSubtotalSalts[batchStartIndex - batchSize]

        const currentResultsCommitment = this.genResultsCommitment(currentResultsRootSalt)
        const currentPerVOSpentVoiceCreditsCommitment =
            this.genPerVOSpentVoiceCreditsCommitment(currentPerVOSpentVoiceCreditsRootSalt)
        const currentSpentVoiceCreditsCommitment =
            this.genSpentVoiceCreditSubtotalCommitment(currentSpentVoiceCreditSubtotalSalt)

        const currentTallyCommitment = hash3([
            currentResultsCommitment,
            currentSpentVoiceCreditsCommitment,
            currentPerVOSpentVoiceCreditsCommitment,
        ])

        const ballots: Ballot[] = []
        const currentResults = this.results.map((x) => BigInt(x.toString()))
        const currentPerVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x) => BigInt(x.toString()))
        const currentSpentVoiceCreditSubtotal = BigInt(this.totalSpentVoiceCredits.toString())

        for (
            let i = this.numBatchesTallied * batchSize;
            i < this.numBatchesTallied * batchSize + batchSize;
            i ++
        ) {
            if (i >= this.ballots.length) {
                break
            }

            ballots.push(this.ballots[i])

            for (let j = 0; j < this.maxValues.maxVoteOptions; j++) {
                const v = BigInt(this.ballots[i].votes[j])

                this.results[j] = BigInt(this.results[j]) + v

                this.perVOSpentVoiceCredits[j] =
                    BigInt(this.perVOSpentVoiceCredits[j]) + (BigInt(v) * BigInt(v))

                this.totalSpentVoiceCredits =
                    BigInt(this.totalSpentVoiceCredits) + BigInt(v) * BigInt(v)
            }
        }

        const emptyBallot = new Ballot(
            this.maxValues.maxVoteOptions,
            this.treeDepths.voteOptionTreeDepth,
        )

        while (ballots.length < batchSize) {
            ballots.push(emptyBallot)
        }

        const newResultsRootSalt = genRandomSalt()
        const newPerVOSpentVoiceCreditsRootSalt = genRandomSalt()
        const newSpentVoiceCreditSubtotalSalt = genRandomSalt()

        this.resultRootSalts[batchStartIndex] = newResultsRootSalt
        this.preVOSpentVoiceCreditsRootSalts[batchStartIndex] = newPerVOSpentVoiceCreditsRootSalt
        this.spentVoiceCreditSubtotalSalts[batchStartIndex] = newSpentVoiceCreditSubtotalSalt

        const newResultsCommitment = this.genResultsCommitment(newResultsRootSalt)
        const newPerVOSpentVoiceCreditsCommitment =
            this.genPerVOSpentVoiceCreditsCommitment(newPerVOSpentVoiceCreditsRootSalt)
        const newSpentVoiceCreditsCommitment =
            this.genSpentVoiceCreditSubtotalCommitment(newSpentVoiceCreditSubtotalSalt)

        const newTallyCommitment = hash3([
            newResultsCommitment,
            newSpentVoiceCreditsCommitment,
            newPerVOSpentVoiceCreditsCommitment,
        ])

        const stateRoot = this.stateTree.root
        const ballotRoot = this.ballotTree.root
        const sbSalt = this.sbSalts[this.currentMessageBatchIndex]
        const sbCommitment = hash3([stateRoot, ballotRoot, sbSalt ])
        const packedVals = MaciState.packTallyVotesSmallVals(
            batchStartIndex,
            batchSize,
            this.numSignUps,
        )
        const inputHash = sha256Hash([
            packedVals,
            sbCommitment,
            currentTallyCommitment,
            newTallyCommitment,
        ])

        const ballotSubrootProof = this.ballotTree.genMerkleSubrootPath(
                batchStartIndex,
                batchStartIndex + batchSize,
            )

        const votes = ballots.map((x) => x.votes)

        const circuitInputs = stringifyBigInts({
            stateRoot,
            ballotRoot,
            sbSalt,

            sbCommitment,
            currentTallyCommitment,
            newTallyCommitment,

            packedVals, // contains numSignUps and batchStartIndex
            inputHash,

            ballots: ballots.map((x) => x.asCircuitInputs()),
            ballotPathElements: ballotSubrootProof.pathElements,
            votes,

            currentResults,
            currentResultsRootSalt,

            currentSpentVoiceCreditSubtotal,
            currentSpentVoiceCreditSubtotalSalt,

            currentPerVOSpentVoiceCredits,
            currentPerVOSpentVoiceCreditsRootSalt,

            newResultsRootSalt,
            newPerVOSpentVoiceCreditsRootSalt,
            newSpentVoiceCreditSubtotalSalt,
        })

        this.numBatchesTallied ++

        return circuitInputs
    }

    public genResultsCommitment = (_salt: BigInt) => {
        const resultsTree = new IncrementalQuinTree(
            this.treeDepths.voteOptionTreeDepth,
            BigInt(0),
            this.VOTE_OPTION_TREE_ARITY,
        )

        for (const r of this.results) {
            resultsTree.insert(r)
        }

        return hashLeftRight(resultsTree.root, _salt)
    }

    public genSpentVoiceCreditSubtotalCommitment = (_salt) => {
        let subtotal = BigInt(0)
        for (const r of this.results) {
            subtotal += BigInt(r) * BigInt(r)
        }
        return hashLeftRight(subtotal, _salt)
    }

    public genPerVOSpentVoiceCreditsCommitment = (_salt: BigInt) => {
        const resultsTree = new IncrementalQuinTree(
            this.treeDepths.voteOptionTreeDepth,
            BigInt(0),
            this.VOTE_OPTION_TREE_ARITY,
        )

        for (const r of this.results) {
            resultsTree.insert(BigInt(r) * BigInt(r))
        }

        return hashLeftRight(resultsTree.root, _salt)
    }

    public copy = (): Poll => {
        const copied = new Poll(
            Number(this.duration.toString()),
            this.coordinatorKeypair.copy(),
            this.processParamsFilename.toString(),
            this.tallyParamsFilename.toString(),
            {
                intStateTreeDepth:
                    Number(this.treeDepths.intStateTreeDepth),
                messageTreeDepth:
                    Number(this.treeDepths.messageTreeDepth),
                messageTreeSubDepth:
                    Number(this.treeDepths.messageTreeSubDepth),
                voteOptionTreeDepth:
                    Number(this.treeDepths.voteOptionTreeDepth),
            },
            {
                tallyBatchSize:
                    Number(this.batchSizes.tallyBatchSize.toString()),
                messageBatchSize:
                    Number(this.batchSizes.messageBatchSize.toString()),
            },
            {
                maxUsers:
                    Number(this.maxValues.maxUsers.toString()),
                maxMessages:
                    Number(this.maxValues.maxMessages.toString()),
                maxVoteOptions:
                    Number(this.maxValues.maxVoteOptions.toString()),
            },
            this.processVk.copy(),
            this.tallyVk.copy(),
            this.maciStateRef,
        )

        copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy())
        copied.messages = this.messages.map((x: Message) => x.copy())
        copied.commands = this.commands.map((x: Command) => x.copy())
        copied.signatures = this.signatures.map((x: Signature) => {
            return {
                R8: [
                    BigInt(x.R8[0].toString()),
                    BigInt(x.R8[1].toString()),
                ],
                S: BigInt(x.S.toString()),
            }
        })
        copied.ballots = this.ballots.map((x: Ballot) => x.copy())
        copied.encPubKeys = this.encPubKeys.map((x: PubKey) => x.copy())
        copied.ballotTree = this.ballotTree.copy()
        copied.currentMessageBatchIndex = this.currentMessageBatchIndex
        copied.maciStateRef = this.maciStateRef
        copied.messageAq = this.messageAq.copy()
        copied.messageTree = this.messageTree.copy()
        copied.processParamsFilename = this.processParamsFilename
        copied.results = this.results.map((x: BigInt) => BigInt(x.toString()))
        copied.perVOSpentVoiceCredits = this.perVOSpentVoiceCredits.map((x: BigInt) => BigInt(x.toString()))

        copied.numBatchesProcessed = Number(this.numBatchesProcessed.toString())
        copied.numBatchesTallied = Number(this.numBatchesTallied.toString())
        copied.pollId = Number(this.pollId.toString())
        copied.totalSpentVoiceCredits = BigInt(this.totalSpentVoiceCredits.toString())

        copied.sbSalts = {}
        copied.resultRootSalts = {}
        copied.preVOSpentVoiceCreditsRootSalts = {}
        copied.spentVoiceCreditSubtotalSalts = {}

        for (const k of Object.keys(this.sbSalts)) {
            copied.sbSalts[k] = BigInt(this.sbSalts[k].toString())
        }
        for (const k of Object.keys(this.resultRootSalts)) {
            copied.resultRootSalts[k] = BigInt(this.resultRootSalts[k].toString())
        }
        for (const k of Object.keys(this.preVOSpentVoiceCreditsRootSalts)) {
            copied.preVOSpentVoiceCreditsRootSalts[k] = BigInt(this.preVOSpentVoiceCreditsRootSalts[k].toString())
        }
        for (const k of Object.keys(this.spentVoiceCreditSubtotalSalts)) {
            copied.spentVoiceCreditSubtotalSalts[k] = BigInt(this.spentVoiceCreditSubtotalSalts[k].toString())
        }

        return copied
    }

    public equals = (p: Poll): boolean => {
        const result = 
            this.duration === p.duration &&
            this.coordinatorKeypair.equals(p.coordinatorKeypair) &&
            this.processParamsFilename === p.processParamsFilename &&
            this.tallyParamsFilename === p.tallyParamsFilename &&
            this.treeDepths.intStateTreeDepth ===
                p.treeDepths.intStateTreeDepth &&
            this.treeDepths.messageTreeDepth ===
                p.treeDepths.messageTreeDepth &&
            this.treeDepths.messageTreeSubDepth ===
                p.treeDepths.messageTreeSubDepth &&
            this.treeDepths.voteOptionTreeDepth ===
                p.treeDepths.voteOptionTreeDepth &&
            this.batchSizes.tallyBatchSize === p.batchSizes.tallyBatchSize &&
            this.batchSizes.messageBatchSize ===
                p.batchSizes.messageBatchSize &&
            this.maxValues.maxUsers === p.maxValues.maxUsers &&
            this.maxValues.maxMessages === p.maxValues.maxMessages &&
            this.maxValues.maxVoteOptions === p.maxValues.maxVoteOptions &&
            this.processVk.equals(p.processVk) &&
            this.tallyVk.equals(p.tallyVk) &&
            this.messages.length === p.messages.length &&
            this.encPubKeys.length === p.encPubKeys.length

        if (! result) {
            return false
        }

        for (let i = 0; i < this.messages.length; i ++) {
            if (!this.messages[i].equals(p.messages[i])) {
                return false
            }
        }
        for (let i = 0; i < this.encPubKeys.length; i ++) {
            if (!this.encPubKeys[i].equals(p.encPubKeys[i])) {
                return false
            }
        }
        return true
    }
}

// A representation of the MACI contract
// Also see MACI.sol
class MaciState {
    public STATE_TREE_ARITY = 5
    public STATE_TREE_SUBDEPTH = 2
    public MESSAGE_TREE_ARITY = 5
    public VOTE_OPTION_TREE_ARITY = 5

    public stateTreeDepth = STATE_TREE_DEPTH
    public polls: Poll[] = []
    public stateLeaves: StateLeaf[] = []
    public stateTree = new IncrementalQuinTree(
        STATE_TREE_DEPTH,
        NOTHING_UP_MY_SLEEVE,
        this.STATE_TREE_ARITY,
        //this.STATE_TREE_SUBDEPTH,
    )
    public stateAq: AccQueue = new AccQueue(
        this.STATE_TREE_SUBDEPTH,
        this.STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
        //true,
    )
    public pollBeingProcessed = true
    public currentPollBeingProcessed
    public numSignUps = 0

    //constructor() {
    //}

    public signUp(
        _pubKey: PubKey,
        _initialVoiceCreditBalance: BigInt,
    ): number {
        const stateLeaf = new StateLeaf(
            _pubKey,
            _initialVoiceCreditBalance,
        )
        const h = stateLeaf.hash()
        const leafIndex = this.stateAq.enqueue(h)
        this.stateTree.insert(h)
        this.stateLeaves.push(stateLeaf.copy())
        this.numSignUps ++
        return leafIndex
    }

    public deployPoll(
        _duration: number,
        _maxValues: MaxValues,
        _treeDepths: TreeDepths,
        _messageBatchSize: number,
        _coordinatorKeypair: Keypair,
        _processVk: VerifyingKey,
        _tallyVk: VerifyingKey,
    ): number {
        const poll: Poll = new Poll(
            _duration,
            _coordinatorKeypair,
            '',
            '',
             _treeDepths,
            {
                messageBatchSize: _messageBatchSize,
                tallyBatchSize:
                    this.STATE_TREE_ARITY ** _treeDepths.intStateTreeDepth,
            },
            _maxValues, 
            _processVk,
            _tallyVk,
            this,
        )

        this.polls.push(poll)
        return this.polls.length - 1
    }

    public deployNullPoll() {
        // @ts-ignore
        this.polls.push(null)
    }

    /*
     * Deep-copy this object
     */
    public copy = (): MaciState => {
        const copied = new MaciState()

        copied.stateLeaves = this.stateLeaves.map((x: StateLeaf) => x.copy())
        copied.polls = this.polls.map((x: Poll) => x.copy())

        return copied
    }

    public equals = (m: MaciState): boolean => {
        const result =
            this.STATE_TREE_ARITY === m.STATE_TREE_ARITY &&
            this.MESSAGE_TREE_ARITY === m.MESSAGE_TREE_ARITY &&
            this.VOTE_OPTION_TREE_ARITY === m.VOTE_OPTION_TREE_ARITY &&
            this.stateTreeDepth === m.stateTreeDepth &&
            this.polls.length === m.polls.length &&
            this.stateLeaves.length === m.stateLeaves.length

        if (!result) {
            return false
        }

        for (let i = 0; i < this.polls.length; i ++) {
            if (!this.polls[i].equals(m.polls[i])) {
                return false
            }
        }
        for (let i = 0; i < this.stateLeaves.length; i ++) {
            if (!this.stateLeaves[i].equals(m.stateLeaves[i])) {
                return false
            }
        }
        
        return true
    }

    public static packTallyVotesSmallVals = (
        batchStartIndex: number,
        batchSize: number,
        numSignUps: number,
    ) => {
        // Note: the << operator has lower precedence than +
        const packedVals = 
            (BigInt(batchStartIndex) / BigInt(batchSize)) +
            (BigInt(numSignUps) << BigInt(50))

        return packedVals
    }

    public static packProcessMessageSmallVals = (
        maxVoteOptions: BigInt,
        numUsers: BigInt,
        batchStartIndex: number,
        batchEndIndex: number,
    ) => {
        return BigInt(maxVoteOptions) +
            (BigInt(numUsers) << BigInt(50)) +
            (BigInt(batchStartIndex) << BigInt(100)) +
            (BigInt(batchEndIndex) << BigInt(150))
    }

    public static unpackProcessMessageSmallVals = (
        packedVals: BigInt,
    ) => {
        let asBin = BigInt(packedVals).toString(2)
        assert(asBin.length <= 200)
        while (asBin.length < 200) {
            asBin = '0' + asBin
        }
        const maxVoteOptions = BigInt('0b' + asBin.slice(150, 200))
        const numUsers = BigInt('0b' + asBin.slice(100, 150))
        const batchStartIndex = BigInt('0b' + asBin.slice(50, 100))
        const batchEndIndex = BigInt('0b' + asBin.slice(0, 50))

        return {
            maxVoteOptions,
            numUsers,
            batchStartIndex,
            batchEndIndex,
        }
    }
}

const genProcessVkSig = (
    _stateTreeDepth: number,
    _messageTreeDepth: number,
    _voteOptionTreeDepth: number,
    _batchSize: number
): BigInt => {
    return (BigInt(_batchSize) << BigInt(192)) +
           (BigInt(_stateTreeDepth) << BigInt(128)) +
           (BigInt(_messageTreeDepth) << BigInt(64)) +
            BigInt(_voteOptionTreeDepth)
}

const genTallyVkSig = (
    _stateTreeDepth: number,
    _intStateTreeDepth: number,
    _voteOptionTreeDepth: number,
): BigInt => {
    return (BigInt(_stateTreeDepth) << BigInt(128)) +
           (BigInt(_intStateTreeDepth) << BigInt(64)) +
            BigInt(_voteOptionTreeDepth)
}

export {
    MaxValues,
    TreeDepths,
    MaciState,
    Poll,
    genProcessVkSig,
    genTallyVkSig,
    genTallyResultCommitment,
    STATE_TREE_DEPTH,
}

// OLD CODE: FOR REFERENCE ONLY
//class MaciState {
    /*
     * Generates inputs to the UpdateStateTree circuit. Do not call
     * processMessage() or batchProcessMessage() before this function.
     */
    //public genUpdateStateTreeCircuitInputs = (
        //_index: number,
    //) => {
        //assert(this.messages.length > _index)
        //assert(this.encPubKeys.length === this.messages.length)

        //const message = this.messages[_index]
        //const encPubKey = this.encPubKeys[_index]
        //const sharedKey = Keypair.genEcdhSharedKey(
            //this.coordinatorKeypair.privKey,
            //encPubKey,
        //)
        //const { command } = Command.decrypt(message, sharedKey)

        //const messageTree = this.genMessageTree()
        //const msgTreePath = messageTree.genMerklePath(_index)
        //assert(IncrementalQuinTree.verifyMerklePath(msgTreePath, messageTree.hashFunc))

        //const stateTree = this.genStateTree()
        //const stateTreeMaxIndex = BigInt(stateTree.nextIndex) - BigInt(1)

        //const userIndex = BigInt(command.stateIndex) - BigInt(1)
        //assert(BigInt(this.users.length) > userIndex)

        //const user = this.users[Number(userIndex)]

        //const currentVoteWeight = user.votes[Number(command.voteOptionIndex)]

        //const voteOptionTree = new IncrementalQuinTree(
            //this.voteOptionTreeDepth,
            //BigInt(0),
        //)

        //for (const vote of user.votes) {
            //voteOptionTree.insert(vote)
        //}

        //const voteOptionTreePath = voteOptionTree.genMerklePath(Number(command.voteOptionIndex))
        //assert(IncrementalQuinTree.verifyMerklePath(voteOptionTreePath, voteOptionTree.hashFunc))

        //const stateTreePath = stateTree.genMerklePath(Number(command.stateIndex))
        //assert(IncrementalQuinTree.verifyMerklePath(stateTreePath, stateTree.hashFunc))

        //const stateLeaf = user.genStateLeaf(this.voteOptionTreeDepth)

        //return stringifyBigInts({
            //'coordinator_public_key': this.coordinatorKeypair.pubKey.asCircuitInputs(),
            //'ecdh_private_key': this.coordinatorKeypair.privKey.asCircuitInputs(),
            //'ecdh_public_key': encPubKey.asCircuitInputs(),
            //'message': message.asCircuitInputs(),
            //'msg_tree_root': messageTree.root,
            //'msg_tree_path_elements': msgTreePath.pathElements,
            //'msg_tree_path_index': msgTreePath.indices,
            //'vote_options_leaf_raw': currentVoteWeight,
            //'vote_options_tree_root': voteOptionTree.root,
            //'vote_options_tree_path_elements': voteOptionTreePath.pathElements,
            //'vote_options_tree_path_index': voteOptionTreePath.indices,
            //'vote_options_max_leaf_index': this.maxVoteOptionIndex,
            //'state_tree_data_raw': stateLeaf.asCircuitInputs(),
            //'state_tree_max_leaf_index': stateTreeMaxIndex,
            //'state_tree_root': stateTree.root,
            //'state_tree_path_elements': stateTreePath.pathElements,
            //'state_tree_path_index': stateTreePath.indices,
        //})
    //}

    /*
     * Generates inputs to the BatchUpdateStateTree circuit. Do not call
     * processMessage() or batchProcessMessage() before this function.
     */
    //public genBatchUpdateStateTreeCircuitInputs = (
        //_index: number,
        //_batchSize: number,
        //_randomStateLeaf: StateLeaf,
    //) => {

        //assert(this.messages.length > _index)
        //assert(this.encPubKeys.length === this.messages.length)

        //const stateLeaves: StateLeaf[] = []
        //const stateRoots: BigInt[] = []
        //const stateTreePathElements: BigInt[][] = []
        //const stateTreePathIndices: BigInt[][] = []
        //const voteOptionLeaves: BigInt[] = []
        //const voteOptionTreeRoots: BigInt[] = []
        //const voteOptionTreePathElements: BigInt[][] = []
        //const voteOptionTreePathIndices: BigInt[][] = []
        //const messageTreePathElements: any[] = []
        //const messages: any[] = []
        //const encPubKeys: any[] = []

        //const clonedMaciState = this.copy()
        //const messageTree = clonedMaciState.genMessageTree()

        //// prevInputs is the most recent set of UST circuit inputs generated from the
        //// most recently processed message. In effect, even if there are not as
        //// many messages to process as the batch size, we can still use the
        //// circuit. e.g. if batchSize is 4, messageIndex is 0, and there is
        //// only 1 message, and the ustCircuitInputs for message 0 is x, then
        //// the circuit inputs for this batch is [x, x, x, x]. This is fine as
        //// the last three x-s will either be no-ops or do the same thing as the
        //// first x.
        //let numRealMessages = BigInt(0)

        //const messageIndices: number[] = []
        //for (let i = 0; i < _batchSize; i++) {
            //const j = _index + i
            //if (j < BigInt(clonedMaciState.messages.length)) {
                //messageIndices.push(_index + i)
                //numRealMessages = numRealMessages + BigInt(1)
            //} else {
                //messageIndices.push(clonedMaciState.messages.length - 1)
            //}
        //}

        //// process the messages in reverse order
        //messageIndices.reverse()

        //let messageIndex
        //for (let i = 0; i < _batchSize; i++) {
            //messageIndex = messageIndices[i]

            //// Generate circuit inputs for the message
            //const ustCircuitInputs = clonedMaciState.genUpdateStateTreeCircuitInputs(messageIndex)

            //if (messageIndex < BigInt(clonedMaciState.messages.length)) {
                //// Process the message
                //clonedMaciState.processMessage(messageIndex)
            //}

            //messages.push(clonedMaciState.messages[messageIndex])
            //encPubKeys.push(clonedMaciState.encPubKeys[messageIndex])

            //messageTreePathElements.push(ustCircuitInputs.msg_tree_path_elements)
            //stateRoots.push(ustCircuitInputs.state_tree_root)
            //stateTreePathElements.push(ustCircuitInputs.state_tree_path_elements)
            //stateTreePathIndices.push(ustCircuitInputs.state_tree_path_index)
            //voteOptionLeaves.push(ustCircuitInputs.vote_options_leaf_raw)
            //stateLeaves.push(ustCircuitInputs.state_tree_data_raw)
            //voteOptionTreeRoots.push(ustCircuitInputs.vote_options_tree_root)
            //voteOptionTreePathElements.push(ustCircuitInputs.vote_options_tree_path_elements)
            //voteOptionTreePathIndices.push(ustCircuitInputs.vote_options_tree_path_index)
        //}

        //const stateTree = clonedMaciState.genStateTree()

        //const randomLeafRoot = stateTree.root

        //// Insert the random leaf
        //stateTree.update(0, _randomStateLeaf.hash())

        //const randomStateLeafPathElements = stateTree.genMerklePath(0).pathElements

        //return stringifyBigInts({
            //'coordinator_public_key': clonedMaciState.coordinatorKeypair.pubKey.asCircuitInputs(),
            //'message': messages.map((x) => x.asCircuitInputs()),
            //'ecdh_private_key': clonedMaciState.coordinatorKeypair.privKey.asCircuitInputs(),
            //'ecdh_public_key': encPubKeys.map((x) => x.asCircuitInputs()),
            //'msg_tree_root': messageTree.root,
            //'msg_tree_path_elements': messageTreePathElements,
            //'msg_tree_batch_start_index': _index,
            //'msg_tree_batch_end_index': BigInt(_index) + numRealMessages - BigInt(1),
            //'random_leaf': _randomStateLeaf.hash(),
            //'state_tree_root': stateRoots,
            //'state_tree_path_elements': stateTreePathElements,
            //'state_tree_path_index': stateTreePathIndices,
            //'random_leaf_root': randomLeafRoot,
            //'random_leaf_path_elements': randomStateLeafPathElements,
            //'vote_options_leaf_raw': voteOptionLeaves,
            //'state_tree_data_raw': stateLeaves,
            //'state_tree_max_leaf_index': BigInt(stateTree.nextIndex) - BigInt(1),
            //'vote_options_max_leaf_index': clonedMaciState.maxVoteOptionIndex,
            //'vote_options_tree_root': voteOptionTreeRoots,
            //'vote_options_tree_path_elements': voteOptionTreePathElements,
            //'vote_options_tree_path_index': voteOptionTreePathIndices,
        //})
    //}

    /*
     * Computes the total number of voice credits per vote option spent up to
     * _startIndex. Ignores the zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     * are included in the tally.
     */
    //public computeCumulativePerVOSpentVoiceCredits = (
        //_startIndex: BigInt,
    //): BigInt[] => {
        //_startIndex = BigInt(_startIndex)

        //assert(BigInt(this.users.length) >= _startIndex)

        //// results should start off with 0s
        //const results: BigInt[] = []
        //for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            //results.push(BigInt(0))
        //}

        //// Compute the cumulative total up till startIndex - 1 (since we should
        //// ignore the 0th leaf)
        //for (let i = 0; i < Number(_startIndex) - 1; i ++) {
            //const user = this.users[i]
            //for (let j = 0; j < user.votes.length; j++) {
                //results[j] = BigInt(results[j]) + BigInt(user.votes[j]) * BigInt(user.votes[j])
            //}
        //}

        //return results
    //}


    /*
     * Computes the cumulative total of voice credits spent up to _startIndex.
     * Ignores the zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     * are included in the tally.
     */
    //public computeCumulativeSpentVoiceCredits = (
        //_startIndex: BigInt,
    //): BigInt => {
        //_startIndex = BigInt(_startIndex)

        //assert(BigInt(this.users.length) >= _startIndex)

        //if (_startIndex === BigInt(0)) {
            //return BigInt(0)
        //}

        //let result = BigInt(0)
        //for (let i = 0; i < Number(_startIndex) - 1; i++) {
            //const user = this.users[i]
            //for (let j = 0; j < user.votes.length; j++) {
                //result = BigInt(result) + BigInt(user.votes[j]) * BigInt(user.votes[j])
            //}
        //}

        //return result
    //}

    /*
     * Compute the number of voice credits spent in a batch of state leaves
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    //public computeBatchSpentVoiceCredits = (
        //_startIndex: BigInt,
        //_batchSize: number,
    //): BigInt => {
        //_startIndex = BigInt(_startIndex)

        //// Check whether _startIndex is within range.
        //assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        //// Check whether _startIndex is a multiple of _batchSize
        //assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        //// Compute the spent voice credits
        //if (_startIndex === BigInt(0)) {
            //_batchSize --
        //} else {
            //_startIndex = BigInt(_startIndex) - BigInt(1)
        //}

        //let result = BigInt(0)
        //for (let i = 0; i < _batchSize; i++) {
            //const userIndex = BigInt(_startIndex) + BigInt(i)
            //if (userIndex < this.users.length) {
                //for (const vote of this.users[Number(userIndex)].votes) {
                    //result += BigInt(vote) * BigInt(vote)
                //}
            //} else {
                //break
            //}
        //}
        //return result
    //}

    /*
     * Compute the number of voice credits spent per vote option in a batch of
     * state leaves
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    //public computeBatchPerVOSpentVoiceCredits = (
        //_startIndex: BigInt,
        //_batchSize: number,
    //): BigInt[] => {
        //_startIndex = BigInt(_startIndex)

        //// Check whether _startIndex is within range.
        //assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        //// Check whether _startIndex is a multiple of _batchSize
        //assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        //// Compute the spent voice credits
        //if (_startIndex === BigInt(0)) {
            //_batchSize --
        //} else {
            //_startIndex = BigInt(_startIndex) - BigInt(1)
        //}

        //// Fill results with 0s
        //const results: BigInt[] = []
        //for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            //results.push(BigInt(0))
        //}

        //for (let i = 0; i < _batchSize; i++) {
            //const userIndex = BigInt(_startIndex) + BigInt(i)
            //if (userIndex < this.users.length) {
                //const votes = this.users[Number(userIndex)].votes
                //for (let j = 0; j < votes.length; j++) {
                    //results[j] = BigInt(results[j]) + BigInt(votes[j]) * BigInt(votes[j])
                //}
            //} else {
                //break
            //}
        //}

        //return results
    //}

    /*
     * Compute the vote tally up to the specified state tree index. Ignores the
     * zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     *                    are included in the tally.
     */
    //public computeCumulativeVoteTally = (
        //_startIndex: BigInt,
    //): BigInt[] => {
        //assert(BigInt(this.users.length) >= _startIndex)

        //// results should start off with 0s
        //const results: BigInt[] = []
        //for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            //results.push(BigInt(0))
        //}

        //// Compute the cumulative total up till startIndex - 1 (since we should
        //// ignore the 0th leaf)
        //for (let i = 0; i < Number(_startIndex) - 1; i++) {
            //const user = this.users[i]
            //for (let j = 0; j < user.votes.length; j++) {
                //results[j] = BigInt(results[j]) + BigInt(user.votes[j])
            //}
        //}

        //return results
    //}

    /*
     * Tallies the votes for a batch of users. This does not perform a
     * cumulative tally. This works as long as the _startIndex is lower than
     * the total number of users. e.g. if _batchSize is 4, there are 10 users,
     * and _startIndex is 8, this function will tally the votes from the last 2
     * users.
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    //public computeBatchVoteTally = (
        //_startIndex: BigInt,
        //_batchSize: number,
    //): BigInt[] => {
        //_startIndex = BigInt(_startIndex)

        //// Check whether _startIndex is within range.
        //assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        //// Check whether _startIndex is a multiple of _batchSize
        //assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        //// Fill results with 0s
        //const results: BigInt[] = []
        //for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            //results.push(BigInt(0))
        //}

        //// Compute the tally
        //if (_startIndex === BigInt(0)) {
            //_batchSize--
        //} else {
            //_startIndex = BigInt(_startIndex) - BigInt(1)
        //}

        //for (let i = 0; i < _batchSize; i++) {
            //const userIndex = BigInt(_startIndex) + BigInt(i)
            //if (userIndex < this.users.length) {
                //const votes = this.users[Number(userIndex)].votes
                //for (let j = 0; j < votes.length; j++) {
                    //results[j] = BigInt(results[j]) + BigInt(votes[j])
                //}
            //} else {
                //break
            //}
        //}

        //return results
    //}

    //public genBlankLeaf = (): StateLeaf => {
        //return StateLeaf.genBlankLeaf(this.emptyVoteOptionTreeRoot)
    //}

    /*
     * Generates circuit inputs to the QuadVoteTally function.
     * @param _startIndex The index of the first state leaf in the tree
     * @param _batchSize The number of leaves per batch of state leaves
     * @param _currentResultsSalt The salt for the cumulative vote tally
     * @param _newResultsSalt The salt for the new vote tally
     */
    //public genQuadVoteTallyCircuitInputs = (
        //_startIndex: BigInt,
        //_batchSize: number,
        //_currentResultsSalt: BigInt,
        //_newResultsSalt: BigInt,
        //_currentSpentVoiceCreditsSalt: BigInt,
        //_newSpentVoiceCreditsSalt: BigInt,
        //_currentPerVOSpentVoiceCreditsSalt: BigInt,
        //_newPerVOSpentVoiceCreditsSalt: BigInt,
    //) => {
        //_startIndex = BigInt(_startIndex)
        //_currentResultsSalt = BigInt(_currentResultsSalt)
        //_newResultsSalt = BigInt(_newResultsSalt)

        //if (_startIndex === BigInt(0)) {
            //assert(_currentResultsSalt === BigInt(0))
        //}

        //// Compute the spent voice credits per vote option up to the _startIndex
        //const currentPerVOSpentVoiceCredits
            //= this.computeCumulativePerVOSpentVoiceCredits(_startIndex)

        //const currentPerVOSpentVoiceCreditsCommitment = genPerVOSpentVoiceCreditsCommitment(
            //currentPerVOSpentVoiceCredits,
            //_currentPerVOSpentVoiceCreditsSalt,
            //this.voteOptionTreeDepth,
        //)

        //// Compute the total number of spent voice credits up to the _startIndex
        //const currentSpentVoiceCredits 
            //= this.computeCumulativeSpentVoiceCredits(_startIndex)

        //// Compute the commitment to the total spent voice credits
        //const currentSpentVoiceCreditsCommitment
            //= genSpentVoiceCreditsCommitment(
                //currentSpentVoiceCredits,
                //_currentSpentVoiceCreditsSalt,
            //)

        //const currentResults = this.computeCumulativeVoteTally(_startIndex)
        //const batchResults = this.computeBatchVoteTally(_startIndex, _batchSize)

        //assert(currentResults.length === batchResults.length)

        //const newResults: BigInt[] = []
        //for (let i = 0; i < currentResults.length; i++) {
            //newResults[i] = BigInt(currentResults[i]) + BigInt(batchResults[i])
        //}

        //const currentResultsCommitment = genTallyResultCommitment(
            //currentResults,
            //_currentResultsSalt,
            //this.voteOptionTreeDepth,
        //)

        //const blankStateLeaf = this.genBlankLeaf()

        //const blankStateLeafHash = blankStateLeaf.hash()

        //const batchTreeDepth = Math.log2(Number(_batchSize))

        //const stateLeaves: StateLeaf[] = []
        //const voteLeaves: BigInt[][] = []

        //if (_startIndex === BigInt(0)) {
            //stateLeaves.push(this.zerothStateLeaf)
            //voteLeaves.push(this.genBlankVotes())
        //}

        //for (let i = 0; i < _batchSize; i++) {
            //if (_startIndex === BigInt(0) && i === 0) {
                //continue
            //}

            //const userIndex = Number(_startIndex) + i - 1
            //if (userIndex < this.users.length) {
                //stateLeaves.push(
                    //this.users[userIndex]
                        //.genStateLeaf(this.voteOptionTreeDepth)
                //)
                //voteLeaves.push(this.users[userIndex].votes)
            //} else {
                //stateLeaves.push(blankStateLeaf)
                //voteLeaves.push(this.genBlankVotes())
            //}
        //}

        //// We need to generate the following in order to create the
        //// intermediate tree path:
        //// 1. The tree whose leaves are the state leaves are the roots of
        ////    subtrees (the intermediate tree)
        //// 2. Each batch tree whose leaves are state leaves

        //const emptyBatchTree = new IncrementalQuinTree(
            //batchTreeDepth,
            //blankStateLeafHash,
            //2,
        //)

        //const intermediateTree = new IncrementalQuinTree(
            //this.stateTreeDepth - batchTreeDepth,
            //emptyBatchTree.root,
            //2,
        //)

        //// For each batch, create a tree of the leaves in the batch, and insert the
        //// tree root into the intermediate tree
        //for (let i = 0; i < 2 ** Number(this.stateTreeDepth); i += Number(_batchSize)) {

            //// Use this batchTree to accumulate the leaves in the batch
            //const batchTree = emptyBatchTree.copy()

            //for (let j = 0; j < Number(_batchSize); j++) {
                //if (i === 0 && j === 0) {
                    //batchTree.insert(this.zerothStateLeaf.hash())
                //} else {
                    //const userIndex = i + j - 1
                    //if (userIndex < this.users.length) {
                        //const leaf = this.users[userIndex]
                            //.genStateLeaf(Number(this.voteOptionTreeDepth)).hash()
                        //batchTree.insert(leaf)
                    //}
                //}
            //}

            //// Insert the root of the batch tree
            //intermediateTree.insert(batchTree.root)
        //}

        //assert(intermediateTree.root === this.genStateRoot())

        //const intermediatePathIndex = BigInt(_startIndex) / BigInt(_batchSize)
        //const intermediateStateRoot = intermediateTree.leaves[Number(intermediatePathIndex)]
        //const intermediatePathElements = intermediateTree.genMerklePath(Number(intermediatePathIndex)).pathElements

        //const a = BigInt(Math.ceil(
            //(this.users.length + 1) / Number(_batchSize)
        //) - 1)

        //const isLastBatch = intermediatePathIndex  === a

        //const circuitInputs = stringifyBigInts({
            //isLastBatch: isLastBatch ? BigInt(1) : BigInt(0),
            //voteLeaves,
            //stateLeaves: stateLeaves.map((x) => x.asCircuitInputs()),
            //fullStateRoot: this.genStateRoot(),

            //currentResults,
            //currentResultsCommitment,
            //currentResultsSalt: _currentResultsSalt,

            //newResultsSalt: _newResultsSalt,

            //currentSpentVoiceCredits,
            //currentSpentVoiceCreditsSalt: _currentSpentVoiceCreditsSalt,
            //currentSpentVoiceCreditsCommitment,
            //newSpentVoiceCreditsSalt: _newSpentVoiceCreditsSalt,

            //currentPerVOSpentVoiceCredits,
            //currentPerVOSpentVoiceCreditsCommitment,
            //currentPerVOSpentVoiceCreditsSalt: _currentPerVOSpentVoiceCreditsSalt,
            //newPerVOSpentVoiceCreditsSalt: _newPerVOSpentVoiceCreditsSalt,

            //intermediatePathElements,
            //intermediatePathIndex,
            //intermediateStateRoot,
        //})

        //return circuitInputs
    //}
//}

/*
 * A helper function which returns the hash of the total number of spent voice
 * credits and a salt.
 *
 * @param voiceCredits The number of voice credits
 * @parm salt A random salt
 * @return The hash of the number of voice credits and the salt
 */
//const genSpentVoiceCreditsCommitment = (
    //vc: BigInt,
    //salt: BigInt,
//): BigInt => {
    //return hashLeftRight(vc, salt)
//}

/*
 * A helper function which hashes a list of results with a salt and returns the
 * hash.
 *
 * @param results A list of vote weights
 * @parm salt A random salt
 * @return The hash of the results and the salt, with the salt last
 */
const genTallyResultCommitment = (
    results: BigInt[],
    salt: BigInt,
    voteOptionTreeDepth: number,
): BigInt => {

    const tree = new IncrementalQuinTree(voteOptionTreeDepth, BigInt(0))
    for (const result of results) {
        tree.insert(BigInt(result))
    }
    return hashLeftRight(tree.root, salt)
}

//const genPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment

//export {
    //genPerVOSpentVoiceCreditsCommitment,
    //genSpentVoiceCreditsCommitment,
    //genTallyResultCommitment,
    //MaciState,
//}
