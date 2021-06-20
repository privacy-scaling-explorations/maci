jest.setTimeout(90000)
import { 
    genWitness,
    getSignalByName,
} from './utils'

import {
    Command,
    Keypair,
} from 'maci-domainobjs'

import {
    stringifyBigInts,
    genRandomSalt,
    sha256Hash,
    hashLeftRight,
    hash12,
    hash5,
    hash4,
    hash3,
} from 'maci-crypto'

describe('Poseidon hash circuits', () => {
    describe('SHA256', () => {
        describe('Sha256HashLeftRight', () => {
            it('correctly hashes two random values', async () => {
                const circuit = 'sha256HashLeftRight_test'

                const left = genRandomSalt()
                const right = genRandomSalt()

                const circuitInputs = stringifyBigInts({ left, right })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = sha256Hash([left, right])

                expect(output.toString()).toEqual(outputJS.toString())
            })
        })

        describe('Sha256Hasher4', () => {
            const circuit = 'sha256Hasher4_test'
            it('correctly hashes 4 random values', async () => {
                const preImages: any = []
                for (let i = 0; i < 4; i++) {
                    preImages.push(genRandomSalt())
                }

                const circuitInputs = stringifyBigInts({
                    in: preImages,
                })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = sha256Hash(preImages)

                expect(output.toString()).toEqual(outputJS.toString())
            })
        })

        describe('Sha256Hasher6', () => {
            const circuit = 'sha256Hasher6_test'
            it('correctly hashes 6 random values', async () => {
                const preImages: any = []
                for (let i = 0; i < 6; i++) {
                    preImages.push(genRandomSalt())
                }

                const circuitInputs = stringifyBigInts({
                    in: preImages,
                })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = sha256Hash(preImages)

                expect(output.toString()).toEqual(outputJS.toString())
            })
        })
    })

    describe('Poseidon', () => {
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

        describe('Hasher4', () => {
            const circuit = 'hasher4_test'
            it('correctly hashes 4 random values', async () => {
                const preImages: any = []
                for (let i = 0; i < 4; i++) {
                    preImages.push(genRandomSalt())
                }

                const circuitInputs = stringifyBigInts({
                    in: preImages,
                })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = hash4(preImages)

                expect(output.toString()).toEqual(outputJS.toString())
            })
        })

        describe('Hasher3', () => {
            const circuit = 'hasher3_test'
            it('correctly hashes 3 random values', async () => {
                const preImages: any = []
                for (let i = 0; i < 3; i++) {
                    preImages.push(genRandomSalt())
                }

                const circuitInputs = stringifyBigInts({
                    in: preImages,
                })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = hash3(preImages)

                expect(output.toString()).toEqual(outputJS.toString())
            })
        })

        describe('Hasher12', () => {
            it('correctly hashes 12 random values', async () => {
                const circuit =  'hasher12_test'
                const preImages: any = []
                for (let i = 0; i < 12; i++) {
                    preImages.push(genRandomSalt())
                }
                const circuitInputs = stringifyBigInts({
                    in: preImages,
                })

                const witness = await genWitness(circuit, circuitInputs)
                const output = await getSignalByName(circuit, witness, 'main.hash')

                const outputJS = hash12(preImages)

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
            const messageHash = message.hash(k.pubKey)
            const circuitInputs = stringifyBigInts({
                in: message.asCircuitInputs(),
                encPubKey: k.pubKey.asCircuitInputs(),
            })
            const witness = await genWitness(circuit, circuitInputs)
            const output = await getSignalByName(circuit, witness, 'main.hash')
            expect(output.toString()).toEqual(messageHash.toString())
        })
    })
})
