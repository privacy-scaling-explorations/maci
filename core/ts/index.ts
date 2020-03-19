import {
    PrivKey,
    PubKey,
    Command,
    Message,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    bigInt,
    SnarkBigInt,
    stringifyBigInts,
    NOTHING_UP_MY_SLEEVE,
    IncrementalMerkleTree,
} from 'maci-crypto'

class User {
    public pubKey: PubKey
    public votes: SnarkBigInt[]
    public voiceCreditBalance: SnarkBigInt

    // The this is the current nonce. i.e. a user who has published 0 valid
    // command should have this value at 0, and the first command should
    // have a nonce of 1
    public nonce: SnarkBigInt

    constructor(
        _pubKey: PubKey,
        _votes: SnarkBigInt[],
        _voiceCreditBalance: SnarkBigInt,
        _nonce: SnarkBigInt,
    ) {
        this.pubKey = _pubKey
        this.votes = _votes.map(bigInt)
        this.voiceCreditBalance = bigInt(_voiceCreditBalance)
        this.nonce = bigInt(_nonce)
    }

    public copy = (): User => {
        let newVotesArr: SnarkBigInt[] = []
        for (let i = 0; i < this.votes.length; i++) {
            newVotesArr.push(bigInt(this.votes[i].toString()))
        }

        return new User(
            this.pubKey.copy(),
            newVotesArr,
            bigInt(this.voiceCreditBalance.toString()),
            bigInt(this.nonce.toString()),
        )
    }

    public genStateLeaf = (
        _voteOptionTreeDepth: number,
    ): StateLeaf => {
        const voteOptionTree = new IncrementalMerkleTree(
            _voteOptionTreeDepth,
            bigInt(0),
        )

        for (let vote of this.votes) {
            voteOptionTree.insert(vote)
        }

        return new StateLeaf(
            this.pubKey,
            voteOptionTree.root,
            this.voiceCreditBalance,
            this.nonce,
        )
    }
}

class MaciState {
    public coordinatorKeypair: Keypair
    public users: User[] = []
    public stateTreeDepth: SnarkBigInt
    public messageTreeDepth: SnarkBigInt
    public voteOptionTreeDepth: SnarkBigInt
    public messages: Message[] = []
    public zerothStateLeaf: SnarkBigInt
    public encPubKeys: PubKey[] = []
    private emptyVoteOptionTreeRoot

    // encPubKeys contains the public keys used to generate ephemeral shared
    // keys which encrypt each message

    constructor(
        _coordinatorKeypair: Keypair,
        _stateTreeDepth: SnarkBigInt,
        _messageTreeDepth: SnarkBigInt,
        _voteOptionTreeDepth: SnarkBigInt,
        _zerothStateLeaf: SnarkBigInt,
    ) {

        this.coordinatorKeypair = _coordinatorKeypair
        this.stateTreeDepth = bigInt(_stateTreeDepth)
        this.messageTreeDepth = bigInt(_messageTreeDepth)
        this.voteOptionTreeDepth = bigInt(_voteOptionTreeDepth)
        this.zerothStateLeaf = bigInt(_zerothStateLeaf)

        const emptyVoteOptionTree = new IncrementalMerkleTree(
            this.voteOptionTreeDepth,
            bigInt(0),
        )
        this.emptyVoteOptionTreeRoot = emptyVoteOptionTree.root
    }

    private genBlankVotes = () => {
        let votes: SnarkBigInt[] = []
        for (let i = 0; i < bigInt(2).pow(this.voteOptionTreeDepth); i ++) {
            votes.push(bigInt(0))
        }

        return votes
    }

    public genStateTree = (): IncrementalMerkleTree => {
        const blankStateLeaf = StateLeaf.genFreshLeaf(
            new PubKey([0, 0]),
            this.emptyVoteOptionTreeRoot,
            bigInt(0),
        )

        const stateTree = new IncrementalMerkleTree(
            this.stateTreeDepth,
            blankStateLeaf.hash(),
        )

        stateTree.insert(this.zerothStateLeaf)
        for (let user of this.users) {
            const stateLeaf = user.genStateLeaf(this.voteOptionTreeDepth)
            stateTree.insert(stateLeaf.hash())
        }
        return stateTree
    }

