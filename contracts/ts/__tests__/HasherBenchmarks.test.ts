require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
} from 'maci-crypto'

import { deployPoseidonContracts, JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/artifacts/PoseidonT3.json')
const PoseidonT4 = require('@maci-contracts/artifacts/PoseidonT4.json')
const PoseidonT5 = require('@maci-contracts/artifacts/PoseidonT5.json')
const PoseidonT6 = require('@maci-contracts/artifacts/PoseidonT6.json')

import { parseArtifact, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let hasherContract

describe('Hasher', () => {
    beforeAll(async () => {
        deployer = new JSONRPCDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying Poseidon contracts')
        const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } = await deployPoseidonContracts(deployer)
        console.log(
			PoseidonT3Contract.address,
			PoseidonT4Contract.address,
			PoseidonT5Contract.address,
			PoseidonT6Contract.address,
		)

		/*
        // Link Poseidon contracts
        linkPoseidonLibraries(
            ['testing/HasherBenchmarks.sol'],
            PoseidonT3Contract.address,
            PoseidonT4Contract.address,
            PoseidonT5Contract.address,
            PoseidonT6Contract.address,
        )

        const [ HasherAbi, HasherBin ] = parseArtifact('HasherBenchmarks')

        console.log('Deploying Hasher')
        hasherContract = await deployer.deploy(
            HasherAbi,
            HasherBin,
        )

		*/

    	// await hasherContract.deployTransaction.wait()
    })

    it('hashLeftRight', async () => {
        const left = genRandomSalt()
        const right = genRandomSalt()

        const tx = await hasherContract.hashLeftRightBenchmark(left.toString(), right.toString())
        const receipt = await tx.wait()
        console.log('hashLeftRight:', receipt.gasUsed.toString())
    })

    it('hash5', async () => {
        const values: string[] = []
        for (let i = 0; i < 5; i++) {
            values.push(genRandomSalt().toString())
        }

        const tx = await hasherContract.hash5Benchmark(values)
        const receipt = await tx.wait()
        console.log('hash5:', receipt.gasUsed.toString())
    })

    //it('hash11', async () => {
        //const values: string[] = []
        //for (let i = 0; i < 11; i++) {
            //values.push(genRandomSalt().toString())
        //}

        //const tx = await hasherContract.hash11Benchmark(values)
        //const receipt = await tx.wait()
        //console.log('hash11:', receipt.gasUsed.toString())
    //})
})

