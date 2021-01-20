require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    sha256Hash,
    hashLeftRight,
    hash3,
    hash4,
    hash5,
    hash12,
    genRandomSalt,
} from 'maci-crypto'

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT4 = require('@maci-contracts/compiled/PoseidonT4.json')
const PoseidonT5 = require('@maci-contracts/compiled/PoseidonT5.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

import { loadAB, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let hasherContract
let PoseidonT3Contract
let PoseidonT4Contract
let PoseidonT5Contract
let PoseidonT6Contract

describe('Hasher', () => {
    beforeAll(async () => {
        deployer = new JSONRPCDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying Poseidon')

        PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})
        PoseidonT4Contract = await deployer.deploy(PoseidonT4.abi, PoseidonT4.bytecode, {})
        PoseidonT5Contract = await deployer.deploy(PoseidonT5.abi, PoseidonT5.bytecode, {})
        PoseidonT6Contract = await deployer.deploy(PoseidonT6.abi, PoseidonT6.bytecode, {})

        // Link Poseidon contracts
        linkPoseidonLibraries(
            ['crypto/Hasher.sol'],
            PoseidonT3Contract.address,
            PoseidonT4Contract.address,
            PoseidonT5Contract.address,
            PoseidonT6Contract.address,
        )

        const [ HasherAbi, HasherBin ] = loadAB('Hasher')

        console.log('Deploying Hasher')
        hasherContract = await deployer.deploy(
            HasherAbi,
            HasherBin,
        )
    })

    it('maci-crypto.sha256Hash should match hasher.sha256Hash', async () => {
        expect.assertions(5)
        const values: string[] = []
        for (let i = 0; i < 5; i++) {
            values.push(genRandomSalt().toString())
            const hashed = sha256Hash(values.map(BigInt))

            const onChainHash = await hasherContract.sha256Hash(values)
            expect(onChainHash.toString()).toEqual(hashed.toString())
        }
    })

    it('maci-crypto.hashLeftRight should match hasher.hashLeftRight', async () => {
        const left = genRandomSalt()
        const right = genRandomSalt()
        const hashed = hashLeftRight(left, right)

        const onChainHash = await hasherContract.hashLeftRight(left.toString(), right.toString())
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash3 should match hasher.hash3', async () => {
        const values: string[] = []
        for (let i = 0; i < 3; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash3(values.map(BigInt))

        const onChainHash = await hasherContract.hash3(values)
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash4 should match hasher.hash4', async () => {
        const values: string[] = []
        for (let i = 0; i < 4; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash4(values.map(BigInt))

        const onChainHash = await hasherContract.hash4(values)
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash5 should match hasher.hash5', async () => {
        const values: string[] = []
        for (let i = 0; i < 5; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash5(values.map(BigInt))

        const onChainHash = await hasherContract.hash5(values)
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash12 should match hasher.hash12', async () => {
        const values: string[] = []
        for (let i = 0; i < 12; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash12(values.map(BigInt))
        const onChainHash = await hasherContract.hash12(values)

        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash12 should match hasher.hash12 for 11 elements', async () => {
        const values: string[] = []
        for (let i = 0; i < 11; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash12(values.map(BigInt))
        const onChainHash = await hasherContract.hash12(values)

        expect(onChainHash.toString()).toEqual(hashed.toString())
    })
})
