jest.setTimeout(500000)
import * as ethers from 'ethers'

import { MaciState } from 'maci-core'

import { bigInt,
    SNARK_FIELD_SIZE,
} from 'maci-crypto'

import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
    StateLeaf,
} from 'maci-domainobjs'

import {
    maciContractAbi,
    initialVoiceCreditProxyAbi,
    genTestAccounts,
} from 'maci-contracts'

import { genPubKey } from 'maci-crypto'

import { config } from 'maci-config'

import { exec, delay } from './utils'

const accounts = genTestAccounts(2)

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

let maciContract
let maciAddress: string
let maciState: MaciState
let stateIndex: string
const providerUrl = config.get('chain.url')
const coordinatorKeypair = new Keypair()
const userKeypair = new Keypair()
const maciPrivkey = coordinatorKeypair.privKey.serialize()
const deployerPrivKey = accounts[0].privateKey
const userPrivKey = accounts[1].privateKey
const maxUsers = 2 ** 4 - 1
const maxMessages = 2 ** 4 - 1
const maxVoteOptions = 15
const signupDuration = 15
const votingDuration = 15
const messageBatchSize = 4
const tallyBatchSize = 4
const initialVoiceCredits = 1000

const stateTreeDepth = calcTreeDepthFromMaxLeaves(maxUsers)
const messageTreeDepth = calcTreeDepthFromMaxLeaves(maxMessages)
const voteOptionTreeDepth = calcTreeDepthFromMaxLeaves(maxVoteOptions)

maciState = new MaciState(
    coordinatorKeypair,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    maxVoteOptions,
)


