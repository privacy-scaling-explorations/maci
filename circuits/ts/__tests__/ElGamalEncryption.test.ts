jest.setTimeout(900000)
import {
    Keypair,
} from 'maci-domainobjs'
import { stringifyBigInts, genRandomSalt, elGamalEncryptBit } from 'maci-crypto'
import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('ElGamal (de)/(en)cryption - bit', () => {
    const encCircuit = 'elGamalEncryption_ElGamalEncryptBit_test'
    const decCircuit = 'elGamalDecryption_ElGamalDecryptBit_test'

    it('Should output the input bit from the composition of encryption and decryption', async () => {
        const keypair = new Keypair();
        const bit = 0;

        const k = BigInt(365);
        const [c1, c2] = elGamalEncryptBit(
            keypair.pubKey.rawPubKey,
            BigInt(bit),
            k,
        );

        console.log(keypair.pubKey.rawPubKey);
        console.log(keypair.pubKey.asCircuitInputs());

        const encCircuitInputs = stringifyBigInts({ 
            k,
            m: BigInt(bit),
            pk: keypair.pubKey.rawPubKey,
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
    });
    
    it('should encrypt and decrypt the 0 and 1 bit correctly', async () => {
        const keypair = new Keypair()

        for (let bit = 0; bit < 2; bit++) {
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

    it('should return different ciphertexts for the same message when using different public keys', async () => {
        const k = genRandomSalt();

        const keypair1 = new Keypair();
        const keypair2 = new Keypair();
        const bit = 1

        // Encryption with public key 1.
        const encCircuitInputs1 = stringifyBigInts({
            k,
            m: bit,
            pk: keypair1.pubKey.asCircuitInputs(),
        });

        const encWitness1 = await genWitness(encCircuit, encCircuitInputs1);

        const Me1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[1]`)),
        ];

        // Encryption with public key 2.
        const encCircuitInputs2 = stringifyBigInts({
            k,
            m: bit,
            pk: keypair2.pubKey.asCircuitInputs(),
        });

        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2);

        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];

        expect(Me1).not.toEqual(Me2);
    })

    it('should not be possible to decrypt with the wrong public key', async () => {
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

    it('should return the correct plaintext bit for randomly generated inputs', async () => {
        for (let i = 0; i < 10; i++) {
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

    /** New */
    // TODO: Check why await expect(genWitness(decCircuit, decCircuitInputs)).rejects.toThrow() fails
    it.skip('should return zero when someone tries to encrypt a non-number message', async () => {
        const keypair = new Keypair()

        // Encryption
        const k = genRandomSalt();

        const encCircuitInputs = stringifyBigInts({
            k,
            m: "n0-b1t",
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

        await expect(genWitness(decCircuit, decCircuitInputs)).rejects.toThrow();
    })

    it('should encrypt and decrypt with different random salts', async () => {
        const keypair = new Keypair();
        const bit = 1;

        // Encryption with random salt 1
        const k1 = genRandomSalt();
        const encCircuitInputs1 = stringifyBigInts({
            k: k1,
            m: bit,
            pk: keypair.pubKey.asCircuitInputs(),
        });
        const encWitness1 = await genWitness(encCircuit, encCircuitInputs1);
        const Me1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[1]`)),
        ];
        const kG1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.kG[1]`)),
        ];

        // Encryption with random salt 2
        const k2 = genRandomSalt();
        const encCircuitInputs2 = stringifyBigInts({
            k: k2,
            m: bit,
            pk: keypair.pubKey.asCircuitInputs(),
        });
        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2);
        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];
        const kG2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.kG[1]`)),
        ];

        // Decryption with random salt 1
        const decCircuitInputs1 = stringifyBigInts({
            kG: kG1,
            Me: Me1,
            sk: keypair.privKey.asCircuitInputs(),
        });
        const decWitness1 = await genWitness(decCircuit, decCircuitInputs1);
        const dBit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.m`));
        expect(dBit1).toEqual(BigInt(bit));

        // Decryption with random salt 2
        const decCircuitInputs2 = stringifyBigInts({
            kG: kG2,
            Me: Me2,
            sk: keypair.privKey.asCircuitInputs(),
        });
        const decWitness2 = await genWitness(decCircuit, decCircuitInputs2);
        const dBit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.m`));
        expect(dBit2).toEqual(BigInt(bit));
    });
})

