import * as assert from 'assert'
import {
    PubKey,
    Command,
    Message,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    hashLeftRight,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
    IncrementalQuinTree,
} from 'maci-crypto'

import { User } from './User'

class MaciState {
    public coordinatorKeypair: Keypair
    public users: User[] = []
    public stateTreeDepth: number
    public messageTreeDepth: number
    public voteOptionTreeDepth: number
    public messages: Message[] = []
    public zerothStateLeaf: StateLeaf
    public maxVoteOptionIndex: BigInt
    public encPubKeys: PubKey[] = []
    private emptyVoteOptionTreeRoot
    private currentResultsSalt: BigInt = BigInt(0)

    // encPubKeys contains the public keys used to generate ephemeral shared
    // keys which encrypt each message

    constructor(
        _coordinatorKeypair: Keypair,
        _stateTreeDepth: BigInt,
        _messageTreeDepth: BigInt,
        _voteOptionTreeDepth: BigInt,
        _maxVoteOptionIndex: BigInt,
    ) {

        this.coordinatorKeypair = _coordinatorKeypair
        this.stateTreeDepth = Number(_stateTreeDepth)
        this.messageTreeDepth = Number(_messageTreeDepth)
        this.voteOptionTreeDepth = Number(_voteOptionTreeDepth)
        this.maxVoteOptionIndex = BigInt(_maxVoteOptionIndex)

        const emptyVoteOptionTree = new IncrementalQuinTree(
            this.voteOptionTreeDepth,
            BigInt(0),
        )
        this.emptyVoteOptionTreeRoot = emptyVoteOptionTree.root

        this.zerothStateLeaf = this.genBlankLeaf()
    }

    /*
     * Return an array of zeroes (0) of length 5 ** voteOptionTreeDepth
     */
    private genBlankVotes = () => {
        const votes: BigInt[] = []
        for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i ++) {
            votes.push(BigInt(0))
        }

