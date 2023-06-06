jest.setTimeout(900000)
import {
    Keypair,
} from 'maci-domainobjs'
import { stringifyBigInts, genRandomSalt } from 'maci-crypto'
import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('ElGamal bit encryption and decryption', () => {
    const encCircuit  = 'elGamalEncryption_ElGamalEncryptBit_test'
    const decCircuit  = 'elGamalDecryption_ElGamalDecryptBit_test'

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

    it('Should yield different ciphertexts for the same message with different public keys', async () => {
        const k = genRandomSalt();
        const keypair1 = new Keypair();
        const keypair2 = new Keypair();
        
        // Encryption with public key 1
        const encCircuitInputs1 = stringifyBigInts({ 
            k,
            m: 1,
            pk: keypair1.pubKey.asCircuitInputs(),
        });
        const encWitness1 = await genWitness(encCircuit, encCircuitInputs1);
        const Me1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[1]`)),
        ];
    
        // Encryption with public key 2
        const encCircuitInputs2 = stringifyBigInts({ 
            k,
            m: 1,
            pk: keypair2.pubKey.asCircuitInputs(),
        });
        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2);
        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];
    
        expect(Me1).not.toEqual(Me2);
    })

    it('Should not decrypt with the wrong private key', async () => {
        const k = genRandomSalt();
        const keypair1 = new Keypair();
        const keypair2 = new Keypair();
        
        // Encrypt
        const encCircuitInputs = stringifyBigInts({ 
            k,
            m: 1,
            pk: keypair1.pubKey.asCircuitInputs(),
        });
        const encWitness = await genWitness(encCircuit, encCircuitInputs);
        const Me = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
        ];
        const kG = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[1]`)),
        ];
    
        // Decrypt with correct private key
        const decCircuitInputs1 = stringifyBigInts({ 
            kG, 
            Me,
            sk: keypair1.privKey.asCircuitInputs(),
        });
        const decWitness1 = await genWitness(decCircuit, decCircuitInputs1);
        const dBit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.m`));
        expect(dBit1).toEqual(BigInt(1));
    
        // Decrypt with wrong private key
        const decCircuitInputs2 = stringifyBigInts({ 
            kG, 
            Me,
            sk: keypair2.privKey.asCircuitInputs(),
        });
        const decWitness2 = await genWitness(decCircuit, decCircuitInputs2);
        const dBit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.m`));
        expect(dBit2).not.toEqual(BigInt(1));
    })

    it('Should output the correct plaintext bit for randomly generated inputs', async () => {
        for (let i = 0; i < 5; i++) {
            const k = genRandomSalt();
            const m = Math.round(Math.random());
            const keypair = new Keypair();
    
            // Encrypt
            const encCircuitInputs = stringifyBigInts({ 
                k,
                m,
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
    
            // Decrypt
            const decCircuitInputs = stringifyBigInts({ 
                kG, 
                Me,
                sk: keypair.privKey.asCircuitInputs(),
            })
            const decWitness = await genWitness(decCircuit, decCircuitInputs)
            const dBit = BigInt(await getSignalByName(decCircuit, decWitness, `main.m`))
    
            expect(dBit).toEqual(BigInt(m))
        }
    })
})

describe('ElGamal point encryption and decryption', () => {
    const encCircuit  = 'elGamalEncryption_ElGamalEncryptPoint_test'
    const decCircuit  = 'elGamalDecryption_ElGamalDecryptPoint_test'

    it('Should output the input point from the composition of encryption and decryption', async () => {
        const keypair = new Keypair()            
            
        // Encryption
        const k = genRandomSalt();
        const encCircuitInputs = stringifyBigInts({ 
            k,
            M: [0, 1],
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
        const m0Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[0]`));

        expect(m0Bit).toEqual(BigInt(0));
    })
})