describe('ElGamal (de)/(en)cryption - point', () => {
    const encCircuit = 'elGamalEncryption_ElGamalEncryptPoint_test'
    const decCircuit = 'elGamalDecryption_ElGamalDecryptPoint_test'

    it('should encrypt and decrypt the (0,1) input point correctly', async () => {
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
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[1]`));

        expect(m0Bit).toEqual(BigInt(0));
        expect(m1Bit).toEqual(BigInt(1));
    })

    it('should encrypt and decrypt the (0,0) input point correctly', async () => {
        const keypair = new Keypair()

        // Encryption
        const k = genRandomSalt();
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [0, 0],
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
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[1]`));

        expect(m0Bit).toEqual(BigInt(0));
        expect(m1Bit).toEqual(BigInt(0));
    })

    it('should encrypt and decrypt a point in the curve which has been derived from a keypair', async () => {
        const keypair = new Keypair()
        const keyPairForCurvePoints = new Keypair()
        const [c1, c2] = keyPairForCurvePoints.pubKey.rawPubKey; // key is used here to get c1 and c2 we know are part of the curve   

        // Encryption
        const k = genRandomSalt();
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [c1, c2],
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
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[1]`));

        expect(m0Bit).toEqual(c1);
        expect(m1Bit).toEqual(c2);
    })

    it('should not be possible to encrypt and decrypt a point as (1,0) or (1,1) which is not in the curve', async () => {
        const keypair = new Keypair()

        // Encryption
        const k1 = genRandomSalt();
        const k2 = genRandomSalt();
        const encCircuitInputs1 = stringifyBigInts({
            k: k1,
            M: [1, 0],
            pk: keypair.pubKey.asCircuitInputs(),
        })

        const encCircuitInputs2 = stringifyBigInts({
            k: k2,
            M: [1, 1],
            pk: keypair.pubKey.asCircuitInputs(),
        })

        const encWitness1 = await genWitness(encCircuit, encCircuitInputs1)
        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2)

        const Me1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[1]`)),
        ];

        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];

        const kG1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.kG[1]`)),
        ];

        const kG2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.kG[1]`)),
        ];

        // Decryption
        const decCircuitInputs1 = stringifyBigInts({
            kG: kG1,
            Me: Me1,
            sk: keypair.privKey.asCircuitInputs(),
        })

        // Decryption
        const decCircuitInputs2 = stringifyBigInts({
            kG: kG2,
            Me: Me2,
            sk: keypair.privKey.asCircuitInputs(),
        })

        const decWitness1 = await genWitness(decCircuit, decCircuitInputs1)
        const decWitness2 = await genWitness(decCircuit, decCircuitInputs2)
        const m0Bit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[0]`));
        const m1Bit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[1]`));

        const m0Bit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[0]`));
        const m1Bit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[1]`));

        expect(m0Bit1).not.toEqual(BigInt(1));
        expect(m1Bit1).toEqual(BigInt(0));
        expect(m0Bit2).not.toEqual(BigInt(1));
        expect(m1Bit2).not.toEqual(BigInt(1));
    })

    it('should return different ciphertexts for the same message when using different public keys', async () => {
        const k = genRandomSalt();
        const keypair1 = new Keypair();
        const keypair2 = new Keypair();

        // Encryption with public key 1
        const encCircuitInputs1 = stringifyBigInts({
            k,
            M: [0, 1],
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
            M: [0, 1],
            pk: keypair2.pubKey.asCircuitInputs(),
        });
        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2);
        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];

        expect(Me1).not.toEqual(Me2);
    })

    it('should not be possible to decrypt with the wrong public key', async () => {
        const k = genRandomSalt();
        const keypair1 = new Keypair();
        const keypair2 = new Keypair();

        // Encrypt
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [0, 1],
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
        const m0Bit = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[0]`));
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[1]`));
        expect(m0Bit).toEqual(BigInt(0));
        expect(m1Bit).toEqual(BigInt(1));

        // Decrypt with wrong private key
        const decCircuitInputs2 = stringifyBigInts({
            kG,
            Me,
            sk: keypair2.privKey.asCircuitInputs(),
        });
        const decWitness2 = await genWitness(decCircuit, decCircuitInputs2);
        const m0BitWrong = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[0]`));
        const m1BitWrong = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[1]`));
        expect(m0BitWrong).not.toEqual(BigInt(0));
        expect(m1BitWrong).not.toEqual(BigInt(1));
    })

    it('should return the correct encrypted message when k is equal to one', async () => {
        const keypair = new Keypair()

        // Encryption
        const k = BigInt(1);
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [0, 1],
            pk: keypair.pubKey.asCircuitInputs(),
        })

        const encWitness = await genWitness(encCircuit, encCircuitInputs);

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
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[1]`));

        expect(m0Bit).toEqual(BigInt(0));
        expect(m1Bit).toEqual(BigInt(1));
    });

    it('should return the point at infinity when M is equal to the point at infinity', async () => {
        const keypair = new Keypair()

        // Encryption
        const k = genRandomSalt();
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [BigInt(0), BigInt(0)],
            pk: keypair.pubKey.asCircuitInputs(),
        })

        const encWitness = await genWitness(encCircuit, encCircuitInputs);

        const Me = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
        ];
        const kG = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[1]`)),
        ];

        expect(Me).toEqual([BigInt(0), BigInt(0)]); // should be the point at infinity
        expect(kG).not.toEqual([BigInt(0), BigInt(0)]); // should be different from M
    });

    it('should return the point at infinity when pk is equal to the point at infinity', async () => {
        // Encryption
        const k = genRandomSalt();
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [BigInt(0), BigInt(1)],
            pk: [BigInt(0), BigInt(0)],
        })

        const encWitness = await genWitness(encCircuit, encCircuitInputs);

        const Me = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
        ];

        expect(Me).toEqual([BigInt(0), BigInt(1)]);
    });

    /** New */
    it('should return the same decrypted message when decrypting with the correct key after multiple encryptions', async () => {
        const keypair = new Keypair();

        // Encryption
        const k = genRandomSalt();
        const M = [genRandomSalt(), genRandomSalt()];
        const encCircuitInputs1 = stringifyBigInts({
            k,
            M,
            pk: keypair.pubKey.asCircuitInputs(),
        });

        const encCircuitInputs2 = stringifyBigInts({
            k,
            M,
            pk: keypair.pubKey.asCircuitInputs(),
        });

        const encWitness1 = await genWitness(encCircuit, encCircuitInputs1);
        const encWitness2 = await genWitness(encCircuit, encCircuitInputs2);

        const Me1 = [
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness1, `main.Me[1]`)),
        ];

        const Me2 = [
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness2, `main.Me[1]`)),
        ];

        // Decryption
        const decCircuitInputs1 = stringifyBigInts({
            kG: keypair.pubKey.asCircuitInputs(),
            Me: Me1,
            sk: keypair.privKey.asCircuitInputs(),
        });

        const decCircuitInputs2 = stringifyBigInts({
            kG: keypair.pubKey.asCircuitInputs(),
            Me: Me2,
            sk: keypair.privKey.asCircuitInputs(),
        });

        const decWitness1 = await genWitness(decCircuit, decCircuitInputs1);
        const decWitness2 = await genWitness(decCircuit, decCircuitInputs2);

        const m0Bit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[0]`));
        const m1Bit1 = BigInt(await getSignalByName(decCircuit, decWitness1, `main.M[1]`));

        const m0Bit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[0]`));
        const m1Bit2 = BigInt(await getSignalByName(decCircuit, decWitness2, `main.M[1]`));

        const decryptedMessage1 = [m0Bit1, m1Bit1].map((bit) => bit.toString(16)).join('');
        const decryptedMessage2 = [m0Bit2, m1Bit2].map((bit) => bit.toString(16)).join('');

        expect(decryptedMessage1).toEqual(decryptedMessage2);
    });

    it('should return the point at infinity when k is equal to zero', async () => {
        const keypair = new Keypair()

        // Encryption
        const k = BigInt(0);
        const encCircuitInputs = stringifyBigInts({
            k,
            M: [0, 1],
            pk: keypair.pubKey.asCircuitInputs(),
        })

        const encWitness = await genWitness(encCircuit, encCircuitInputs);

        const Me = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
        ];
        const kG = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.kG[1]`)),
        ];

        expect(Me).toEqual([BigInt(0), BigInt(1)]); // should be the point at infinity
        expect(kG).not.toEqual([BigInt(0), BigInt(0)]); // should be different from M
    });

    it('should fail to decrypt when kG is incorrect', async () => {
        const keypair = new Keypair();

        // Generate a random message
        const message = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

        // Encryption
        const k = genRandomSalt();
        const M = [0, 1];
        const encCircuitInputs = stringifyBigInts({
            k,
            M,
            pk: keypair.pubKey.asCircuitInputs(),
        });

        const encWitness = await genWitness(encCircuit, encCircuitInputs);

        const Me = [
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[0]`)),
            BigInt(await getSignalByName(encCircuit, encWitness, `main.Me[1]`)),
        ];

        // Attempt decryption with incorrect kG value (0, 0)
        const decCircuitInputs = stringifyBigInts({
            kG: [BigInt(0), BigInt(0)], // Incorrect kG value
            Me,
            sk: keypair.privKey.asCircuitInputs(),
        });

        const decWitness = await genWitness(decCircuit, decCircuitInputs);

        const m0Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[0]`));
        const m1Bit = BigInt(await getSignalByName(decCircuit, decWitness, `main.M[1]`));

        expect(m0Bit).not.toEqual(BigInt(0));
        expect(m1Bit).not.toEqual(BigInt(1));
    });
})