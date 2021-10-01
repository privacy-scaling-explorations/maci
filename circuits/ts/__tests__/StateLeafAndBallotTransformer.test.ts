jest.setTimeout(90000)
import {
    genWitness,
    getSignalByName,
} from './utils'

import {
    stringifyBigInts,
    genRandomSalt,
} from 'maci-crypto'

import {
    Command,
    Keypair,
    VoteLeaf
} from 'maci-domainobjs'

const keypair = new Keypair()
const stateIndex = BigInt(1)
const newPubKey = keypair.pubKey
const voteOptionIndex = BigInt(0)
const newVoteLeaf = new VoteLeaf(BigInt(4), BigInt(0))
const nonce = BigInt(1)
const pollId = BigInt(0)
const salt = genRandomSalt()
const numSignUps = 25
const maxVoteOptions = 25

const slKeypair = new Keypair()
const slPubKey = slKeypair.pubKey

const slVoiceCreditBalance = BigInt(100)
const ballotNonce = BigInt(0)
const ballotCurrentVoteLeafForOption = BigInt(0)
const slTimestamp = 1
const pollEndTimestamp = 2

const command: Command = new Command(
    stateIndex,
    newPubKey,
    voteOptionIndex,
    newVoteLeaf.pack(),
    nonce,
    pollId,
    salt,
)

const signature = command.sign(slKeypair.privKey)

const circuit = 'stateLeafAndBallotTransformer_test'
describe('StateLeafAndBallotTransformer circuit', () => {
    it('Should output new state leaf and ballot values if the command is valid', async () => {
        const circuitInputs = stringifyBigInts({
            numSignUps,
            maxVoteOptions,
            slPubKey: slPubKey.asCircuitInputs(),
            slVoiceCreditBalance,
            slTimestamp,
            pollEndTimestamp,
            ballotNonce,
            ballotCurrentVoteLeafForOption,
            cmdStateIndex: command.stateIndex,
            cmdNewPubKey: command.newPubKey.asCircuitInputs(),
            cmdVoteOptionIndex: command.voteOptionIndex,
            cmdNewVoteLeaf: command.newVoteLeaf,
            cmdNonce: command.nonce,
            cmdPollId: command.pollId,
            cmdSalt: command.salt,
            cmdSigR8: signature.R8,
            cmdSigS: signature.S,
            packedCommand: command.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const newSlPubKey0 = await getSignalByName(circuit, witness, 'main.newSlPubKey[0]')
        const newSlPubKey1 = await getSignalByName(circuit, witness, 'main.newSlPubKey[1]')
        const newBallotNonce = await getSignalByName(circuit, witness, 'main.newBallotNonce')

        expect(newSlPubKey0.toString()).toEqual(command.newPubKey.rawPubKey[0].toString())
        expect(newSlPubKey1.toString()).toEqual(command.newPubKey.rawPubKey[1].toString())
        expect(newBallotNonce.toString()).toEqual(command.nonce.toString())

        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('1')
    })

    it('Should output existing state leaf and ballot values if the command is invalid', async () => {
        const circuitInputs = stringifyBigInts({
            numSignUps,
            maxVoteOptions,
            slPubKey: slPubKey.asCircuitInputs(),
            slVoiceCreditBalance,
            slTimestamp,
            pollEndTimestamp,
            ballotNonce,
            ballotCurrentVoteLeafForOption,
            cmdStateIndex: command.stateIndex,
            cmdNewPubKey: command.newPubKey.asCircuitInputs(),
            cmdVoteOptionIndex: command.voteOptionIndex,
            cmdNewVoteLeaf: command.newVoteLeaf,
            cmdNonce: 2, // invalid
            cmdPollId: command.pollId,
            cmdSalt: command.salt,
            cmdSigR8: signature.R8,
            cmdSigS: signature.S,
            packedCommand: command.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const newSlPubKey0 = await getSignalByName(circuit, witness, 'main.newSlPubKey[0]')
        const newSlPubKey1 = await getSignalByName(circuit, witness, 'main.newSlPubKey[1]')
        const newBallotNonce = await getSignalByName(circuit, witness, 'main.newBallotNonce')

        expect(newSlPubKey0.toString()).toEqual(slPubKey.rawPubKey[0].toString())
        expect(newSlPubKey1.toString()).toEqual(slPubKey.rawPubKey[1].toString())
        expect(newBallotNonce.toString()).toEqual('0')

        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })
})
