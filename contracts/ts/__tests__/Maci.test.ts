require('module-alias/register')

jest.setTimeout(1200000)

import * as fs from 'fs'
import * as path from 'path'
import * as ethers from 'ethers'
import * as etherlime from 'etherlime-lib'

import { genAccounts, genTestAccounts } from '../accounts'
import { timeTravel } from '../../node_modules/etherlime/cli-commands/etherlime-test/time-travel.js'

import { config } from 'maci-config'

import { formatProofForVerifierContract } from '../utils'

import {
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    genDeployer,
} from '../deploy'

import {
    bigInt,
    hash,
    hashOne,
    genKeyPair,
    setupTree,
    genPubKey,
    genRandomSalt,
    SnarkBigInt,
    genEcdhSharedKey,
    NOTHING_UP_MY_SLEEVE,
    unstringifyBigInts,
    stringifyBigInts,
} from 'maci-crypto'

import {
    StateLeaf,
    Message,
    Command,
    Keypair,
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import {
    processMessage,
} from 'maci-core'

import {
    compileAndLoadCircuit,
    genBatchUstInputs,
} from 'maci-circuits'

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    genProof,
    verifyProof,
    parseVerifyingKeyJson,
    genPublicSignals,
} from 'libsemaphore'

const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)
let emptyVoteOptionTreeRoot
const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const numVoteOptions = 2 ** voteOptionTreeDepth
const intermediateStateTreeDepth = config.maci.merkleTrees.intermediateStateTreeDepth

