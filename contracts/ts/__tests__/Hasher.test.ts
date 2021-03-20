require('module-alias/register')
const { ethers } = require('hardhat')
import { config } from 'maci-config'
import {
    sha256Hash,
    hashLeftRight,
    hash3,
    hash4,
    hash5,
    genRandomSalt,
} from 'maci-crypto'


import { parseArtifact, linkPoseidonLibraries } from '../'

let deployer
let hasherContract

describe('Hasher', () => {
    beforeAll(async () => {
        const signers = await ethers.getSigners()
        const signer = signers[0]
        console.log('Deploying Poseidon')

        const PoseidonT3ContractFactory = await ethers.getContractFactory('PoseidonT3', signer)
        const PoseidonT4ContractFactory = await ethers.getContractFactory('PoseidonT4', signer)
        const PoseidonT5ContractFactory = await ethers.getContractFactory('PoseidonT5', signer)
        const PoseidonT6ContractFactory = await ethers.getContractFactory('PoseidonT6', signer)

        const PoseidonT3Contract = await PoseidonT3ContractFactory.deploy()
        const PoseidonT4Contract = await PoseidonT4ContractFactory.deploy()
        const PoseidonT5Contract = await PoseidonT5ContractFactory.deploy()
        const PoseidonT6Contract = await PoseidonT6ContractFactory.deploy()

        const hasherContractFactory = await ethers.getContractFactory(
            'Hasher',
            {
                signer,
                libraries: {
                    PoseidonT3: PoseidonT3Contract.address,
                    PoseidonT4: PoseidonT4Contract.address,
                    PoseidonT5: PoseidonT5Contract.address,
                    PoseidonT6: PoseidonT6Contract.address,
                },
            },
        )

        hasherContract = await hasherContractFactory.deploy()
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
})
