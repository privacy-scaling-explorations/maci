jest.setTimeout(900000)
import {
    Keypair,
} from 'maci-domainobjs'
import { stringifyBigInts, genRandomSalt } from 'maci-crypto'
import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('ElGamal encryption and decryption', () => {
    const encCircuit  = 'elGamalEncryption_test'
    const decCircuit  = 'elGamalDecryption_test'

    it('Should output the input bit from the composition of encryption and decryption', async () => {
        const keypair = new Keypair()            
            
        for (let bit = 0; bit < 2; bit ++ ) {
            // Encryption
            const k = genRandomSalt();
            const encCircuitInputs = stringifyBigInts({ 
                k,
                m: bit,
                pk: keypair.pubKey.asCircuitInputs(),
            })

            const encWitness = await genWitness(encCircuit, encCircuitInputs)

            const Me = [
                BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
                BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
            ];

            const kG = [
                BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[0]`)),
                BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[1]`)),
            ];

            // Decryption
            const decCircuitInputs = stringifyBigInts({ 
                kG, 
                Me,
                sk: keypair.privKey.asCircuitInputs(),
            })

            const decWitness = await genWitness(decCircuit, decCircuitInputs)
            const dBit = BigInt(await getSignalByName(decCircuit, decWitness, `main.m`));

            expect(dBit).toEqual(BigInt(bit));
        }
    })
})