    /*
     * Computes the state root
     */
    public genStateRoot = (): SnarkBigInt => {
        return this.genStateTree().root
    }

    public genMessageTree = (): IncrementalMerkleTree => {
        const messageTree = new IncrementalMerkleTree(
            this.messageTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )

        for (let message of this.messages) {
            messageTree.insert(message.hash())
        }

        return messageTree
    }

    public genMessageRoot = (): SnarkBigInt => {
        return this.genMessageTree().root
    }

    /*
     * Deep-copy this object
     */
    public copy = (): MaciState => {
        const copied = new MaciState(
            this.coordinatorKeypair.copy(),
            bigInt(this.stateTreeDepth.toString()),
            bigInt(this.messageTreeDepth.toString()),
            bigInt(this.voteOptionTreeDepth.toString()),
            bigInt(this.zerothStateLeaf.toString()),
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
        _initialVoiceCreditBalance: SnarkBigInt,
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
                bigInt(0),
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

        this.encPubKeys.push(_encPubKey)
        this.messages.push(_message)
    }

    /*
     * Process the message at index 0 of the message array. Note that this is
     * not the state leaf index, as leaf 0 of the state tree is a random value.
     */
    public processMessage = (
        _index: number,
    ) => {

        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]

        const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair.privKey, encPubKey)
        const { command, signature } = Command.decrypt(message, sharedKey)

        // If the state tree index in the command is invalid, do nothing
        if (command.stateIndex > this.users.length) {
            return 
        }

        // If the signature is invalid, do nothing
        if (! command.verifySignature(signature, this.users[_index].pubKey)) {
            return
        }

        // If the nonce is invalid, do nothing
        if (command.nonce !== this.users[_index].nonce + bigInt(1)) {
            return
        }

        // If there are insufficient vote credits, do nothing
        const prevSpentCred = this.users[_index].votes[command.voteOptionIndex]

        const voiceCreditsLeft = 
            this.users[_index].voiceCreditBalance + 
            (prevSpentCred * prevSpentCred) -
            (command.newVoteWeight * command.newVoteWeight)

        if (voiceCreditsLeft < 0) {
            return
        }

        // Update the user's vote option tree, pubkey, voice credit balance,
        // and nonce
        let newVotesArr: SnarkBigInt[] = []
        for (let i = 0; i < this.users.length; i++) {
            if (i === command.voteOptionIndex) {
                newVotesArr.push(command.newVoteWeight)
            } else {
                newVotesArr.push(bigInt(this.users[_index].votes[i].toString()))
            }
        }

        const newUser = this.users[_index].copy()
        newUser.nonce = newUser.nonce + bigInt(1)
        newUser.votes[_index] = command.newVoteWeight
        newUser.voiceCreditBalance = voiceCreditsLeft

