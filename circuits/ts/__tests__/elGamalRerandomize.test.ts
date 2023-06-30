jest.setTimeout(120000)
import {
    stringifyBigInts,
    genPrivKey,
    elGamalEncryptBit,
    elGamalDecryptBit,
    babyJubMaxValue,   
    elGamalRerandomize,
} from 'maci-crypto'

import {
    genWitness,
    getSignalByName,
} from './utils'

import {
    Keypair,
} from 'maci-domainobjs'

// import { babyJub } from 'circomlib'

describe('El Gamal rerandomization circuit', () => {
    const circuit = 'elGamalRerandomize_test'

    it('should correctly re-randomize the cyphertext from 0 and 1 bit', async () => {
        const keypair = new Keypair();
        const z = genPrivKey();
        
        for (let bit = 0; bit < 2; bit++) {
            const y = genPrivKey();
            const [c1, c2] = elGamalEncryptBit(keypair.pubKey.rawPubKey, BigInt(bit), y);

            const circuitInputs = stringifyBigInts({
                pubKey: keypair.pubKey.asCircuitInputs(),
                c1,
                c2,
                z,
            })

            const witness = await genWitness(circuit, circuitInputs)

            const [c1r0, c1r1] = [
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[1]')),
            ];

            const [c2r0, c2r1] = [
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[1]')),
            ];

            const [c1R, c2R] = [[c1r0, c1r1], [c2r0, c2r1]];

            const dBit = elGamalDecryptBit(keypair.privKey.rawPrivKey, c1R, c2R);

            expect(dBit).toEqual(BigInt(bit));
        }
    })

    /** Fixed */
    
    it('should correctly handle large inputs', async () => {
        const keypair = new Keypair();

        for (let bit = 0; bit < 2; bit++) {
            const y = genPrivKey();
            const [c1, c2] = elGamalEncryptBit(keypair.pubKey.rawPubKey, BigInt(bit), y);

            const z = babyJubMaxValue; // largest possible value
            const circuitInputs = stringifyBigInts({
                pubKey: keypair.pubKey.asCircuitInputs(),
                c1,
                c2,
                z
            });

            const witness = await genWitness(circuit, circuitInputs);
            const [c1r0, c1r1] = [
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[1]')),
            ];
            const [c2r0, c2r1] = [
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[1]')),
            ];
            const [c1R, c2R] = [[c1r0, c1r1], [c2r0, c2r1]];

            const dBit = elGamalDecryptBit(keypair.privKey.rawPrivKey, c1R, c2R);
            expect(dBit).toEqual(BigInt(bit));
        }
    })

    it('should match rerandomized values from crypto library', async () => {
        const keypair = new Keypair();

        for (let bit = 0; bit < 2; bit++) {
            const y = BigInt(42);
            const [c1, c2] = elGamalEncryptBit(keypair.pubKey.rawPubKey, BigInt(bit), y);
            const [c1rLib, c2rLib] = elGamalRerandomize(keypair.pubKey.rawPubKey, y, c1, c2);

            const circuitInputs = stringifyBigInts({
                pubKey: keypair.pubKey.asCircuitInputs(),
                c1,
                c2,
                z: y
            });

            const witness = await genWitness(circuit, circuitInputs);
            const [c1r0, c1r1] = [
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c1r[1]')),
            ];
            const [c2r0, c2r1] = [ 
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[0]')),
                BigInt(await getSignalByName(circuit, witness, 'main.c2r[1]')),
            ];

            expect(c1rLib[0].toString()).toEqual(c1r0.toString());
            expect(c1rLib[1].toString()).toEqual(c1r1.toString());
            expect(c2rLib[0].toString()).toEqual(c2r0.toString());
            expect(c2rLib[1].toString()).toEqual(c2r1.toString());
        }
    })

    
    /** To be checked */

    // TODO: Currently fails with Invalid point value because point addition leads to points that are not 0 or G.
    // Verify if we need to\can test addition at all. 
    // it('correctly handles re-randomization consistency', async () => {
    //     const keypair = new Keypair();

    //     for (let bit = 0; bit < 2; bit++) {
    //         const y = genPrivKey();
    //         const [c1, c2] = elGamalEncryptBit(keypair.pubKey.rawPubKey, BigInt(bit), y);

    //         const z1 = genPrivKey();
    //         const circuitInputs1 = stringifyBigInts({
    //             pubKey: keypair.pubKey.asCircuitInputs(),
    //             c1,
    //             c2,
    //             z: z1,
    //         });
    //         const witness1 = await genWitness(circuit, circuitInputs1);

    //         const [c1r10, c1r11] = [
    //             BigInt(await getSignalByName(circuit, witness1, 'main.c1r[0]')),
    //             BigInt(await getSignalByName(circuit, witness1, 'main.c1r[1]')),
    //         ];
    //         const [c2r10, c2r11] = [
    //             BigInt(await getSignalByName(circuit, witness1, 'main.c2r[0]')),
    //             BigInt(await getSignalByName(circuit, witness1, 'main.c2r[1]')),
    //         ];

    //         const z2 = genPrivKey();
    //         const circuitInputs2 = stringifyBigInts({
    //             pubKey: keypair.pubKey.asCircuitInputs(),
    //             c1: [c1r10, c1r11],
    //             c2: [c2r10, c2r11],
    //             z: z2,
    //         });
    //         const witness2 = await genWitness(circuit, circuitInputs2);

    //         const [c1r20, c1r21] = [
    //             BigInt(await getSignalByName(circuit, witness2, 'main.c1r[0]')),
    //             BigInt(await getSignalByName(circuit, witness2, 'main.c1r[1]')),
    //         ];
    //         const [c2r20, c2r21] = [
    //             BigInt(await getSignalByName(circuit, witness2, 'main.c2r[0]')),
    //             BigInt(await getSignalByName(circuit, witness2, 'main.c2r[1]')),
    //         ];

    //         const c1Combined = babyJubAddPoint([c1r10, c1r11], [c1r20, c1r21]);
    //         const c2Combined = babyJubAddPoint([c2r10, c2r11], [c2r20, c2r21]);

    //         const dBit = elGamalDecryptBit(keypair.privKey.rawPrivKey, c1Combined, c2Combined);
    //         expect(dBit).toEqual(BigInt(bit));
    //     }
    // })
})
