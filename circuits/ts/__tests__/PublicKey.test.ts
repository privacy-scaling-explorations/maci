import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    genKeyPair,
    bigInt,
    stringifyBigInts,
    formatPrivKeyForBabyJub,
} from 'maci-crypto'

import {
    Keypair,
} from 'maci-domainobjs'


describe('Public key derivation circuit', () => {
    it('correctly computes a public key', async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/publicKey_test.circom'))
        const circuit = new Circuit(circuitDef)

        const keypair = new Keypair()

        const circuitInputs = {
            'private_key': keypair.privKey.asCircuitInputs(),
        }

        const witness = circuit.calculateWitness(circuitInputs)
        expect(circuit.checkWitness(witness)).toBeTruthy()

        const derivedPubkey0 = witness[circuit.getSignalIdx('main.public_key[0]')].toString()
        const derivedPubkey1 = witness[circuit.getSignalIdx('main.public_key[1]')].toString()
        expect(derivedPubkey0).toEqual(keypair.pubKey.rawPubKey[0].toString())
        expect(derivedPubkey1).toEqual(keypair.pubKey.rawPubKey[1].toString())
    })
})
