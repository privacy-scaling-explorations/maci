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
} from 'maci-domainobjs'

const keypair = new Keypair()
const stateIndex = BigInt(1)
const newPubKey = keypair.pubKey
const voteOptionIndex = BigInt(0)
const newVoteWeight = BigInt(9)
const nonce = BigInt(1)
const pollId = BigInt(0)
const salt = genRandomSalt()
const maxUsers = 25
const maxVoteOptions = 25
const slPubKey = (new Keypair()).pubKey
const slVoiceCreditBalance = BigInt(100)
const ballotNonce = BigInt(0)
const ballotVoteOptionRoot = BigInt(12345678)
const ballotCurrentVotesForOption = BigInt(0)
const updatedBallotVoteOptionRoot = BigInt(87654321)

const command: Command = new Command(
    stateIndex,
    newPubKey,
    voteOptionIndex,
    newVoteWeight,
    nonce,
    pollId,
    salt,
)

const signature = command.sign(keypair.privKey)

const circuit = 'stateLeafAndBallotTransformer_test'
describe('StateLeafAndBallotTransformer circuit', () => {
    it('Should output new state leaf and ballot values if the command is valid', async () => {
        const circuitInputs = stringifyBigInts({
            maxUsers,
            maxVoteOptions,
            slPubKey: slPubKey.asCircuitInputs(),
            slVoiceCreditBalance,
            ballotNonce,
            ballotVoteOptionRoot,
            ballotCurrentVotesForOption,
            cmdStateIndex: command.stateIndex,
            cmdNewPubKey: command.newPubKey.asCircuitInputs(),
            cmdVoteOptionIndex: command.voteOptionIndex,
            cmdNewVoteWeight: command.newVoteWeight,
            cmdNonce: command.nonce,
            cmdPollId: command.pollId,
            cmdSalt: command.salt,
            cmdSigR8: signature.R8,
            cmdSigS: signature.S,
            packedCommand: command.asCircuitInputs(),
            updatedBallotVoteOptionRoot,
        })

        const witness = await genWitness(circuit, circuitInputs)

        const newSlPubKey0 = await getSignalByName(circuit, witness, 'main.newSlPubKey[0]')
        const newSlPubKey1 = await getSignalByName(circuit, witness, 'main.newSlPubKey[1]')
        const newSlVoiceCreditBalance = await getSignalByName(circuit, witness, 'main.newSlVoiceCreditBalance')
        const newBallotNonce = await getSignalByName(circuit, witness, 'main.newBallotNonce')
        const newBallotVoteOptionRoot = await getSignalByName(circuit, witness, 'main.newBallotVoteOptionRoot')
        const newBallotCurrentVotesForOption =
            await getSignalByName(circuit, witness, 'main.newBallotCurrentVotesForOption')

        expect(newSlPubKey0.toString()).toEqual(command.newPubKey.rawPubKey[0].toString())
        expect(newSlPubKey1.toString()).toEqual(command.newPubKey.rawPubKey[1].toString())
        expect(newSlVoiceCreditBalance.toString()).toEqual('19')
        expect(newBallotNonce.toString()).toEqual(command.nonce.toString())
        expect(newBallotVoteOptionRoot.toString()).toEqual(updatedBallotVoteOptionRoot.toString())
        expect(newBallotCurrentVotesForOption.toString()).toEqual('9')

        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('1')
    })

    it('Should output existing state leaf and ballot values if the command is invalid', async () => {
        const circuitInputs = stringifyBigInts({
            maxUsers,
            maxVoteOptions,
            slPubKey: slPubKey.asCircuitInputs(),
            slVoiceCreditBalance,
            ballotNonce,
            ballotVoteOptionRoot,
            ballotCurrentVotesForOption,
            cmdStateIndex: command.stateIndex,
            cmdNewPubKey: command.newPubKey.asCircuitInputs(),
            cmdVoteOptionIndex: command.voteOptionIndex,
            cmdNewVoteWeight: command.newVoteWeight,
            cmdNonce: 2, // invalid
            cmdPollId: command.pollId,
            cmdSalt: command.salt,
            cmdSigR8: signature.R8,
            cmdSigS: signature.S,
            packedCommand: command.asCircuitInputs(),
            updatedBallotVoteOptionRoot,
        })

        const witness = await genWitness(circuit, circuitInputs)

        const newSlPubKey0 = await getSignalByName(circuit, witness, 'main.newSlPubKey[0]')
        const newSlPubKey1 = await getSignalByName(circuit, witness, 'main.newSlPubKey[1]')
        const newSlVoiceCreditBalance = await getSignalByName(circuit, witness, 'main.newSlVoiceCreditBalance')
        const newBallotNonce = await getSignalByName(circuit, witness, 'main.newBallotNonce')
        const newBallotVoteOptionRoot = await getSignalByName(circuit, witness, 'main.newBallotVoteOptionRoot')
        const newBallotCurrentVotesForOption =
            await getSignalByName(circuit, witness, 'main.newBallotCurrentVotesForOption')

        expect(newSlPubKey0.toString()).toEqual(slPubKey.rawPubKey[0].toString())
        expect(newSlPubKey1.toString()).toEqual(slPubKey.rawPubKey[1].toString())
        expect(newSlVoiceCreditBalance.toString()).toEqual(slVoiceCreditBalance.toString())
        expect(newBallotNonce.toString()).toEqual('0')
        expect(newBallotVoteOptionRoot.toString()).toEqual(ballotVoteOptionRoot.toString())
        expect(newBallotCurrentVotesForOption.toString()).toEqual('0')

        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })
})


