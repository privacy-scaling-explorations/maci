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
    NOTHING_UP_MY_SLEEVE,
    IncrementalMerkleTree,
} from 'maci-crypto'

interface IUser {
    pubKey: PubKey
    votes: SnarkBigInt[]
    voiceCreditBalance: SnarkBigInt
    nonce: SnarkBigInt
}

class User implements IUser {
    public pubKey: PubKey
    public votes: SnarkBigInt[]
    public voiceCreditBalance: SnarkBigInt
    public nonce: SnarkBigInt

    constructor(
        _pubKey: PubKey,
        _votes: SnarkBigInt[],
        _voiceCreditBalance: SnarkBigInt,
        _nonce: SnarkBigInt,
    ) {
        this.pubKey = _pubKey
        this.votes = _votes
        this.voiceCreditBalance = _voiceCreditBalance
        this.nonce = _nonce
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
}

class MaciState {
    public coordinatorKeypair: Keypair
    public users: User[] = []
    public stateTreeDepth: SnarkBigInt
    public messageTreeDepth: SnarkBigInt
    public voteOptionTreeDepth: SnarkBigInt
    public messages: Message[] = []
    public zerothStateLeaf: SnarkBigInt

    // Public keys used to generate ephemeral shared keys which encrypt each
    // message
    public encPubKeys: PubKey[] = []
    private emptyVoteOptionTreeRoot

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

    /*
     * Computes the state root
     */
    public genStateRoot = (): SnarkBigInt => {
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
            const voteOptionTree = new IncrementalMerkleTree(
                this.voteOptionTreeDepth,
                bigInt(0),
            )

            for (let vote of user.votes) {
                voteOptionTree.insert(vote)
            }

            const stateLeaf = new StateLeaf(
                user.pubKey,
                voteOptionTree.root,
                user.voiceCreditBalance,
                user.nonce,
            )
            stateTree.insert(stateLeaf.hash())
        }
        return stateTree.root
    }

    public genMessageRoot = (): SnarkBigInt => {
        const messageTree = new IncrementalMerkleTree(
            this.messageTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )

        for (let message of this.messages) {
            messageTree.insert(message.hash())
        }

        return messageTree.root
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
                0,
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

    public processMessage = (
        _index: number,
        _randomZerothStateLeaf: SnarkBigInt,
    ) => {
        this.zerothStateLeaf = _randomZerothStateLeaf

        const message = this.messages[_index]
        const encPubKey = this.encPubKeys[_index]

        const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair, encPubKey)
        const { command, signature } = Command.decrypt(message, sharedKey)

        // If the state tree index in the command is invalid, do nothing
        if (command.stateIndex >= this.users.length) {
            return 
        }

        // If the signature is invalid, do nothing
        if (!command.verifySignature(signature, this.users[_index].pubKey)) {
            return
        }

        // If the nonce is invalid, do nothing
        if (!command.nonce.equals(this.users[_index].nonce + bigInt(1))) {
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
}
