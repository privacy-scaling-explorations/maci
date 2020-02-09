require('module-alias/register')

jest.setTimeout(90000)

import * as fs from 'fs'
import * as path from 'path'
import * as ethers from 'ethers'
import * as etherlime from 'etherlime-lib'

import { genAccounts, genTestAccounts } from '../accounts'
import { timeTravel } from '../../node_modules/etherlime/cli-commands/etherlime-test/time-travel.js'

import { config } from 'maci-config'

import {
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    genDeployer,
} from '../deploy'

import {
    bigInt,
    hashOne,
    genKeyPair,
    setupTree,
    genPubKey,
    genRandomSalt,
    SnarkBigInt,
    genEcdhSharedKey,
    NOTHING_UP_MY_SLEEVE,
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

const messageTree = setupTree(
    config.maci.merkleTrees.messageTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

let stateTree = setupTree(
    config.maci.merkleTrees.stateTreeDepth,
    NOTHING_UP_MY_SLEEVE,
)

const provingKeyPath = path.join(__dirname, '../../../circuits/build/batchUstPk.bin')
const provingKey: SnarkProvingKey = fs.readFileSync(provingKeyPath)

const verifyingKeyPath = path.join(__dirname, '../../../circuits/build/batchUstVk.json')
const verifyingKey: SnarkVerifyingKey = parseVerifyingKeyJson(fs.readFileSync(verifyingKeyPath).toString())

describe('MACI', () => {

    let circuit
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
        const voteOptionTree = setupTree(
            config.maci.merkleTrees.voteOptionTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )

        const voteOptionIndex = bigInt(0)
        const newVoteWeight = bigInt(9)

        voteOptionTree.insert( hashOne(newVoteWeight), newVoteWeight)

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
        })
    }

    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('batchUpdateStateTree_test.circom')
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
        const temp = setupTree(
            config.maci.merkleTrees.voteOptionTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )

        emptyVoteOptionTreeRoot = temp.root
    })

    it('each user should own a token', async () => {
        const ownerOfToken1 = await signUpTokenContract.ownerOf(1)
        expect(ownerOfToken1).toEqual(user1.wallet.address)

        const ownerOfToken2 = await signUpTokenContract.ownerOf(2)
        expect(ownerOfToken2).toEqual(user2.wallet.address)
    })

    it('the emptyVoteOptionTreeRoot value should be correct', async () => {
        const tree = setupTree(
            config.maci.merkleTrees.voteOptionTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )
        const root = await maciContract.emptyVoteOptionTreeRoot()
        expect(tree.root.toString()).toEqual(root.toString())
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

        it('a user owns a SignUpToken should be able to sign up', async () => {
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

        it('nobody can sign up after the sign-up period passes', async () => {
            expect.assertions(1)
            await timeTravel(deployer.provider, config.maci.signupDurationInSeconds + 1)
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
            let results: any[] = []
            let ecdhPublicKeyBatch: any[] = []

            let stateTreeBatchRaw: SnarkBigInt[] = []
            let stateTreeBatchRoot: SnarkBigInt[] = []
            let stateTreeBatchPathElements: SnarkBigInt[] = []
            let stateTreeBatchPathIndices: SnarkBigInt[] = []
            let messageTreeBatchPathElements: SnarkBigInt[] = []
            const messageTreeBatchStartIndex = 0

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

            const stateTreeMaxIndex = config.maci.messageBatchSize - 1
            const voteOptionsMaxIndex = bigInt(
                2 ** config.maci.merkleTrees.voteOptionTreeDepth - 1
            )

            const randomLeafRoot = stateTree.root
            const randomLeaf = genRandomSalt()
            const [randomLeafPathElements, _] = stateTree.getPathUpdate(0)

            const circuitInputs = genBatchUstInputs(
                coordinator,
                batch.map((r) => r.message),
                ecdhPublicKeyBatch,
                messageTree,
                messageTreeBatchPathElements,
                messageTreeBatchStartIndex,
                randomLeaf,
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

            const witness = circuit.calculateWitness(circuitInputs)
            expect(circuit.checkWitness(witness)).toBeTruthy()

            const idx = circuit.getSignalIdx('main.root')
            const circuitNewStateRoot = witness[idx].toString()

            // Update the state tree with a random leaf
            stateTree.update(0, randomLeaf)

            expect(stateTree.root.toString()).toEqual(circuitNewStateRoot)

            const publicSignals = genPublicSignals(witness, circuit)
            expect(publicSignals).toHaveLength(19)

            console.log('Generating proof...')
            const proof = await genProof(witness, provingKey)

            const isValid = verifyProof(verifyingKey, proof, publicSignals)
            expect(isValid).toBeTruthy()
        })
    })
})