describe('process, tally, and prove CLI subcommands', () => {
    let maciContract
    let provider
    let randomLeaf: StateLeaf

    beforeAll(async () => {
        provider = new ethers.providers.JsonRpcProvider(providerUrl)
        // Fund the user's account
        const deployerWallet = new ethers.Wallet(accounts[0].privateKey, provider)
        const tx = await deployerWallet.provider.sendTransaction(
            accounts[0].sign({
                nonce: await deployerWallet.provider.getTransactionCount(accounts[0].address),
                gasPrice: ethers.utils.parseUnits('10', 'gwei'),
                gasLimit: 21000,
                to: accounts[1].address,
                value: ethers.utils.parseUnits('0.1', 'ether'),
                data: '0x'
            })
        )
        await tx.wait()

        // Run the create subcommand
        const createCommand = `node ../cli/build/index.js create` +
            ` -d ${deployerPrivKey} -sk ${maciPrivkey}` +
            ` -u ${maxUsers}` +
            ` -m ${maxMessages}` +
            ` -v ${maxVoteOptions}` +
            ` -e ${providerUrl}` +
            ` -s ${signupDuration}` +
            ` -o ${votingDuration}` +
            ` -bm ${messageBatchSize}` +
            ` -bv ${tallyBatchSize}` +
            ` -c ${initialVoiceCredits}`

        const createOutput = exec(createCommand).stdout.trim()

        // Log the output for further manual testing
        console.log(createOutput)

        const regMatch = createOutput.match(/^MACI: (0x[a-fA-F0-9]{40})$/)
        maciAddress = regMatch[1]

        // Run the signup command
        const signupCommand = `node ../cli/build/index.js signup` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -d ${userPrivKey}` +
            ` -x ${maciAddress}`

        console.log(signupCommand)

        const signupExec = exec(signupCommand)
        if (signupExec.stderr) {
            console.error(signupExec.stderr)
            return
        } else {
            console.log(signupExec.stdout)
        }

        maciState.signUp(
            userKeypair.pubKey, 
            bigInt(initialVoiceCredits),
        )

        maciContract = new ethers.Contract(
            maciAddress,
            maciContractAbi,
            provider,
        )

        // Wait for the signup period to pass
        await delay(1000 * signupDuration)

        const stateIndex = 1
        const voteOptionIndex = 0
        const newVoteWeight = 9
        const nonce = 1
        const salt = '0x0333333333333333333333333333333333333333333333333333333333333333'

        // Retrieve the coordinator's public key
        const coordinatorPubKeyOnChain = await maciContract.coordinatorPubKey()
        const coordinatorPubKey = new PubKey([
            bigInt(coordinatorPubKeyOnChain.x.toString()),
            bigInt(coordinatorPubKeyOnChain.y.toString()),
        ])

        // Run the publish command
        const publishCommand = `node ../cli/build/index.js publish` +
            ` -sk ${userKeypair.privKey.serialize()}` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -d ${userPrivKey}` +
            ` -x ${maciAddress}` +
            ` -i ${stateIndex}` +
            ` -v ${voteOptionIndex}` +
            ` -w ${newVoteWeight}` +
            ` -n ${nonce}` +
            ` -s ${salt}`

        console.log(publishCommand)

        const publishExec = exec(publishCommand)
        if (publishExec.stderr) {
            console.log(publishExec.stderr)
            return
        }

        const publishOutput = publishExec.stdout.trim()
        console.log(publishOutput)

        const publishRegMatch = publishOutput.match(
            /^Transaction hash: (0x[a-fA-F0-9]{64})\nEphemeral private key: (macisk.[a-f0-9]+)$/)

        // The publish command generates and outputs a random ephemeral private
        // key, so we have to retrieve it from the standard output
        const encPrivKey = PrivKey.unserialize(publishRegMatch[2])
        const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))

        const command = new Command(
            bigInt(stateIndex),
            userKeypair.pubKey,
            bigInt(voteOptionIndex),
            bigInt(newVoteWeight),
            bigInt(nonce),
            bigInt(salt),
        )

        const signature = command.sign(userKeypair.privKey)

        const message = command.encrypt(
            signature,
            Keypair.genEcdhSharedKey(
                encPrivKey,
                coordinatorPubKey,
            )
        )

        // Check whether the message tree root is correct
        maciState.publishMessage(
            message,
            encPubKey,
        )

        // Wait for the voting period to pass
        await delay(1000 * votingDuration)
    })

    describe('The tally subcommand (1)', () => {
        it('should report an error if some messages have not been processed', async () =>{

            const hasUnprocessedMessages = await maciContract.hasUnprocessedMessages()
            expect(hasUnprocessedMessages).toBeTruthy()

            const tallyCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js tally` + ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}` +
                ` -z ${StateLeaf.genRandomLeaf().serialize()}`

            const e = exec(tallyCommand)
            expect(e.stderr.trim()).toEqual('Error: not all messages have been processed')
            debugger
        })
    })

    describe('The process subcommand', () => {

        it('should process a batch of state leaves', async () =>{
            const messageIndexBefore = await maciContract.currentMessageBatchIndex()
            // Run the processBatch command
            const processBatchCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js process` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}`

            console.log('Start:', new Date())
            console.log(processBatchCommand)

            const e = exec(processBatchCommand)

            console.log('End:', new Date())

            if (e.stderr) {
                console.log(e)
            }
            const output = e.stdout.trim()
            console.log(output)

            // Check whether the transaction succeeded
            const regMatch = output.match(
                /^Transaction hash: (0x[a-fA-F0-9]{64})\nRandom state leaf: ([\w\d]+)/
            )
            if (!regMatch) {
                console.log(e.stderr)
            }
            expect(regMatch).toBeTruthy()

            const messageIndexAfter = await maciContract.currentMessageBatchIndex()
            expect((messageIndexAfter - messageIndexBefore).toString()).toEqual(messageBatchSize.toString())

            randomLeaf = StateLeaf.unserialize(regMatch[2])
        })

        it('should report an error if all messages have been processed', async () =>{

            const hasUnprocessedMessages = await maciContract.hasUnprocessedMessages()
            expect(hasUnprocessedMessages).toBeFalsy()

            const processBatchCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js process` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}`

            const e = exec(processBatchCommand)
            expect(e.stderr.trim()).toEqual('Error: all messages have already been processed')
        })

        it('should reject an invalid MACI contract address', async () =>{
            const processBatchCommand = `node ../cli/build/index.js process` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0xxx`

            const output = exec(processBatchCommand).stderr
            expect(output).toEqual('Error: invalid MACI contract address\n')
        })

        it('should reject a contract address that does not have MACI deployed to it', async () => {
            const processBatchCommand = `node ../cli/build/index.js process` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0xxx`

            const output = exec(processBatchCommand).stderr
            expect(output).toEqual('Error: invalid MACI contract address\n')
        })

        it('should reject an invalid Ethereum private key', async () => {
            const processBatchCommand = `node ../cli/build/index.js process` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0x0000000000000000000000000000000000000000`
            const output = exec(processBatchCommand).stderr
            expect(output).toEqual('Error: there is no contract deployed at the specified address\n')
        })
    })

    describe('The tally subcommand (2)', () => {

        it('should tally all state leaves', async () =>{
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}` +
                ` -z ${randomLeaf.serialize()}`

            console.log(tallyCommand)

            const output = exec(tallyCommand).stdout

            console.log(output)

            const regMatch = output.match(
                /^Transaction hash: (0x[a-fA-F0-9]{64})\n$/
            )

            expect(regMatch).toBeTruthy()
        })

        it('should report an error if all state leaves have been tallied', async () =>{
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${coordinatorKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}` +
                ` -z ${randomLeaf.serialize()}`

            console.log(tallyCommand)

            const output = exec(tallyCommand).stderr
            expect(output).toEqual('Error: all state leaves have been tallied\n')
        })

        it('should report an error if the random leaf is invalid', async () =>{
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${userKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x ${maciAddress}` +
                ` -z xxxxxxx`
            const output = exec(tallyCommand).stderr
            expect(output).toEqual('Error: invalid zeroth state leaf\n')
        })

        it('should reject an invalid MACI contract address', async () =>{
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${userKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0xxx` +
                ` -z ${randomLeaf.serialize()}`

            const output = exec(tallyCommand).stderr
            expect(output).toEqual('Error: invalid MACI contract address\n')
        })

        it('should reject a contract address that does not have MACI deployed to it', async () => {
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${userKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0xxx` +
                ` -z ${randomLeaf.serialize()}`

            const output = exec(tallyCommand).stderr
            expect(output).toEqual('Error: invalid MACI contract address\n')
        })

        it('should reject an invalid Ethereum private key', async () => {
            const tallyCommand = `node ../cli/build/index.js tally` +
                ` -sk ${userKeypair.privKey.serialize()}` +
                ` -d ${userPrivKey}` +
                ` -x 0x0000000000000000000000000000000000000000` +
                ` -z ${randomLeaf.serialize()}`
            const output = exec(tallyCommand).stderr
            expect(output).toEqual('Error: there is no contract deployed at the specified address\n')
        })
    })
})
