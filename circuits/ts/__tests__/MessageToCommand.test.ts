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
    Keypair,
    Command,
} from 'maci-domainobjs'

describe('MessageToCommand circuit', () => {
    const circuit = 'messageToCommand_test'

    it('Should decrypt a Message and output the fields of a Command', async () => {
        const { privKey, pubKey } = new Keypair()
        const k = new Keypair()

        const pubKey1 = k.pubKey

        const newPubKey = k.pubKey

        const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1)
        const random50bitBigInt = (): BigInt => {
            return (
                (BigInt(1) << BigInt(50)) - BigInt(1)
            ) & BigInt(genRandomSalt())
        }

        const command: Command = new Command(
            random50bitBigInt(),
            newPubKey,
            random50bitBigInt(),
            random50bitBigInt(),
            random50bitBigInt(),
            random50bitBigInt(),
            //genRandomSalt(),
            BigInt(123),
        )
        const signature = command.sign(privKey)
        const message = command.encrypt(signature, ecdhSharedKey)

        const circuitInputs = stringifyBigInts({
            message: message.asCircuitInputs(),
            encPrivKey: privKey.asCircuitInputs(),
            encPubKey: pubKey1.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)

        const stateIndexOut = await getSignalByName(circuit, witness, 'main.stateIndex')
        expect(command.stateIndex.toString()).toEqual(stateIndexOut)

        const newPubKey0 = await getSignalByName(circuit, witness, 'main.newPubKey[0]')
        expect(command.newPubKey.rawPubKey[0].toString()).toEqual(newPubKey0)

        const newPubKey1 = await getSignalByName(circuit, witness, 'main.newPubKey[1]')
        expect(command.newPubKey.rawPubKey[1].toString()).toEqual(newPubKey1)

        const voteOptionIndex = await getSignalByName(circuit, witness, 'main.voteOptionIndex')
        expect(command.voteOptionIndex.toString()).toEqual(voteOptionIndex)

        const newVoteWeight = await getSignalByName(circuit, witness, 'main.newVoteWeight')
        expect(command.newVoteWeight.toString()).toEqual(newVoteWeight)

        const nonce = await getSignalByName(circuit, witness, 'main.nonce')
        expect(command.nonce.toString()).toEqual(nonce)

        const pollId = await getSignalByName(circuit, witness, 'main.pollId')
        expect(command.pollId.toString()).toEqual(pollId)

        const salt = await getSignalByName(circuit, witness, 'main.salt')
        expect(command.salt.toString()).toEqual(salt)

        const sigR80 = await getSignalByName(circuit, witness, 'main.sigR8[0]')
        expect(signature.R8[0].toString()).toEqual(sigR80)

        const sigR81 = await getSignalByName(circuit, witness, 'main.sigR8[1]')
        expect(signature.R8[1].toString()).toEqual(sigR81)

        const sigS = await getSignalByName(circuit, witness, 'main.sigS')
        expect(signature.S.toString()).toEqual(sigS)
    })
})
