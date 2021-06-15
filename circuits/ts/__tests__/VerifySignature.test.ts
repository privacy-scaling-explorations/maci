jest.setTimeout(90000)
import {
    stringifyBigInts,
    verifySignature,
    hash4,
} from 'maci-crypto'

import {
    Keypair,
    Command,
} from 'maci-domainobjs'

import { 
    genWitness,
    getSignalByName,
} from './utils'

const circuit = 'verifySignature_test'

describe('Signature verification circuit', () => {

    it('verifies a valid signature', async () => {

        const keypair = new Keypair()
        const command = new Command(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3),
        )

        const signer = new Keypair()
        const sig = command.sign(signer.privKey)
        const plaintext = hash4(command.asArray())

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).toBeTruthy()

        const circuitInputs = stringifyBigInts({
            pubKey: signer.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S: sig.S,
            preimage: command.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)
        const isValid = await getSignalByName(circuit, witness, 'main.valid')
        expect(isValid).toEqual('1')
    })

    it('rejects an invalid signature (wrong signer)', async () => {
        const keypair = new Keypair()
        const command = new Command(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3),
        )

        const signer = new Keypair()
        const wrongSigner = new Keypair()

        expect(signer.privKey.rawPrivKey).not.toEqual(wrongSigner.privKey.rawPrivKey)

        const sig = command.sign(signer.privKey)

        const plaintext = hash4(command.asArray())

        // The signature is signed by `signer`
        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).toBeTruthy()

        // The signature is not signed by `wrongSigner`
        expect(verifySignature(plaintext, sig, wrongSigner.pubKey.rawPubKey)).toBeFalsy()

        const circuitInputs = stringifyBigInts({
            pubKey: wrongSigner.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S: sig.S,
            preimage: command.asCircuitInputs(),
        })

        const witness = await genWitness(circuit, circuitInputs)
        const isValid = await getSignalByName(circuit, witness, 'main.valid')
        expect(isValid).toEqual('0')
        expect(
            await getSignalByName(circuit, witness, 'main.verifier.isCcZero.out'),
        ).toEqual('1')
    })

    it('rejects an invalid signature', async () => {

        const keypair = new Keypair()
        const command = new Command(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3),
        )

        const signer = new Keypair()
        const sig = command.sign(signer.privKey)
        const plaintext = hash4(command.asArray())

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).toBeTruthy()

        const circuitInputs = stringifyBigInts({
            pubKey: signer.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S: BigInt('2736030358979909402780800718157159386076813972158567259200215660948447373040') + BigInt(1),
            preimage: command.asCircuitInputs(),
        })

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).toBeTruthy()

        const witness = await genWitness(circuit, circuitInputs)
        const isValid = await getSignalByName(circuit, witness, 'main.valid')
        expect(isValid).toEqual('0')
        expect(
            await getSignalByName(circuit, witness, 'main.verifier.isCcZero.out'),
        ).toEqual('0')
    })
})
