jest.setTimeout(120000)
import { 
    stringifyBigInts, 
    genPrivKey, 
    elGamalEncryptBit,
    elGamalDecryptBit,
} from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

import {
    Keypair,
} from 'maci-domainobjs'

describe('El Gamal rerandomization circuit', () => {
    const circuit = 'elGamalRerandomize_test'

    it('correctly computes rerandomized values', async () => {
        const keypair = new Keypair();

        const z = genPrivKey();  
        for (let bit = 0; bit < 2; bit ++) {
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
})
