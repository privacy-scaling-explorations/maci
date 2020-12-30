jest.setTimeout(90000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

import {
    Command,
    Message,
    Keypair,
} from 'maci-domainobjs'

import {
    stringifyBigInts,
    genRandomSalt,
    hashLeftRight,
    hash5,
    hash11,
} from 'maci-crypto'

describe('Poseidon hash circuits', () => {
    describe('MessageHasher', () => {
        const circuit = 'messageHasher_test'
        it('correctly hashes a message', async () => {
            const k = new Keypair()
            const random50bitBigInt = (): BigInt => {
                return (
                    (BigInt(1) << BigInt(50)) - BigInt(1)
                ) & BigInt(genRandomSalt())
            }

            const command: Command = new Command(
                random50bitBigInt(),
                k.pubKey,
                random50bitBigInt(),
                random50bitBigInt(),
                random50bitBigInt(),
                random50bitBigInt(),
                genRandomSalt(),
            )

            const { privKey, pubKey } = new Keypair()
            const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, k.pubKey)
            const signature = command.sign(privKey)
            const message = command.encrypt(signature, ecdhSharedKey)
            const messageHash = message.hash()
            const circuitInputs = stringifyBigInts({
                in: message.asCircuitInputs()
            })
            const witness = await genWitness(circuit, circuitInputs)
            const output = await getSignalByName(circuit, witness, 'main.hash')
            expect(output.toString()).toEqual(messageHash.toString())
        })
    })

    describe('Hasher5', () => {
        const circuit = 'hasher5_test'
        it('correctly hashes 5 random values', async () => {
            const preImages: any = []
            for (let i = 0; i < 5; i++) {
                preImages.push(genRandomSalt())
            }

            const circuitInputs = stringifyBigInts({
                in: preImages,
            })

            const witness = await genWitness(circuit, circuitInputs)
            const output = await getSignalByName(circuit, witness, 'main.hash')

            const outputJS = hash5(preImages)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })

    describe('Hasher11', () => {
        it('correctly hashes 11 random values', async () => {
            const circuit =  'hasher11_test'
            const preImages: any = []
            for (let i = 0; i < 11; i++) {
                preImages.push(genRandomSalt())
            }
            const circuitInputs = stringifyBigInts({
                in: preImages,
            })

            const witness = await genWitness(circuit, circuitInputs)
            const output = await getSignalByName(circuit, witness, 'main.hash')

            const outputJS = hash11(preImages)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })

    describe('HashLeftRight', () => {

        it('correctly hashes two random values', async () => {
            const circuit = 'hashleftright_test'

            const left = genRandomSalt()
            const right = genRandomSalt()

            const circuitInputs = stringifyBigInts({ left, right })

            const witness = await genWitness(circuit, circuitInputs)
            const output = await getSignalByName(circuit, witness, 'main.hash')

            const outputJS = hashLeftRight(left, right)

            expect(output.toString()).toEqual(outputJS.toString())
        })
    })
})