const messageTree = setupTree(
    config.maci.merkleTrees.messageTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

let stateTree = setupTree(
    config.maci.merkleTrees.stateTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

const loadPk = (binName: string): SnarkProvingKey => {
    const p = path.join(__dirname, '../../../circuits/build/' + binName + '.bin')
    return fs.readFileSync(p)
}

const loadkVk = (jsonName: string): SnarkVerifyingKey => {
    const p = path.join(__dirname, '../../../circuits/build/' + jsonName + '.json')
    return parseVerifyingKeyJson(fs.readFileSync(p).toString())
}

const batchUstPk: SnarkProvingKey = loadPk('batchUstPk')
const qvtPk: SnarkProvingKey = loadPk('qvtPk')

const batchUstVk: SnarkVerifyingKey = loadkVk('batchUstVk')
const qvtVk: SnarkVerifyingKey = loadkVk('qvtVk')

let qvtCircuit
let batchUstCircuit

describe('MACI', () => {
    let maciContract
    let signUpTokenContract
    let signUpTokenGatekeeperContract

    // Set up users
    const coordinator = new Keypair(new PrivKey(bigInt(config.maci.coordinatorPrivKey)))

    const user1 = {
        wallet: accounts[1],
        keypair: new Keypair(),
    }

    const user2 = {
        wallet: accounts[2],
        keypair: new Keypair(),
    }

    const badUser = {
        wallet: accounts[3],
        keypair: new Keypair(),
    }

    // This array contains four commands from the same user
    let batch: any[] = []
    for (let i = 0; i < config.maci.messageBatchSize; i++) {
        const voteOptionTree = setupTree(voteOptionTreeDepth, NOTHING_UP_MY_SLEEVE)

        const voteOptionIndex = bigInt(0)
        const newVoteWeight = bigInt(9)

        voteOptionTree.insert(hashOne(newVoteWeight), newVoteWeight)
        for (let i = 1; i < 2 ** voteOptionTreeDepth; i++) {
            voteOptionTree.insert(hashOne(bigInt(0)), bigInt(0))
        }

        const ephemeralKeypair = new Keypair()
        const ecdhSharedKey = Keypair.genEcdhSharedKey(
            ephemeralKeypair.privKey,
            coordinator.pubKey,
        )

        const command: Command = new Command(
            bigInt(1),
            ephemeralKeypair.pubKey,
            voteOptionIndex,
            newVoteWeight,
            bigInt(i),
        )

        const signature = command.sign(user1.keypair.privKey)
        const message = command.encrypt(signature, ecdhSharedKey)

        batch.push({
            ephemeralKeypair,
            ecdhSharedKey,
            command,
            signature,
            message,
            voteOptionTree,
            newVoteWeight,
            voteOptionIndex,
        })
    }

    beforeAll(async () => {
        qvtCircuit = await compileAndLoadCircuit('quadVoteTally_test.circom')
        signUpTokenContract = await deploySignupToken(deployer)
        signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
            deployer,
            signUpTokenContract.contractAddress,
        )
        const contracts = await deployMaci(
            deployer,
            signUpTokenGatekeeperContract.contractAddress,
        )

        maciContract = contracts.maciContract

        const numEth = 0.5
        for (let i = 1; i < accounts.length; i++) {
            const tx = await deployer.provider.sendTransaction(
                accounts[0].sign({
                    nonce: await deployer.provider.getTransactionCount(accounts[0].address),
                    gasPrice: ethers.utils.parseUnits('10', 'gwei'),
                    gasLimit: 21000,
                    to: accounts[i].address,
                    value: ethers.utils.parseUnits(numEth.toString(), 'ether'),
                    data: '0x'
                })
            )
            const receipt = await tx.wait()
            console.log(`Gave away ${numEth} ETH to`, accounts[i].address)
        }

        // give away a signUpToken to each user
        await signUpTokenContract.giveToken(user1.wallet.address)
        await signUpTokenContract.giveToken(user2.wallet.address)

        // Insert a zero value in the off-chain state tree
        stateTree.insert(NOTHING_UP_MY_SLEEVE)

        // Cache an empty vote option tree root
        const temp = setupTree(voteOptionTreeDepth, NOTHING_UP_MY_SLEEVE)

        for (let i = 0; i < 2 ** voteOptionTreeDepth; i++) {
            temp.insert(hashOne(bigInt(0)))
        }

        emptyVoteOptionTreeRoot = temp.root
    })

    it('each user should own a token', async () => {
        const ownerOfToken1 = await signUpTokenContract.ownerOf(1)
        expect(ownerOfToken1).toEqual(user1.wallet.address)

        const ownerOfToken2 = await signUpTokenContract.ownerOf(2)
        expect(ownerOfToken2).toEqual(user2.wallet.address)
    })

    it('the emptyVoteOptionTreeRoot value should be correct', async () => {
        const root = await maciContract.emptyVoteOptionTreeRoot()
        expect(emptyVoteOptionTreeRoot.toString()).toEqual(root.toString())
    })

    it('the stateTree root should be correct', async () => {
        const root = await maciContract.getStateTreeRoot()
        expect(stateTree.root.toString()).toEqual(root.toString())
    })

    describe('Sign-ups', () => {

        it('a user who does not own a SignUpToken should not be able to sign up', async () => {
            expect.assertions(1)

            const wallet = user1.wallet.connect(deployer.provider as any)
            const contract = new ethers.Contract(
                maciContract.contractAddress,
                maciContract.interface.abi,
                wallet,
            )

            try {
                await contract.signUp(
                    user1.keypair.pubKey.asContractParam(),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [2]),
                    { gasLimit: 2000000 },
                )
            } catch (e) {
                expect(e.message.endsWith('SignUpTokenGatekeeper: this user does not own the token')).toBeTruthy()
            }
        })

        it('a user who owns a SignUpToken should be able to sign up', async () => {
            const wallet = user1.wallet.connect(deployer.provider as any)
            const contract = new ethers.Contract(
                maciContract.contractAddress,
                maciContract.interface.abi,
                wallet,
            )
            const tx = await contract.signUp(
                user1.keypair.pubKey.asContractParam(),
                ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                { gasLimit: 2000000 },
            )
            const receipt = await tx.wait()

            expect(receipt.status).toEqual(1)

            const stateLeaf = StateLeaf.genFreshLeaf(
                user1.keypair.pubKey,
                emptyVoteOptionTreeRoot,
                bigInt(config.maci.initialVoiceCreditBalance),
            )

            stateTree.insert(stateLeaf.hash(), stateLeaf)

            const root = await maciContract.getStateTreeRoot()
            expect(stateTree.root.toString()).toEqual(root.toString())
        })

        it('a user who uses a previously used SignUpToken to sign up should not be able to do so', async () => {
            expect.assertions(5)
            const wallet = user1.wallet.connect(deployer.provider as any)
            const wallet2 = user2.wallet.connect(deployer.provider as any)

            const tokenContract = new ethers.Contract(
                signUpTokenContract.contractAddress,
                signUpTokenContract.interface.abi,
                wallet,
            )

            // Send token 1 from user1 to user2
            let tx = await tokenContract.safeTransferFrom(
                user1.wallet.address,
                user2.wallet.address,
                1,
                { gasLimit: 500000 },
            )

            let receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            let ownerOfToken1 = await signUpTokenContract.ownerOf(1)
            expect(ownerOfToken1).toEqual(user2.wallet.address)

            // Attempt to sign up with token 1 as user2, which should fail
            try {
                const maciContract2 = new ethers.Contract(
                    maciContract.contractAddress,
                    maciContract.interface.abi,
                    wallet2,
                )
                await maciContract2.signUp(
                    user2.keypair.pubKey.asContractParam(),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                    { gasLimit: 2000000 },
                )
            } catch (e) {
                expect(e.message.endsWith('SignUpTokenGatekeeper: this token has already been used to sign up')).toBeTruthy()
            }

            // Send the token back to user1 from user2
            const tokenContract2 = new ethers.Contract(
                signUpTokenContract.contractAddress,
                signUpTokenContract.interface.abi,
                wallet2,
            )

            tx = await tokenContract2.safeTransferFrom(
                user2.wallet.address,
                user1.wallet.address,
                1,
                { gasLimit: 500000 },
            )

            receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            ownerOfToken1 = await signUpTokenContract.ownerOf(1)
            expect(ownerOfToken1).toEqual(user1.wallet.address)
        })

        it('nobody can publish a message before the sign-up period passes', async () => {
            expect.assertions(1)
            try {
                await maciContract.publishMessage(
                    batch[0].message.asContractParam(),
                    batch[0].ephemeralKeypair.pubKey.asContractParam(),
                )
            } catch (e) {
                expect(e.message.endsWith('MACI: the sign-up period is not over')).toBeTruthy()
            }
        })

        it('nobody can sign up after the sign-up period is over', async () => {
            expect.assertions(1)
            
            // Move forward in time
            await timeTravel(deployer.provider, config.maci.signUpDurationInSeconds + 1)

            try {
                await maciContract.signUp(
                    user1.keypair.pubKey.asContractParam(),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                    { gasLimit: 2000000 },
                )
            } catch (e) {
                expect(e.message.endsWith('MACI: the sign-up period has passed')).toBeTruthy()
            }
        })
    })

    describe('Publish messages', () => {

        it('publishMessage should add a leaf to the message tree', async () => {

            expect.assertions(3 * config.maci.messageBatchSize)

            // Publish all messages so we can process them as a batch later on
            for (let i = 0; i < config.maci.messageBatchSize; i++) {
                // Check the on-chain message tree root against a root computed off-chain
                let root = await maciContract.getMessageTreeRoot()

                expect(root.toString()).toEqual(messageTree.root.toString())

                // Insert the message and do the same
                messageTree.insert(batch[i].message.hash())

                const tx = await maciContract.publishMessage(
                    batch[i].message.asContractParam(),
                    batch[i].ephemeralKeypair.pubKey.asContractParam(),
                )
                const receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                root = await maciContract.getMessageTreeRoot()
                expect(root.toString()).toEqual(messageTree.root.toString())
            }
        })
    })

    describe('Process messages', () => {

        it('batchProcessMessage should verify a proof and update the postSignUpStateRoot', async () => {

            batchUstCircuit = await compileAndLoadCircuit('batchUpdateStateTree_test.circom')

            let results: any[] = []
            let ecdhPublicKeyBatch: any[] = []

            const messageTreeBatchStartIndex = 0
            let stateTreeBatchRaw: SnarkBigInt[] = []
            let stateTreeBatchRoot: SnarkBigInt[] = []
            let stateTreeBatchPathElements: SnarkBigInt[] = []
            let stateTreeBatchPathIndices: SnarkBigInt[] = []
            let messageTreeBatchPathElements: SnarkBigInt[] = []

            let userVoteOptionsBatchRoot: SnarkBigInt[] = []
            let userVoteOptionsBatchPathElements: SnarkBigInt[] = []
            let userVoteOptionsBatchPathIndices: SnarkBigInt[] = []
            let voteOptionTreeBatchLeafRaw: SnarkBigInt[] = []

            // Iterate through the batch of messages
            for (let i = 0; i < config.maci.messageBatchSize; i++) {
                const {
                    ephemeralKeypair,
                    ecdhSharedKey,
                    command,
                    signature,
                    message,
                    voteOptionTree,
                } = batch[i]

                ecdhPublicKeyBatch.push(ephemeralKeypair.pubKey)

                const [ messageTreePathElements, _ ] = messageTree.getPathUpdate(i)

                // Note that all the messages are from the same user, whose
                // leaf is at index 1

                const [
                    stateTreePathElements,
                    stateTreePathIndices
                ] = stateTree.getPathUpdate(1)

                stateTreeBatchRaw.push(stateTree.leavesRaw[1])

                stateTreeBatchRoot.push(stateTree.root)
                stateTreeBatchPathElements.push(stateTreePathElements)
                stateTreeBatchPathIndices.push(stateTreePathIndices)

                messageTreeBatchPathElements.push(messageTreePathElements)

                const [
                    userVoteOptionsPathElements,
                    userVoteOptionsPathIndices
                ] = voteOptionTree.getPathUpdate(command.voteOptionIndex)

                userVoteOptionsBatchRoot.push(voteOptionTree.root)
                userVoteOptionsBatchPathElements.push(userVoteOptionsPathElements)
                userVoteOptionsBatchPathIndices.push(userVoteOptionsPathIndices)

                voteOptionTreeBatchLeafRaw.push(voteOptionTree.leavesRaw[command.voteOptionIndex])

                const result = processMessage(
                    ecdhSharedKey,
                    message,
                    stateTree,
                    voteOptionTree,
                )

                results.push(result)

                stateTree = result.stateTree
            }

            const stateTreeMaxIndex = bigInt(stateTree.nextIndex - 1)
            const voteOptionsMaxIndex = config.maci.voteOptionsMaxLeafIndex

            const randomLeafRoot = stateTree.root
            const randomStateLeaf = StateLeaf.genRandomLeaf()
            const [randomLeafPathElements, _] = stateTree.getPathUpdate(0)

            const circuitInputs = genBatchUstInputs(
                coordinator,
                batch.map((r) => r.message),
                ecdhPublicKeyBatch,
                messageTree,
                messageTreeBatchPathElements,
                messageTreeBatchStartIndex,
                randomStateLeaf,
                randomLeafRoot,
                randomLeafPathElements,
                voteOptionTreeBatchLeafRaw,
                userVoteOptionsBatchRoot,
                userVoteOptionsBatchPathElements,
                userVoteOptionsBatchPathIndices,
                voteOptionsMaxIndex,
                stateTreeBatchRaw,
                stateTreeMaxIndex,
                stateTreeBatchRoot,
                stateTreeBatchPathElements,
                stateTreeBatchPathIndices,
            )

            const witness = batchUstCircuit.calculateWitness(circuitInputs)
            expect(batchUstCircuit.checkWitness(witness)).toBeTruthy()

            const idx = batchUstCircuit.getSignalIdx('main.root')
            const circuitNewStateRoot = witness[idx].toString()

            // Update the first leaf in the state tree with a random value
            stateTree.update(0, randomStateLeaf.hash(), randomStateLeaf)

            expect(stateTree.root.toString()).toEqual(circuitNewStateRoot)

            const publicSignals = genPublicSignals(witness, batchUstCircuit)
            expect(publicSignals).toHaveLength(19)

            const contractPublicSignals = await maciContract.genBatchUstPublicSignals(
                stateTree.root.toString(),
                stateTreeBatchRoot.map((x) => x.toString()),
                ecdhPublicKeyBatch.map((x) => x.asContractParam()),
            )

            expect(JSON.stringify(publicSignals.map((x) => x.toString()))).toEqual(
                JSON.stringify(contractPublicSignals.map((x) => x.toString()))
            )

            console.log('Generating proof...')
            const proof = await genProof(witness, batchUstPk)

            const isValid = verifyProof(batchUstVk, proof, publicSignals)
            expect(isValid).toBeTruthy()

            try {
                await maciContract.batchProcessMessage(
                    stateTree.root.toString(),
                    stateTreeBatchRoot.map((x) => x.toString()),
                    ecdhPublicKeyBatch.map((x) => x.asContractParam()),
                    formatProofForVerifierContract(proof),
                    { gasLimit: 2000000 },
                )
            } catch (e) {
                expect(e.message.endsWith('MACI: the voting period is not over')).toBeTruthy()
            }

            // Move forward in time
            await timeTravel(deployer.provider, config.maci.votingDurationInSeconds + 1)

            const tx = await maciContract.batchProcessMessage(
                stateTree.root.toString(),
                stateTreeBatchRoot.map((x) => x.toString()),
                ecdhPublicKeyBatch.map((x) => x.asContractParam()),
                formatProofForVerifierContract(proof),
                { gasLimit: 2000000 },
            )

            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)

            const postSignUpStateRoot = await maciContract.postSignUpStateRoot()
            expect(postSignUpStateRoot.toString()).toEqual(stateTree.root.toString())
        })
    })

    describe('Tally votes', () => {

        const salt = genRandomSalt()
        const currentResultsSalt = genRandomSalt()
        const batchSize = 2 ** config.maci.merkleTrees.intermediateStateTreeDepth

        let voteOptionTrees = []
        let intermediateLeaf

        const intermediateStateTree = setupTree(
            stateTreeDepth - intermediateStateTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )

        let qvtWitness
        let intermediateStateRoot: SnarkBigInt
        let currentResultsCommitment: SnarkBigInt
        let newResultsCommitment: SnarkBigInt
        let finalSaltedResults: string[]

        it('the inputs and witness should be valid', async ()=> {
            let circuitInputs = {}

            const blankStateLeaf = StateLeaf.genFreshLeaf(
                new PubKey([0, 0]),
                emptyVoteOptionTreeRoot,
                bigInt(config.maci.initialVoiceCreditBalance),
            )

            // Pad the state tree
            stateTree.insert(blankStateLeaf.hash(), blankStateLeaf)
            stateTree.insert(blankStateLeaf.hash(), blankStateLeaf)

            // Compute the Merkle proof for the batch
            const batchTree = setupTree(intermediateStateTreeDepth, NOTHING_UP_MY_SLEEVE)
            const emptyBatchTreeRoot = batchTree.root
            const batchSize = 2 ** intermediateStateTreeDepth

            for (let i = 0; i < batchSize; i++) {
                batchTree.insert(stateTree.leaves[i])
            }

            intermediateStateTree.insert(batchTree.root)
            for (let i = 1; i < 2 ** intermediateStateTreeDepth; i++) {
                intermediateStateTree.insert(emptyBatchTreeRoot)
            }

            expect(intermediateStateTree.root.toString()).toEqual(stateTree.root.toString())
            const intermediatePathIndex = 0
            const [intermediatePathElements, _] = intermediateStateTree.getPathUpdate(intermediatePathIndex)

            // Calculate the commitment to the current results (all zero)
            let currentResults: SnarkBigInt[] = []
            for (let i = 0; i < numVoteOptions; i++) {
                currentResults.push(bigInt(0))
            }

            // Set the vote leaves
            // signal private input voteLeaves[numUsers][numVoteOptions];
            let voteLeaves: any[] = []
            for (let i = 0; i < batchSize; i++) {
                let votes: any[] = []
                for (let j = 0; j < numVoteOptions; j++) {
                    votes.push(bigInt(0))
                }
                if (i === 1) {
                    votes[batch[i].voteOptionIndex] = batch[i].newVoteWeight
                }
                voteLeaves.push(votes)
            }

            currentResultsCommitment = hash([...currentResults, currentResultsSalt])

            circuitInputs['voteLeaves'] = voteLeaves
            circuitInputs['currentResults'] = currentResults
            circuitInputs['fullStateRoot'] = stateTree.root.toString()
            circuitInputs['newResultsSalt'] = salt.toString()
            circuitInputs['currentResultsSalt'] = currentResultsSalt.toString()
            circuitInputs['currentResultsCommitment'] = currentResultsCommitment.toString()
            circuitInputs['intermediateStateRoot'] = intermediateStateTree.leaves[intermediatePathIndex]
            circuitInputs['intermediatePathElements'] = intermediatePathElements
            circuitInputs['intermediatePathIndex'] = intermediatePathIndex
            circuitInputs['stateLeaves'] = stateTree.leavesRaw.map((x) => x.asCircuitInputs())

            qvtWitness = qvtCircuit.calculateWitness(stringifyBigInts(circuitInputs))
            expect(qvtCircuit.checkWitness(qvtWitness)).toBeTruthy()

            const expected = [bigInt(9)]
            for (let i = 0; i < 2 ** voteOptionTreeDepth - 1; i++) {
                expected.push(bigInt(0))
            }
            const expectedCommitment = hash([...expected, salt])

            finalSaltedResults = [...expected, salt].map((x) => x.toString())

            newResultsCommitment = qvtWitness[qvtCircuit.getSignalIdx('main.newResultsCommitment')]
            expect(newResultsCommitment.toString()).toEqual(expectedCommitment.toString())

            intermediateStateRoot = intermediateStateTree.leaves[intermediatePathIndex]
        })

        it('should not tally votes if the state tree is not padded', async () => {
            expect.assertions(2)

            const errorMsg = 'MACI: the state tree needs to be padded with blank leaves'
            try {
                await maciContract.proveVoteTallyBatch(
                    0, 0, 0, [], [0, 0, 0, 0, 0, 0, 0, 0],
                )
            } catch (e) {
                expect(e.message.endsWith(errorMsg)).toBeTruthy()
            }

            // Pad the tree and try again; the error message should differ
            await maciContract.padStateTree(3)

            try {
                await maciContract.proveVoteTallyBatch(
                    0, 0, 0, [], [0, 0, 0, 0, 0, 0, 0, 0],
                )
            } catch (e) {
                expect(e.message.endsWith(errorMsg)).toBeFalsy()
            }
        })

        it('should not tally a batch of votes if the final results are invalid', async () => {
            expect.assertions(1)
            let invalidResults: string[] = []
            for (let i = 0; i < finalSaltedResults.length; i++) {
                invalidResults.push('0')
            }

            try {
                await maciContract.proveVoteTallyBatch(
                    intermediateStateRoot.toString(),
                    currentResultsCommitment.toString(),
                    newResultsCommitment.toString(),
                    invalidResults,
                    [0, 0, 0, 0, 0, 0, 0, 0],
                )
            } catch (e) {
                expect(e.message.endsWith("MACI: the hash of the salted final results provided do not match the commitment")).toBeFalsy()
            }
        })

        it('should tally a batch of votes', async () => {
            const publicSignals = genPublicSignals(qvtWitness, qvtCircuit)

            expect(publicSignals[0].toString()).toEqual(newResultsCommitment.toString())
            expect(publicSignals[1].toString()).toEqual(stateTree.root.toString())
            expect(publicSignals[2].toString()).toEqual('0')
            expect(publicSignals[3].toString()).toEqual(intermediateStateRoot.toString())
            expect(publicSignals[4].toString()).toEqual(currentResultsCommitment.toString())

            console.log('Generating proof...')
            const proof = await genProof(qvtWitness, qvtPk)

            const isValid = verifyProof(qvtVk, proof, publicSignals)
            expect(isValid).toBeTruthy()

            const tx = await maciContract.proveVoteTallyBatch(
                intermediateStateRoot.toString(),
                currentResultsCommitment.toString(),
                newResultsCommitment.toString(),
                finalSaltedResults,
                formatProofForVerifierContract(proof),
                { gasLimit: 2000000 },
            )
            const receipt = await tx.wait()
            expect(receipt.status).toEqual(1)
        })
    })
})
