import {
    Ciphertext,
    Plaintext,
    EcdhSharedKey,
    Signature,
    SnarkBigInt,
    PubKey,
    PrivKey,
    encrypt,
    decrypt,
    sign,
    hash,
    verifySignature,
    genRandomSalt,
} from 'maci-crypto'


interface IStateLeaf {
    pubKey: PubKey;
    voteOptionTreeRoot: SnarkBigInt;
    voiceCreditBalance: SnarkBigInt;
    nonce: SnarkBigInt;
}

interface VoteOptionTreeLeaf {
    votes: SnarkBigInt;
}

class Message {
    public iv: SnarkBigInt
    public data: SnarkBigInt[]

    constructor (
        iv: SnarkBigInt,
        data: SnarkBigInt[],
    ) {
        this.iv = iv
        this.data = data
    }

    private asArray = (): SnarkBigInt[] => {

        return [
            this.iv,
            ...this.data,
        ]
    }

    public asCircuitInputs = (): SnarkBigInt[] => {

        return this.asArray()
    }

    public hash = (): SnarkBigInt => {

        return hash(this.asArray())
    }
}

class StateLeaf implements IStateLeaf {
    public pubKey: PubKey
    public voteOptionTreeRoot: SnarkBigInt
    public voiceCreditBalance: SnarkBigInt
    public nonce: SnarkBigInt

    constructor (
        pubKey: PubKey,
        voteOptionTreeRoot: SnarkBigInt,
        voiceCreditBalance: SnarkBigInt,
        nonce: SnarkBigInt,
    ) {
        this.pubKey = pubKey
        this.voteOptionTreeRoot = voteOptionTreeRoot
        this.voiceCreditBalance = voiceCreditBalance
        this.nonce = nonce
    }

    private asArray = (): SnarkBigInt[] => {

        return [
            this.pubKey[0],
            this.pubKey[1],
            this.voteOptionTreeRoot,
            this.voiceCreditBalance,
            this.nonce,
        ]
    }

    public asCircuitInputs = (): SnarkBigInt[] => {

        return this.asArray()
    }

    public hash = (): SnarkBigInt => {

        return hash(this.asArray())
    }
}

interface ICommand {
    stateIndex: SnarkBigInt;
    //encPubKey: PubKey;
    newPubKey: PubKey;
    voteOptionIndex: SnarkBigInt;
    newVoteWeight: SnarkBigInt;
    nonce: SnarkBigInt;

    sign: (PrivKey) => Signature;
    encrypt: (EcdhSharedKey, Signature) => Message;
}

class Command implements ICommand {
    public stateIndex: SnarkBigInt
    public newPubKey: PubKey
    public voteOptionIndex: SnarkBigInt
    public newVoteWeight: SnarkBigInt
    public nonce: SnarkBigInt
    public salt: SnarkBigInt

    constructor (
        stateIndex: SnarkBigInt,
        newPubKey: PubKey,
        voteOptionIndex: SnarkBigInt,
        newVoteWeight: SnarkBigInt,
        nonce: SnarkBigInt,
        salt: SnarkBigInt = genRandomSalt(),
    ) {
        this.stateIndex = stateIndex
        this.newPubKey = newPubKey
        this.voteOptionIndex = voteOptionIndex
        this.newVoteWeight = newVoteWeight
        this.nonce = nonce
        this.salt = salt
    }

    public asArray = (): SnarkBigInt[] => {

        return [
            this.stateIndex,
            this.newPubKey[0],
            this.newPubKey[1],
            this.voteOptionIndex,
            this.newVoteWeight,
            this.nonce,
            this.salt,
        ]
    }

    /*
     * Check whether this command has deep equivalence to another command
     */
    public equals = (command: Command): boolean => {

        return this.stateIndex == command.stateIndex &&
            this.newPubKey[0] == command.newPubKey[0] &&
            this.newPubKey[1] == command.newPubKey[1] &&
            this.voteOptionIndex == command.voteOptionIndex &&
            this.newVoteWeight == command.newVoteWeight &&
            this.nonce == command.nonce &&
            this.salt == command.salt
    }

    /*
     * Signs this command and returns a Signature.
     */
    public sign = (
        privKey: PrivKey,
    ): Signature => {

        return sign(privKey, hash(this.asArray()))
    }

    /*
     * Returns true if the given signature is a correct signature of this
     * command and signed by the private key associated with the given public
     * key.
     */
    public verifySignature = (
        signature: Signature,
        pubKey: PubKey,
    ): boolean => {

        return verifySignature(
            hash(this.asArray()),
            signature,
            pubKey,
        )
    }

    /*
     * Encrypts this command along with a signature to produce a Message.
     */
    public encrypt = (
        signature: Signature,
        sharedKey: EcdhSharedKey,
    ): Message => {

        const plaintext: Plaintext = [
            ...this.asArray(),
            signature.R8[0],
            signature.R8[1],
            signature.S,
        ]

        const ciphertext: Ciphertext = encrypt(plaintext, sharedKey)
        const message = new Message(ciphertext.iv, ciphertext.data)
        
        return message
    }

    /*
     * Decrypts a Message to produce a Command.
     */
    public static decrypt = (
        message: Message,
        sharedKey: EcdhSharedKey,
    ) => {

        const decrypted = decrypt(message, sharedKey)

        const command = new Command(
            decrypted[0],
            [decrypted[1], decrypted[2]],
            decrypted[3],
            decrypted[4],
            decrypted[5],
            decrypted[6],
        )

        const signature = {
            R8: [decrypted[7], decrypted[8]],
            S: decrypted[9],
        }

        return { command, signature }
    }
}

export {
    StateLeaf,
    VoteOptionTreeLeaf,
    Command,
    Message,
}
