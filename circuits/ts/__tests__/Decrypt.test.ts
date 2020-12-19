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
    Keypair,
} from 'maci-domainobjs'

describe('Decryption circuit', () => {
    const circuit = 'decrypt_test'

    it('Should decrypt a message inside the snark', async () => {
        const keypair = new Keypair()
        const keypair2 = new Keypair()
        const sharedKey = Keypair.genEcdhSharedKey(
            keypair.privKey,
            keypair2.pubKey,
        )

        const cmd: BigInt[] = []
        for (let i = 0; i < 5; i ++) {
            cmd.push(genRandomSalt())
        }
        const msg = encrypt(cmd, sharedKey)

        const circuitInputs = stringifyBigInts({
            'private_key': sharedKey,
            'message': [msg.iv, ...msg.data],
        })

        const witness = await genWitness(circuit, circuitInputs)

        for (let i = 0; i < 4; i++) {
            const out = await getSignalByName(circuit, witness, 'main.out[' + i + ']')
            expect(out.toString()).toEqual(cmd[i].toString())
        }
    })
})
