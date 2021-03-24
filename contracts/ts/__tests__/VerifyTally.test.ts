require('module-alias/register')
jest.setTimeout(50000)
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    hashLeftRight,
    genRandomSalt,
    IncrementalQuinTree,
} from 'maci-crypto'
import { genTallyResultCommitment } from 'maci-core'

import { JSONRPCDeployer } from '../deploy'
const PoseidonT3 = require('@maci-contracts/artifacts/PoseidonT3.json')
const PoseidonT4 = require('@maci-contracts/artifacts/PoseidonT4.json')
const PoseidonT5 = require('@maci-contracts/artifacts/PoseidonT5.json')
const PoseidonT6 = require('@maci-contracts/artifacts/PoseidonT6.json')

import { parseArtifact, linkPoseidonLibraries } from '../'

const accounts = genTestAccounts(1)
let deployer
let verifyTallyContract
const DEPTH = 4
let PoseidonT3Contract
let PoseidonT4Contract
let PoseidonT5Contract
let PoseidonT6Contract

describe('VerifyTally', () => {
    beforeAll(async () => {
        deployer = new JSONRPCDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying Poseidon contracts')
        PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})
        PoseidonT4Contract = await deployer.deploy(PoseidonT4.abi, PoseidonT4.bytecode, {})
        PoseidonT5Contract = await deployer.deploy(PoseidonT5.abi, PoseidonT5.bytecode, {})
        PoseidonT6Contract = await deployer.deploy(PoseidonT6.abi, PoseidonT6.bytecode, {})

        // Link Poseidon contracts
        linkPoseidonLibraries(
            'VerifyTally.sol',
            PoseidonT3Contract.address,
            PoseidonT4Contract.address,
            PoseidonT5Contract.address,
            PoseidonT6Contract.address,
        )

        const [ VerifyTallyAbi, VerifyTallyBin ] = parseArtifact('VerifyTally')

        console.log('Deploying VerifyTally')
        verifyTallyContract = await deployer.deploy(
            VerifyTallyAbi,
            VerifyTallyBin,
        )

    })

    it('computeMerklePath() should generate the correct root', async () => {
        const results: BigInt[] = []
        for (let i = 0; i < 8; i ++) {
            results.push(genRandomSalt())
        }
        const salt = genRandomSalt()
        const commitment = genTallyResultCommitment(results, salt, DEPTH)

        const tree = new IncrementalQuinTree(DEPTH, BigInt(0))
        for (const result of results) {
            tree.insert(result)
        }
        const root = tree.root
        const expectedTallyCommitment = hashLeftRight(root, salt)
        expect(expectedTallyCommitment.toString()).toEqual(commitment.toString())

        for (let i = 0; i < 8; i ++) {
            const index = i
            const proof = tree.genMerklePath(index)
            expect(IncrementalQuinTree.verifyMerklePath(proof, tree.hashFunc)).toBeTruthy()

            const computedRoot = await verifyTallyContract.computeMerkleRootFromPath(
                DEPTH,
                index,
                results[index].toString(),
                proof.pathElements.map((x) => x.map((y) => y.toString())),
            )
            expect(computedRoot.toString()).toEqual(root.toString())
        }
    })

})
