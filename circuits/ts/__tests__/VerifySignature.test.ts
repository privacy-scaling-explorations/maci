import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    stringifyBigInts,
    genKeyPair,
    verifySignature,
    bigInt,
    hash,
} from 'maci-crypto'

import {
    Command,
} from 'maci-domainobjs'

describe('Signature verification circuit', () => {
    it('verifies a valid signature', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/verifySignature_test.circom'))
        const circuit = new Circuit(circuitDef)

        const command = new Command(
            bigInt(0),
            genKeyPair().pubKey,
            bigInt(123),
            bigInt(123),
            bigInt(1),
        )

        const signer = genKeyPair()
        const sig = command.sign(signer.privKey)
        const plaintext = hash(command.asArray())

        expect(verifySignature(plaintext, sig, signer.pubKey)).toBeTruthy()

        const circuitInputs = stringifyBigInts({
            'from_x': stringifyBigInts(signer.pubKey[0]),
            'from_y': stringifyBigInts(signer.pubKey[1]),
            'R8x': stringifyBigInts(sig.R8[0]),
            'R8y': stringifyBigInts(sig.R8[1]),
            'S': stringifyBigInts(sig.S),
            'preimage': stringifyBigInts(command.asArray())
        })

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.valid')
        const isValid = witness[idx].toString()
        expect(isValid).toEqual('1')
    })

    it('rejects an invalid signature', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/verifySignature_test.circom'))
        const circuit = new Circuit(circuitDef)

        const command = new Command(
            bigInt(0),
            genKeyPair().pubKey,
            bigInt(123),
            bigInt(123),
            bigInt(1),
        )

        const signer = genKeyPair()
        const wrongSigner = genKeyPair()

        expect(signer.privKey).not.toEqual(wrongSigner.privKey)
        const sig = command.sign(signer.privKey)

        const plaintext = hash(command.asArray())

        expect(verifySignature(plaintext, sig, wrongSigner.pubKey)).toBeFalsy()

        const circuitInputs = stringifyBigInts({
            'from_x': stringifyBigInts(wrongSigner.pubKey[0]),
            'from_y': stringifyBigInts(wrongSigner.pubKey[1]),
            'R8x': stringifyBigInts(sig.R8[0]),
            'R8y': stringifyBigInts(sig.R8[1]),
            'S': stringifyBigInts(sig.S),
            'preimage': stringifyBigInts(command.asArray())
        })

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const idx = circuit.getSignalIdx('main.valid')
        const isValid = witness[idx].toString()
        expect(isValid).toEqual('0')
    })
})