        return votes
    }

    /*
     * Returns an IncrementalMerkleTree where the zeroth leaf is
     * this.zerothStateLeaf and the other leaves are the Users as hashed
     * StateLeaf objects
     */
    public genStateTree = (): IncrementalQuinTree => {
        const stateTree = new IncrementalQuinTree(
            this.stateTreeDepth,
            this.genBlankLeaf().hash(),
            2,
        )

        stateTree.insert(this.zerothStateLeaf.hash())

        for (const user of this.users) {
            const stateLeaf = user.genStateLeaf(this.voteOptionTreeDepth)
            stateTree.insert(stateLeaf.hash())
        }
        return stateTree
    }

    /*
     * Computes the state root
     */
    public genStateRoot = (): BigInt => {
        return this.genStateTree().root
    }

    /*
     * Returns an IncrementalMerkleTree of all messages
     */
    public genMessageTree = (): IncrementalQuinTree => {
        const messageTree = new IncrementalQuinTree(
            this.messageTreeDepth,
            NOTHING_UP_MY_SLEEVE,
            2,
        )

        for (const message of this.messages) {
            messageTree.insert(message.hash())
        }

        return messageTree
    }

    public genMessageRoot = (): BigInt => {
        return this.genMessageTree().root
    }

    /*
     * Deep-copy this object
     */
    public copy = (): MaciState => {
        const copied = new MaciState(
            this.coordinatorKeypair.copy(),
            BigInt(this.stateTreeDepth.toString()),
            BigInt(this.messageTreeDepth.toString()),
            BigInt(this.voteOptionTreeDepth.toString()),
            BigInt(this.maxVoteOptionIndex.toString()),
        )

        copied.users = this.users.map((x: User) => x.copy())
        copied.messages = this.messages.map((x: Message) => x.copy())
        copied.encPubKeys = this.encPubKeys.map((x: PubKey) => x.copy())

        return copied
    }

    /*
     * Add a new user to the list of users.
     */
    public signUp = (
        _pubKey: PubKey,
        _initialVoiceCreditBalance: BigInt,
    ) => {

        // Note that we do not insert a state leaf to any state tree here. This
        // is because we want to keep the state minimal, and only compute what
        // is necessary when it is needed. This may change if we run into
        // severe performance issues, but it is currently worth the tradeoff.
        this.users.push(
            new User(
                _pubKey,
                this.genBlankVotes(),
                _initialVoiceCreditBalance,
                BigInt(0),
            )
        )
    }

    /*
     * Inserts a Message into the list of messages, as well as the
     * corresponding public key used to generate the ECDH shared key which was
     * used to encrypt said message.
     */
    public publishMessage = (
        _message: Message,
        _encPubKey: PubKey,
    ) => {
        // TODO: validate _encPubKey and _message

        this.encPubKeys.push(_encPubKey)
        this.messages.push(_message)
    }

    /*
     * Process the message at index _index of the message array. Note that
     * _index is not the state leaf index, as leaf 0 of the state tree is a
     * random value.
     */
    public processMessage = (
        _index: number,
    ) => {
        assert(this.messages.length > _index)
        assert(this.encPubKeys.length === this.messages.length)

        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]

        // Decrypt the message
        const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey)
        const { command, signature } = Command.decrypt(message, sharedKey)

        // If the state tree index in the command is invalid, do nothing
        if (command.stateIndex > BigInt(this.users.length)) {
            return
        }

        const userIndex = BigInt(command.stateIndex) - BigInt(1)

        assert(BigInt(this.users.length) > userIndex)

        // The user to update (or not)
        const user = this.users[Number(userIndex)]

        // If the signature is invalid, do nothing
        if (!command.verifySignature(signature, user.pubKey)) {
            return
        }

        // If the nonce is invalid, do nothing
        if (command.nonce !== BigInt(user.nonce) + BigInt(1)) {
            return
        }

        // If there are insufficient vote credits, do nothing
        const prevSpentCred = user.votes[Number(command.voteOptionIndex)]

        const voiceCreditsLeft =
            BigInt(user.voiceCreditBalance) +
            (BigInt(prevSpentCred) * BigInt(prevSpentCred)) -
            (BigInt(command.newVoteWeight) * BigInt(command.newVoteWeight))

        if (voiceCreditsLeft < 0) {
            return
        }

        // If the vote option index is invalid, do nothing
        if (command.voteOptionIndex > this.maxVoteOptionIndex) {
            return
        }

        // Update the user's vote option tree, pubkey, voice credit balance,
        // and nonce
        const newVotesArr: BigInt[] = []
        for (let i = 0; i < this.users.length; i++) {
            if (i === Number(command.voteOptionIndex)) {
                newVotesArr.push(command.newVoteWeight)
            } else {
                newVotesArr.push(BigInt(user.votes[i].toString()))
            }
        }

        // Deep-copy the user and update its attributes
        const newUser = user.copy()
        newUser.nonce = BigInt(newUser.nonce) + BigInt(1)
        newUser.votes[Number(command.voteOptionIndex)] = command.newVoteWeight
        newUser.voiceCreditBalance = voiceCreditsLeft
        newUser.pubKey = command.newPubKey.copy()

        // Replace the entry in this.users
        this.users[Number(userIndex)] = newUser
    }

    /*
     * Process _batchSize messages starting from _index, and then update
     * zerothStateLeaf. This function will process messages even if the number
     * of messages is not an exact multiple of _batchSize. e.g. if there are 10
     * messages, _index is 8, and _batchSize is 4, this function will only
     * process the last two messages in this.messages, and finally update
     * this.zerothStateLeaf
     */
    public batchProcessMessage = (
        _index: number,
        _batchSize: number,
        _randomStateLeaf: StateLeaf,
    ) => {
        assert(this.messages.length > _index)

        for (let i = 0; i < _batchSize; i++) {
            const messageIndex = _index + _batchSize - i - 1;

            if (this.messages.length <= messageIndex) {
                continue
            }

            this.processMessage(messageIndex)
        }
        this.zerothStateLeaf = _randomStateLeaf
    }

    /*
     * Generates inputs to the UpdateStateTree circuit. Do not call
     * processMessage() or batchProcessMessage() before this function.
     */
    public genUpdateStateTreeCircuitInputs = (
        _index: number,
    ) => {
        assert(this.messages.length > _index)
        assert(this.encPubKeys.length === this.messages.length)

        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]
        const sharedKey = Keypair.genEcdhSharedKey(
            this.coordinatorKeypair.privKey,
            encPubKey,
        )
        const { command } = Command.decrypt(message, sharedKey)

        const messageTree = this.genMessageTree()
        const msgTreePath = messageTree.genMerklePath(_index)
        assert(IncrementalQuinTree.verifyMerklePath(msgTreePath, messageTree.hashFunc))

        const stateTree = this.genStateTree()
        const stateTreeMaxIndex = BigInt(stateTree.nextIndex) - BigInt(1)

        const userIndex = BigInt(command.stateIndex) - BigInt(1)
        assert(BigInt(this.users.length) > userIndex)

        const user = this.users[Number(userIndex)]

        const currentVoteWeight = user.votes[Number(command.voteOptionIndex)]

        const voteOptionTree = new IncrementalQuinTree(
            this.voteOptionTreeDepth,
            BigInt(0),
        )

        for (const vote of user.votes) {
            voteOptionTree.insert(vote)
        }

        const voteOptionTreePath = voteOptionTree.genMerklePath(Number(command.voteOptionIndex))
        assert(IncrementalQuinTree.verifyMerklePath(voteOptionTreePath, voteOptionTree.hashFunc))

        const stateTreePath = stateTree.genMerklePath(Number(command.stateIndex))
        assert(IncrementalQuinTree.verifyMerklePath(stateTreePath, stateTree.hashFunc))

        const stateLeaf = user.genStateLeaf(this.voteOptionTreeDepth)

        return stringifyBigInts({
            'coordinator_public_key': this.coordinatorKeypair.pubKey.asCircuitInputs(),
            'ecdh_private_key': this.coordinatorKeypair.privKey.asCircuitInputs(),
            'ecdh_public_key': encPubKey.asCircuitInputs(),
            'message': message.asCircuitInputs(),
            'msg_tree_root': messageTree.root,
            'msg_tree_path_elements': msgTreePath.pathElements,
            'msg_tree_path_index': msgTreePath.indices,
            'vote_options_leaf_raw': currentVoteWeight,
            'vote_options_tree_root': voteOptionTree.root,
            'vote_options_tree_path_elements': voteOptionTreePath.pathElements,
            'vote_options_tree_path_index': voteOptionTreePath.indices,
            'vote_options_max_leaf_index': this.maxVoteOptionIndex,
            'state_tree_data_raw': stateLeaf.asCircuitInputs(),
            'state_tree_max_leaf_index': stateTreeMaxIndex,
            'state_tree_root': stateTree.root,
            'state_tree_path_elements': stateTreePath.pathElements,
            'state_tree_path_index': stateTreePath.indices,
        })
    }

    /*
     * Generates inputs to the BatchUpdateStateTree circuit. Do not call
     * processMessage() or batchProcessMessage() before this function.
     */
    public genBatchUpdateStateTreeCircuitInputs = (
        _index: number,
        _batchSize: number,
        _randomStateLeaf: StateLeaf,
    ) => {

        assert(this.messages.length > _index)
        assert(this.encPubKeys.length === this.messages.length)

        const stateLeaves: StateLeaf[] = []
        const stateRoots: BigInt[] = []
        const stateTreePathElements: BigInt[][] = []
        const stateTreePathIndices: BigInt[][] = []
        const voteOptionLeaves: BigInt[] = []
        const voteOptionTreeRoots: BigInt[] = []
        const voteOptionTreePathElements: BigInt[][] = []
        const voteOptionTreePathIndices: BigInt[][] = []
        const messageTreePathElements: any[] = []
        const messages: any[] = []
        const encPubKeys: any[] = []

        const clonedMaciState = this.copy()
        const messageTree = clonedMaciState.genMessageTree()

        // prevInputs is the most recent set of UST circuit inputs generated from the
        // most recently processed message. In effect, even if there are not as
        // many messages to process as the batch size, we can still use the
        // circuit. e.g. if batchSize is 4, messageIndex is 0, and there is
        // only 1 message, and the ustCircuitInputs for message 0 is x, then
        // the circuit inputs for this batch is [x, x, x, x]. This is fine as
        // the last three x-s will either be no-ops or do the same thing as the
        // first x.
        let numRealMessages = BigInt(0)

        const messageIndices: number[] = []
        for (let i = 0; i < _batchSize; i++) {
            const j = _index + i
            if (j < BigInt(clonedMaciState.messages.length)) {
                messageIndices.push(_index + i)
                numRealMessages = numRealMessages + BigInt(1)
            } else {
                messageIndices.push(clonedMaciState.messages.length - 1)
            }
        }

        // process the messages in reverse order
        messageIndices.reverse()

        let messageIndex
        for (let i = 0; i < _batchSize; i++) {
            messageIndex = messageIndices[i]

            // Generate circuit inputs for the message
            const ustCircuitInputs = clonedMaciState.genUpdateStateTreeCircuitInputs(messageIndex)

            if (messageIndex < BigInt(clonedMaciState.messages.length)) {
                // Process the message
                clonedMaciState.processMessage(messageIndex)
            }

            messages.push(clonedMaciState.messages[messageIndex])
            encPubKeys.push(clonedMaciState.encPubKeys[messageIndex])

            messageTreePathElements.push(ustCircuitInputs.msg_tree_path_elements)
            stateRoots.push(ustCircuitInputs.state_tree_root)
            stateTreePathElements.push(ustCircuitInputs.state_tree_path_elements)
            stateTreePathIndices.push(ustCircuitInputs.state_tree_path_index)
            voteOptionLeaves.push(ustCircuitInputs.vote_options_leaf_raw)
            stateLeaves.push(ustCircuitInputs.state_tree_data_raw)
            voteOptionTreeRoots.push(ustCircuitInputs.vote_options_tree_root)
            voteOptionTreePathElements.push(ustCircuitInputs.vote_options_tree_path_elements)
            voteOptionTreePathIndices.push(ustCircuitInputs.vote_options_tree_path_index)
        }

        const stateTree = clonedMaciState.genStateTree()

        const randomLeafRoot = stateTree.root

        // Insert the random leaf
        stateTree.update(0, _randomStateLeaf.hash())

        const randomStateLeafPathElements = stateTree.genMerklePath(0).pathElements

        return stringifyBigInts({
            'coordinator_public_key': clonedMaciState.coordinatorKeypair.pubKey.asCircuitInputs(),
            'message': messages.map((x) => x.asCircuitInputs()),
            'ecdh_private_key': clonedMaciState.coordinatorKeypair.privKey.asCircuitInputs(),
            'ecdh_public_key': encPubKeys.map((x) => x.asCircuitInputs()),
            'msg_tree_root': messageTree.root,
            'msg_tree_path_elements': messageTreePathElements,
            'msg_tree_batch_start_index': _index,
            'msg_tree_batch_end_index': BigInt(_index) + numRealMessages - BigInt(1),
            'random_leaf': _randomStateLeaf.hash(),
            'state_tree_root': stateRoots,
            'state_tree_path_elements': stateTreePathElements,
            'state_tree_path_index': stateTreePathIndices,
            'random_leaf_root': randomLeafRoot,
            'random_leaf_path_elements': randomStateLeafPathElements,
            'vote_options_leaf_raw': voteOptionLeaves,
            'state_tree_data_raw': stateLeaves,
            'state_tree_max_leaf_index': BigInt(stateTree.nextIndex) - BigInt(1),
            'vote_options_max_leaf_index': clonedMaciState.maxVoteOptionIndex,
            'vote_options_tree_root': voteOptionTreeRoots,
            'vote_options_tree_path_elements': voteOptionTreePathElements,
            'vote_options_tree_path_index': voteOptionTreePathIndices,
        })
    }

    /*
     * Computes the total number of voice credits per vote option spent up to
     * _startIndex. Ignores the zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     * are included in the tally.
     */
    public computeCumulativePerVOSpentVoiceCredits = (
        _startIndex: BigInt,
    ): BigInt[] => {
        _startIndex = BigInt(_startIndex)

        assert(BigInt(this.users.length) >= _startIndex)

        // results should start off with 0s
        const results: BigInt[] = []
        for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            results.push(BigInt(0))
        }

        // Compute the cumulative total up till startIndex - 1 (since we should
        // ignore the 0th leaf)
        for (let i = 0; i < Number(_startIndex) - 1; i ++) {
            const user = this.users[i]
            for (let j = 0; j < user.votes.length; j++) {
                results[j] = BigInt(results[j]) + BigInt(user.votes[j]) * BigInt(user.votes[j])
            }
        }

        return results
    }


    /*
     * Computes the cumulative total of voice credits spent up to _startIndex.
     * Ignores the zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     * are included in the tally.
     */
    public computeCumulativeSpentVoiceCredits = (
        _startIndex: BigInt,
    ): BigInt => {
        _startIndex = BigInt(_startIndex)

        assert(BigInt(this.users.length) >= _startIndex)

        if (_startIndex === BigInt(0)) {
            return BigInt(0)
        }

        let result = BigInt(0)
        for (let i = 0; i < Number(_startIndex) - 1; i++) {
            const user = this.users[i]
            for (let j = 0; j < user.votes.length; j++) {
                result = BigInt(result) + BigInt(user.votes[j]) * BigInt(user.votes[j])
            }
        }

        return result
    }

    /*
     * Compute the number of voice credits spent in a batch of state leaves
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    public computeBatchSpentVoiceCredits = (
        _startIndex: BigInt,
        _batchSize: number,
    ): BigInt => {
        _startIndex = BigInt(_startIndex)

        // Check whether _startIndex is within range.
        assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        // Check whether _startIndex is a multiple of _batchSize
        assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        // Compute the spent voice credits
        if (_startIndex === BigInt(0)) {
            _batchSize --
        } else {
            _startIndex = BigInt(_startIndex) - BigInt(1)
        }

        let result = BigInt(0)
        for (let i = 0; i < _batchSize; i++) {
            const userIndex = BigInt(_startIndex) + BigInt(i)
            if (userIndex < this.users.length) {
                for (const vote of this.users[Number(userIndex)].votes) {
                    result += BigInt(vote) * BigInt(vote)
                }
            } else {
                break
            }
        }
        return result
    }

    /*
     * Compute the number of voice credits spent per vote option in a batch of
     * state leaves
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    public computeBatchPerVOSpentVoiceCredits = (
        _startIndex: BigInt,
        _batchSize: number,
    ): BigInt[] => {
        _startIndex = BigInt(_startIndex)

        // Check whether _startIndex is within range.
        assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        // Check whether _startIndex is a multiple of _batchSize
        assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        // Compute the spent voice credits
        if (_startIndex === BigInt(0)) {
            _batchSize --
        } else {
            _startIndex = BigInt(_startIndex) - BigInt(1)
        }

        // Fill results with 0s
        const results: BigInt[] = []
        for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            results.push(BigInt(0))
        }

        for (let i = 0; i < _batchSize; i++) {
            const userIndex = BigInt(_startIndex) + BigInt(i)
            if (userIndex < this.users.length) {
                const votes = this.users[Number(userIndex)].votes
                for (let j = 0; j < votes.length; j++) {
                    results[j] = BigInt(results[j]) + BigInt(votes[j]) * BigInt(votes[j])
                }
            } else {
                break
            }
        }

        return results
    }

    /*
     * Compute the vote tally up to the specified state tree index. Ignores the
     * zeroth state leaf.
     * @param _startIndex The state tree index. Only leaves before this index
     *                    are included in the tally.
     */
    public computeCumulativeVoteTally = (
        _startIndex: BigInt,
    ): BigInt[] => {
        assert(BigInt(this.users.length) >= _startIndex)

        // results should start off with 0s
        const results: BigInt[] = []
        for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            results.push(BigInt(0))
        }

        // Compute the cumulative total up till startIndex - 1 (since we should
        // ignore the 0th leaf)
        for (let i = 0; i < Number(_startIndex) - 1; i++) {
            const user = this.users[i]
            for (let j = 0; j < user.votes.length; j++) {
                results[j] = BigInt(results[j]) + BigInt(user.votes[j])
            }
        }

        return results
    }

    /*
     * Tallies the votes for a batch of users. This does not perform a
     * cumulative tally. This works as long as the _startIndex is lower than
     * the total number of users. e.g. if _batchSize is 4, there are 10 users,
     * and _startIndex is 8, this function will tally the votes from the last 2
     * users.
     * @param _startIndex The index of the first user in the batch
     * @param _batchSize The number of users to tally.
     */
    public computeBatchVoteTally = (
        _startIndex: BigInt,
        _batchSize: number,
    ): BigInt[] => {
        _startIndex = BigInt(_startIndex)

        // Check whether _startIndex is within range.
        assert(_startIndex >= BigInt(0) && _startIndex <= BigInt(this.users.length))

        // Check whether _startIndex is a multiple of _batchSize
        assert(BigInt(_startIndex) % BigInt(_batchSize) === BigInt(0))

        // Fill results with 0s
        const results: BigInt[] = []
        for (let i = 0; i < 5 ** this.voteOptionTreeDepth; i++) {
            results.push(BigInt(0))
        }

        // Compute the tally
        if (_startIndex === BigInt(0)) {
            _batchSize--
        } else {
            _startIndex = BigInt(_startIndex) - BigInt(1)
        }

        for (let i = 0; i < _batchSize; i++) {
            const userIndex = BigInt(_startIndex) + BigInt(i)
            if (userIndex < this.users.length) {
                const votes = this.users[Number(userIndex)].votes
                for (let j = 0; j < votes.length; j++) {
                    results[j] = BigInt(results[j]) + BigInt(votes[j])
                }
            } else {
                break
            }
        }

        return results
    }

    public genBlankLeaf = (): StateLeaf => {
        return StateLeaf.genBlankLeaf(this.emptyVoteOptionTreeRoot)
    }

    /*
     * Generates circuit inputs to the QuadVoteTally function.
     * @param _startIndex The index of the first state leaf in the tree
     * @param _batchSize The number of leaves per batch of state leaves
     * @param _currentResultsSalt The salt for the cumulative vote tally
     * @param _newResultsSalt The salt for the new vote tally
     */
    public genQuadVoteTallyCircuitInputs = (
        _startIndex: BigInt,
        _batchSize: number,
        _currentResultsSalt: BigInt,
        _newResultsSalt: BigInt,
        _currentSpentVoiceCreditsSalt: BigInt,
        _newSpentVoiceCreditsSalt: BigInt,
        _currentPerVOSpentVoiceCreditsSalt: BigInt,
        _newPerVOSpentVoiceCreditsSalt: BigInt,
    ) => {
        _startIndex = BigInt(_startIndex)
        _currentResultsSalt = BigInt(_currentResultsSalt)
        _newResultsSalt = BigInt(_newResultsSalt)

        if (_startIndex === BigInt(0)) {
            assert(_currentResultsSalt === BigInt(0))
        }

        // Compute the spent voice credits per vote option up to the _startIndex
        const currentPerVOSpentVoiceCredits
            = this.computeCumulativePerVOSpentVoiceCredits(_startIndex)

        const currentPerVOSpentVoiceCreditsCommitment = genPerVOSpentVoiceCreditsCommitment(
            currentPerVOSpentVoiceCredits,
            _currentPerVOSpentVoiceCreditsSalt,
            this.voteOptionTreeDepth,
        )

        // Compute the total number of spent voice credits up to the _startIndex
        const currentSpentVoiceCredits 
            = this.computeCumulativeSpentVoiceCredits(_startIndex)

        // Compute the commitment to the total spent voice credits
        const currentSpentVoiceCreditsCommitment
            = genSpentVoiceCreditsCommitment(
                currentSpentVoiceCredits,
                _currentSpentVoiceCreditsSalt,
            )

        const currentResults = this.computeCumulativeVoteTally(_startIndex)
        const batchResults = this.computeBatchVoteTally(_startIndex, _batchSize)

        assert(currentResults.length === batchResults.length)

        const newResults: BigInt[] = []
        for (let i = 0; i < currentResults.length; i++) {
            newResults[i] = BigInt(currentResults[i]) + BigInt(batchResults[i])
        }

        const currentResultsCommitment = genTallyResultCommitment(
            currentResults,
            _currentResultsSalt,
            this.voteOptionTreeDepth,
        )

        const blankStateLeaf = this.genBlankLeaf()

        const blankStateLeafHash = blankStateLeaf.hash()

        const batchTreeDepth = Math.log2(Number(_batchSize))

        const stateLeaves: StateLeaf[] = []
        const voteLeaves: BigInt[][] = []

        if (_startIndex === BigInt(0)) {
            stateLeaves.push(this.zerothStateLeaf)
            voteLeaves.push(this.genBlankVotes())
        }

        for (let i = 0; i < _batchSize; i++) {
            if (_startIndex === BigInt(0) && i === 0) {
                continue
            }

            const userIndex = Number(_startIndex) + i - 1
            if (userIndex < this.users.length) {
                stateLeaves.push(
                    this.users[userIndex]
                        .genStateLeaf(this.voteOptionTreeDepth)
                )
                voteLeaves.push(this.users[userIndex].votes)
            } else {
                stateLeaves.push(blankStateLeaf)
                voteLeaves.push(this.genBlankVotes())
            }
        }

        // We need to generate the following in order to create the
        // intermediate tree path:
        // 1. The tree whose leaves are the state leaves are the roots of
        //    subtrees (the intermediate tree)
        // 2. Each batch tree whose leaves are state leaves

        const emptyBatchTree = new IncrementalQuinTree(
            batchTreeDepth,
            blankStateLeafHash,
            2,
        )

        const intermediateTree = new IncrementalQuinTree(
            this.stateTreeDepth - batchTreeDepth,
            emptyBatchTree.root,
            2,
        )

        // For each batch, create a tree of the leaves in the batch, and insert the
        // tree root into the intermediate tree
        for (let i = 0; i < 2 ** Number(this.stateTreeDepth); i += Number(_batchSize)) {

            // Use this batchTree to accumulate the leaves in the batch
            const batchTree = emptyBatchTree.copy()

            for (let j = 0; j < Number(_batchSize); j++) {
                if (i === 0 && j === 0) {
                    batchTree.insert(this.zerothStateLeaf.hash())
                } else {
                    const userIndex = i + j - 1
                    if (userIndex < this.users.length) {
                        const leaf = this.users[userIndex]
                            .genStateLeaf(Number(this.voteOptionTreeDepth)).hash()
                        batchTree.insert(leaf)
                    }
                }
            }

            // Insert the root of the batch tree
            intermediateTree.insert(batchTree.root)
        }

        assert(intermediateTree.root === this.genStateRoot())

        const intermediatePathIndex = BigInt(_startIndex) / BigInt(_batchSize)
        const intermediateStateRoot = intermediateTree.leaves[Number(intermediatePathIndex)]
        const intermediatePathElements = intermediateTree.genMerklePath(Number(intermediatePathIndex)).pathElements

        const a = BigInt(Math.ceil(
            (this.users.length + 1) / Number(_batchSize)
        ) - 1)

        const isLastBatch = intermediatePathIndex  === a

        const circuitInputs = stringifyBigInts({
            isLastBatch: isLastBatch ? BigInt(1) : BigInt(0),
            voteLeaves,
            stateLeaves: stateLeaves.map((x) => x.asCircuitInputs()),
            fullStateRoot: this.genStateRoot(),

            currentResults,
            currentResultsCommitment,
            currentResultsSalt: _currentResultsSalt,

            newResultsSalt: _newResultsSalt,

            currentSpentVoiceCredits,
            currentSpentVoiceCreditsSalt: _currentSpentVoiceCreditsSalt,
            currentSpentVoiceCreditsCommitment,
            newSpentVoiceCreditsSalt: _newSpentVoiceCreditsSalt,

            currentPerVOSpentVoiceCredits,
            currentPerVOSpentVoiceCreditsCommitment,
            currentPerVOSpentVoiceCreditsSalt: _currentPerVOSpentVoiceCreditsSalt,
            newPerVOSpentVoiceCreditsSalt: _newPerVOSpentVoiceCreditsSalt,

            intermediatePathElements,
            intermediatePathIndex,
            intermediateStateRoot,
        })

        return circuitInputs
    }
}

/*
 * A helper function which returns the hash of the total number of spent voice
 * credits and a salt.
 *
 * @param voiceCredits The number of voice credits
 * @parm salt A random salt
 * @return The hash of the number of voice credits and the salt
 */
const genSpentVoiceCreditsCommitment = (
    vc: BigInt,
    salt: BigInt,
): BigInt => {
    return hashLeftRight(vc, salt)
}

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

const genPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment

export {
    genPerVOSpentVoiceCreditsCommitment,
    genSpentVoiceCreditsCommitment,
    genTallyResultCommitment,
    MaciState,
}
