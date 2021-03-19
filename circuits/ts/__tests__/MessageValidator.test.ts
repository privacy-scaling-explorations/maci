jest.setTimeout(90000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

import { 
    stringifyBigInts,
    encrypt,
    genRandomSalt,
} from 'maci-crypto'

import {
    Command,
    Keypair,
} from 'maci-domainobjs'

describe('MessageValidator circuit', () => {
    const circuit = 'messageValidator_test'
    let circuitInputs

    beforeAll(() => {
        const { privKey, pubKey } = new Keypair()

        // Note that the command fields don't matter in this test
        const command: Command = new Command(
            BigInt(1),
            pubKey,
            BigInt(2),
            BigInt(3),
            BigInt(4),
            BigInt(5),
            genRandomSalt(),
        )

        const signature = command.sign(privKey)

        circuitInputs = stringifyBigInts({
            stateTreeIndex: 0,
            numSignUps: 1,
            voteOptionIndex: 0,
            maxVoteOptions: 1,
            originalNonce: 1,
            nonce: 2,
            cmd: command.asCircuitInputs(),
            pubKey: pubKey.asCircuitInputs(),
            sigR8: signature.R8,
            sigS: signature.S,
            currentVoiceCreditBalance: 100,
            currentVotesForOption: 0,
            voteWeight: 9,
            slTimestamp: 1,
            pollEndTimestamp: 2,
        })
    })

    it('Should pass if all inputs are valid', async () => {
        const witness = await genWitness(circuit, circuitInputs)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('1')

        //console.log(await getSignalByName(circuit, witness, 'main.isValidSignature'))
        //console.log(await getSignalByName(circuit, witness, 'main.isValidVc'))
        //console.log(await getSignalByName(circuit, witness, 'main.isValidNonce'))
        //console.log(await getSignalByName(circuit, witness, 'main.isValidSli'))
        //console.log(await getSignalByName(circuit, witness, 'main.isValidVoi'))
    })

    it('Should be invalid if the signature is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.sigS = '0'
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the pubkey is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.pubKey = [0, 1]
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if there are insufficient voice credits', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.voteWeight = 11
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the nonce is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.nonce = 3
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the state leaf index is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.stateTreeIndex = 2
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the vote option index is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.voteOptionIndex = 1
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the vote option index is invalid', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.voteOptionIndex = '6049261729'
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })

    it('Should be invalid if the state leaf timestamp is too high', async () => {
        const circuitInputs2 = circuitInputs
        circuitInputs2.slTimestamp = '3'
        const witness = await genWitness(circuit, circuitInputs2)
        const isValid = await getSignalByName(circuit, witness, 'main.isValid')
        expect(isValid.toString()).toEqual('0')
    })
})