        this.users[_index] = newUser
    }

    /*
     * Generates inputs to the UpdateStateTree circuit.  Only after calling
     * this function, use oldState.processMessage() to generate the newState
     * object. 
     * )
     */
    public genUpdateStateTreeCircuitInputs = (
        _index: number,
    ) => {
        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]
        const sharedKey = Keypair.genEcdhSharedKey(
            this.coordinatorKeypair.privKey,
            encPubKey,
        )
        const { command, signature } = Command.decrypt(message, sharedKey)

        const messageTree = this.genMessageTree()
        const [ msgTreePathElements, msgTreePathIndices ]
            = messageTree.getPathUpdate(_index)

        const stateTree = this.genStateTree()
        const stateTreeMaxIndex = bigInt(stateTree.nextIndex) - bigInt(1)

        const user = this.users[bigInt(command.stateIndex) - bigInt(1)]

        const currentVoteWeight = user.votes[command.voteOptionIndex]

        const voteOptionTree = new IncrementalMerkleTree(
            this.voteOptionTreeDepth,
            bigInt(0),
        )
        for (let vote of user.votes) {
            voteOptionTree.insert(vote)
        }

        const [ voteOptionTreePathElements, voteOptionTreeIndices ]
            = voteOptionTree.getPathUpdate(command.voteOptionIndex)

        const voteOptionTreeMaxIndex = bigInt(2).pow(this.voteOptionTreeDepth) - bigInt(1)

        const stateLeaf = user.genStateLeaf(this.voteOptionTreeDepth)
        const [ stateTreePathElements, stateTreePathIndices ]
            = stateTree.getPathUpdate(command.stateIndex)

        return stringifyBigInts({
            'coordinator_public_key': this.coordinatorKeypair.pubKey.asCircuitInputs(),
            'ecdh_private_key': this.coordinatorKeypair.privKey.asCircuitInputs(),
            'ecdh_public_key': encPubKey.asCircuitInputs(),
            'message': message.asCircuitInputs(),
            'msg_tree_root': messageTree.root,
            'msg_tree_path_elements': msgTreePathElements,
            'msg_tree_path_index': msgTreePathIndices,
            'vote_options_leaf_raw': currentVoteWeight,
            'vote_options_tree_root': voteOptionTree.root,
            'vote_options_tree_path_elements': voteOptionTreePathElements,
            'vote_options_tree_path_index': voteOptionTreeIndices,
            'vote_options_max_leaf_index': voteOptionTreeMaxIndex,
            'state_tree_data_raw': stateLeaf.asCircuitInputs(),
            'state_tree_max_leaf_index': stateTreeMaxIndex,
            'state_tree_root': stateTree.root,
            'state_tree_path_elements': stateTreePathElements,
            'state_tree_path_index': stateTreePathIndices,
        })
    }
}

const processMessage = (
    sharedKey: PrivKey,
    msg: Message,
    stateLeaf: StateLeaf,
    oldStateTree: IncrementalMerkleTree,
    oldUserVoteOptionTree: IncrementalMerkleTree,
) => {

    // Deep-copy the trees
    const stateTree = oldStateTree.copy()
    const userVoteOptionTree = oldUserVoteOptionTree.copy()

    // Decrypt the message
    const { command, signature } = Command.decrypt(msg, sharedKey)

    // If the state tree index in the command is invalid, do nothing
    if (parseInt(command.stateIndex) >= parseInt(stateTree.nextIndex)) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If the signature is invalid, do nothing
    if (!command.verifySignature(signature, stateLeaf.pubKey)) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If the nonce is invalid, do nothing
    if (!command.nonce.equals(stateLeaf.nonce + bigInt(1))) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If there are insufficient vote credits, do nothing
    const userPrevSpentCred =
        userVoteOptionTree.getLeaf(parseInt(command.voteOptionIndex))

    const userCmdVoteOptionCredit = command.newVoteWeight

    const voteCreditsLeft = 
        stateLeaf.voiceCreditBalance + 
        (userPrevSpentCred * userPrevSpentCred) -
        (userCmdVoteOptionCredit * userCmdVoteOptionCredit)

    if (voteCreditsLeft < 0) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // Update the user's vote option tree
    userVoteOptionTree.update(
        bigInt(command.voteOptionIndex),
        bigInt(userCmdVoteOptionCredit),
    )

    // Update the state tree
    const newStateLeaf = new StateLeaf(
        command.newPubKey,
        userVoteOptionTree.root,
        voteCreditsLeft,
        stateLeaf.nonce + bigInt(1)
    )

    stateTree.update(
        command.stateIndex,
        newStateLeaf.hash(),
    )

    return { stateTree, userVoteOptionTree, newStateLeaf }
}

export {
    processMessage,
    MaciState,
    User,
}
