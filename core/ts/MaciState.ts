import * as assert from 'assert'
import {
    AccQueue,
    IncrementalQuinTree,
    SNARK_FIELD_SIZE,
    NOTHING_UP_MY_SLEEVE,
    hashLeftRight,
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
    public processVk: VerifyingKey
    public tallyVk: VerifyingKey
    public ballots: Ballot[] = []
    public messages: Message[] = []
    public encPubKeys: PubKey[] = []
    public messageAq: AccQueue
    public MESSAGE_TREE_ARITY = 5

    public stateTree = new IncrementalQuinTree(
        STATE_TREE_DEPTH,
        NOTHING_UP_MY_SLEEVE,
    )
    public stateLeaves: StateLeaf[] = []

    // For message processing
    public pmStateAq
    public currentStateRoot = BigInt(0)
    public numBatchesProcessed = 0
    public currentMessageBatchIndex = 0
    public zerothStateLeaf
    public maciStateRef
    
    // For vote tallying
    public results: BigInt[] = []
    public numBatchesTallied = 0

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
        this.messageAq = new AccQueue(
            this.treeDepths.messageTreeSubDepth,
            this.MESSAGE_TREE_ARITY,
            NOTHING_UP_MY_SLEEVE,
        )

        for (let i = 0; i < this.maxValues.maxVoteOptions; i ++) {
            this.results.push(BigInt(0))
        }
        this.stateTree = new IncrementalQuinTree(
            STATE_TREE_DEPTH,
            NOTHING_UP_MY_SLEEVE,
        )
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
    }

    /*
     * Merge all enqueued messages into a tree.
     */
    public mergeAllMessages = (
    ) => {
        this.messageAq.mergeSubRoots(0)
        this.messageAq.merge(this.treeDepths.messageTreeDepth)

        // TODO: Validate that a tree from this.messages matches the messageAq
        // main root
    }

    public hasUnprocessedMessages = (): boolean => {
        const batchSize = this.batchSizes.messageBatchSize

        const totalBatches =
            this.messages.length <= batchSize ?
            1
            : 
            Math.floor(this.messages.length / batchSize)

        return this.numBatchesProcessed < totalBatches
    }

    /*
     * Process _batchSize messages starting from the saved index, and then
     * update the zeroth state leaf. This function will process messages even
     * if the number of messages is not an exact multiple of _batchSize. e.g.
     * if there are 10 messages, _index is 8, and _batchSize is 4, this
     * function will only process the last two messages in this.messages, and
     * finally update the zeroth state leaf. Note that this function will only
     * process as many state leaves as there are ballots to prevent accidental
     * inclusion of a new user after this poll has concluded.
     * @param _pollId The ID of the poll associated with the messages to
     *        process
     * @param _randomStateLeaf A random state leaf which will take the place
     *     of the zeroth state leaf after all the messages in this batch
     *     are processed. This randomises the state root, even if all the
     *     commands are invalid.
     * @param _maciStateRef A reference to the MaciState object. It is needed
     *     as this function needs to make a deep copy of the state leaves at
     *     the point at which it is invoked.
     */
    public processMessages = (
        _pollId: number,
        _randomStateLeaf: StateLeaf,
        _maciStateRef?: MaciState,
    ) => {
        const batchSize = this.batchSizes.messageBatchSize

        assert(
            this.hasUnprocessedMessages(),
            'No more messages to process',
        )

        // The starting index must be valid
        assert(this.currentMessageBatchIndex >= 0)
        assert(this.currentMessageBatchIndex % batchSize === 0)

        // Require that the message queue has been merged
        assert(this.messageAq.hasRoot(this.treeDepths.messageTreeDepth))

        if (this.numBatchesProcessed === 0) {
            assert(_maciStateRef != null && _maciStateRef != undefined)
            this.maciStateRef = _maciStateRef
            // Prevent other polls from being processed until this poll has
            // been fully processed
            this.maciStateRef.pollBeingProcessed = true
            this.maciStateRef.currentPollBeingProcessed = _pollId
        }

        // Only allow one poll to be processed at a time
        if (this.maciStateRef.pollBeingProcessed) {
            assert(this.maciStateRef.currentPollBeingProcessed === _pollId)
        }

        // The first time this function is called, deep-copy the state queue,
        // state root, and state leaves into this object, and set the current
        // message batch index
        if (this.numBatchesProcessed === 0) {
            // Deep-copy the state tree from the MaciState
            this.stateTree = this.maciStateRef.stateTree.copy()
            this.stateLeaves = this.maciStateRef.stateLeaves.map((x) => x.copy())

            // Populate this.ballots with empty ballots for each real state
            // leaf (i.e. excluding the 0th state leaf)
            for (let i = 0; i < this.stateTree.leaves.length - 1; i ++) {
                this.ballots.push(
                    new Ballot(
                        this.maxValues.maxVoteOptions,
                        this.treeDepths.voteOptionTreeDepth,
                    ),
                )
            }

            // Deep-copy the state AccQueue
            this.pmStateAq = this.maciStateRef.stateAq.copy()

            // Compute the state root
            this.currentStateRoot =
                BigInt(this.pmStateAq.getRoot(STATE_TREE_DEPTH))

            // The starting index of the batch of messages to process
            this.currentMessageBatchIndex = 
                (
                    Math.floor(this.messageAq.numLeaves / batchSize)  - 1
                ) * batchSize
        }

        for (let i = 0; i < batchSize; i++) {
            // Note that messages are processed in reverse order.
            const messageIndex =
                this.currentMessageBatchIndex + batchSize - i - 1

            // Ignore indices which do not exist. This happens during the first
            // batch if the number of messages is not a product of the batch
            // size.
            if (this.messages.length <= messageIndex) {
                continue
            }

            const r = this.processMessage(messageIndex)
            if (r) {
                // TODO: replace with try/catch after implementing error
                // handling
                const index = r.stateLeafIndex
                this.stateTree.update(index, r.newStateLeaf.hash())
                this.stateLeaves[index] = r.newStateLeaf.copy()
                this.ballots[index] = r.newBallot
            }
        }

        // Replace the zeroth state leaf
        this.zerothStateLeaf = _randomStateLeaf

        // Recompute the state root
        this.stateTree.update(0, this.zerothStateLeaf.hash())
        this.currentStateRoot = BigInt(this.stateTree.root)

        this.numBatchesProcessed ++

        if (this.currentMessageBatchIndex > 0) {
            this.currentMessageBatchIndex -= batchSize
        }

        // If this is the last batch, release the lock
        if (this.numBatchesProcessed * batchSize >= this.messages.length) {
            this.maciStateRef.pollBeingProcessed = false
        }
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
     * TODO: replace with a version that does not change state
     */
    private processMessage = (
        _index: number,
    ) => {
        //TODO: return codes for no-ops

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

        // If the state tree index in the command is invalid, do nothing
        if (
            command.stateIndex > BigInt(this.ballots.length) ||
            command.stateIndex <= BigInt(0)
        ) {
            return
        }

        // The index of the state leaf in this.stateLeaves is one less than
        // the state tree index of the correspondng state leaf. This is because
        // the zeroth state leaf is a random value.
        const stateLeafIndex = BigInt(command.stateIndex) - BigInt(1)

        assert(BigInt(this.stateTree.leaves.length) > stateLeafIndex)

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

        // Deep-copy the ballot and update its attributes
        const newBallot = ballot.copy()
        newBallot.nonce = BigInt(newBallot.nonce) + BigInt(1)
        newBallot.votes[Number(command.voteOptionIndex)] =
            command.newVoteWeight

        // Replace the ballot
        this.ballots[Number(stateLeafIndex)] = newBallot

        // Deep-copy the stateLeaf and update its attributes
        const newStateLeaf = stateLeaf.copy()
        newStateLeaf.voiceCreditBalance = voiceCreditsLeft
        newStateLeaf.pubKey = command.newPubKey.copy()

        // Replace the state leaf
        this.stateLeaves[Number(stateLeafIndex)] = newStateLeaf

        return {
            newStateLeaf,
            newBallot,
            stateLeafIndex: Number(stateLeafIndex),
        }
    }

    public hasUntalliedBallots = () => {
        const batchSize = this.batchSizes.tallyBatchSize
        return this.numBatchesTallied * batchSize < this.ballots.length
    }

    public tallyBallots = () => {

        const batchSize = this.batchSizes.tallyBatchSize

        assert(
            this.hasUntalliedBallots(),
            'No more ballots to tally',
        )

        for (
            let i = this.numBatchesTallied * batchSize;
            i < this.numBatchesTallied * batchSize + batchSize;
            i ++
        ) {
            if (i >= this.ballots.length) {
                break
            }

            for (let j = 0; j < this.maxValues.maxVoteOptions; j++) {
                this.results[j] = 
                    BigInt(this.results[j]) + BigInt(this.ballots[i].votes[j])
            }
        }

        this.numBatchesTallied ++
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
        )

        copied.messages = this.messages.map((x: Message) => x.copy())
        copied.ballots = this.ballots.map((x: Ballot) => x.copy())
        copied.encPubKeys = this.encPubKeys.map((x: PubKey) => x.copy())

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
        this.STATE_TREE_SUBDEPTH,
        NOTHING_UP_MY_SLEEVE,
        this.STATE_TREE_ARITY,
    )
    public stateAq: AccQueue = new AccQueue(
        this.STATE_TREE_SUBDEPTH,
        this.STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
    )
    public pollBeingProcessed = true
    public currentPollBeingProcessed

    constructor() {
        this.stateAq.enqueue(NOTHING_UP_MY_SLEEVE)
        this.stateTree.insert(NOTHING_UP_MY_SLEEVE)
    }

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
        )

        this.polls.push(poll)
        return this.polls.length - 1
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
