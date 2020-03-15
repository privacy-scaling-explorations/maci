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
    IncrementalMerkleTree,
} from 'maci-crypto'

interface IUser {
    pubKey: PubKey
    votes: SnarkBigInt[]
    voiceCreditBalance: SnarkBigInt
    nonce: SnarkBigInt
}

interface IMaciState {
    coordinatorKeypair: Keypair
    users: User[]
    voteOptionTreeDepth: SnarkBigInt
    messages: Message[]
    zerothStateLeaf: SnarkBigInt
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

class MaciState implements IMaciState {
    public coordinatorKeypair: Keypair
    public users: User[] = []
    public stateTreeDepth: SnarkBigInt
    public voteOptionTreeDepth: SnarkBigInt
    public messages: Message[] = []
    public zerothStateLeaf: SnarkBigInt

    // Public keys used to generate ephemeral shared keys which encrypt each
    // message
    public encPubKeys: PubKey[] = []

    constructor(
        _coordinatorKeypair: Keypair,
        _stateTreeDepth: SnarkBigInt,
        _voteOptionTreeDepth: SnarkBigInt,
        _zerothStateLeaf: SnarkBigInt,
    ) {

        this.coordinatorKeypair = _coordinatorKeypair
        this.stateTreeDepth = _stateTreeDepth
        this.voteOptionTreeDepth = _voteOptionTreeDepth
        this.zerothStateLeaf = _zerothStateLeaf
    }

    private genBlankVotes = () => {
        let votes: SnarkBigInt[] = []
        for (let i = 0; i < bigInt(2) ** this.voteOptionTreeDepth; i ++) {
            votes.push(bigInt(0))
        }

        return votes
    }

    /*
     * Computes the state root
     */
    public genStateRoot = (): SnarkBigInt => {

        const stateTree = new IncrementalMerkleTree(
            this.stateTreeDepth,
            StateLeaf.blankStateLeaf.hash(),
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
                voteOptionTree.root(),
                user.voiceCreditBalance,
                user.nonce,
            )
        }
    }

    /*
     * Deep-copy this object
     */
    public copy = (): MaciState => {
        const copied = new MaciState(
            this.coordinatorKeypair.copy(),
            bigInt(this.stateTreeDepth.toString()),
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
        pubKey: PubKey,
        initialVoiceCreditBalance: SnarkBigInt,
    ) => {

        // Note that we do not insert a state leaf to any state tree here. This
        // is because we want to keep the state minimal, and only compute what
        // is necessary when it is needed. This may change if we run into
        // severe performance issues, but it is currently worth the tradeoff.
        this.users.push(
            new User(
                pubKey,
                this.genBlankVotes(),
                initialVoiceCreditBalance,
                0,
            )
        )
    }

    public publishMessage = (
        _message: Message,
        _encPubKey: PubKey,
    ) => {

        this.encPubKeys.push(_encPubKey)
        this.messages.push(_message)
    }

    public processMessage = (
        index: number,
        _randomZerothStateLeaf: SnarkBigInt,
    ) => {
        this.zerothStateLeaf = _randomZerothStateLeaf

        const message = this.messages[index]
        const encPubKey = this.encPubKeys[index]

        const sharedKey = Keypair.genEcdhSharedKey(this.coordinatorKeypair, encPubKey)
        const { command, signature } = Command.decrypt(message, sharedKey)

        // If the state tree index in the command is invalid, do nothing
        if (command.stateIndex >= this.users.length) {
            return 
        }

        // If the signature is invalid, do nothing
        if (!command.verifySignature(signature, this.users[index].pubKey)) {
            return
        }

        // If the nonce is invalid, do nothing
        if (!command.nonce.equals(this.users[index].nonce + bigInt(1))) {
            return
        }

        // If there are insufficient vote credits, do nothing
        const prevSpentCred = this.users[index].votes[command.voteOptionIndex]

        const voiceCreditsLeft = 
            this.users[index].voiceCreditBalance + 
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
                newVotesArr.push(bigInt(this.users[index].votes[i].toString()))
            }
        }

        const newUser = this.users[index].copy()
        newUser.nonce = newUser.nonce + bigInt(1)
        newUser.votes[index] = command.newVoteWeight
        newUser.voiceCreditBalance = voiceCreditsLeft

        this.users[index] = newUser
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
