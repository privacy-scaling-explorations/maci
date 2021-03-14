import * as ethers from 'ethers'
import * as fs from 'fs'
import * as path from 'path'
import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
    StateLeaf,
} from 'maci-domainobjs'

import { 
    genPerVOSpentVoiceCreditsCommitment,
    genSpentVoiceCreditsCommitment,
    genTallyResultCommitment,
    MaciState,
} from 'maci-core'

import {
    genRandomSalt,
} from 'maci-crypto'

import {
    maciContractAbi,
    genTestAccounts,
} from 'maci-contracts'

import { genPubKey } from 'maci-crypto'

import { config } from 'maci-config'

import { exec, delay } from './utils'

import {
    maxUsers,
    maxMessages,
    maxVoteOptions,
    messageBatchSize,
    tallyBatchSize,
    initialVoiceCredits,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
} from './params'

const loadData = (name: string) => {
    return require('@maci-integrationTests/ts/__tests__/suites/' + name)
}

const executeSuite = async (data: any, expect: any) => {
    console.log(data)
    const accounts = genTestAccounts(2)
    const userPrivKey = accounts[1].privateKey
    const coordinatorKeypair = new Keypair()
    const maciPrivkey = coordinatorKeypair.privKey.serialize()
    const deployerPrivKey = accounts[0].privateKey
    const providerUrl = config.get('chain.url')
    const provider = new ethers.providers.JsonRpcProvider(providerUrl)

    const deployerWallet = new ethers.Wallet(accounts[0].privateKey, provider)
    const tx = await deployerWallet.provider.sendTransaction(
        accounts[0].sign({
            nonce: await deployerWallet.provider.getTransactionCount(accounts[0].address),
            gasPrice: ethers.utils.parseUnits('10', 'gwei'),
            gasLimit: 21000,
            to: accounts[1].address,
            value: ethers.utils.parseUnits('1', 'ether'),
            data: '0x'
        })
    )
    await tx.wait()

    const maciState = new MaciState(
        coordinatorKeypair,
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        maxVoteOptions,
    )

    const signupDuration = data.numUsers * 7
    const votingDuration = data.numUsers * 7

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

    console.log(createCommand)

    const createOutput = exec(createCommand).stdout.trim()

    // Log the output for further manual testing
    console.log(createOutput)

    const regMatch = createOutput.match(/MACI: (0x[a-fA-F0-9]{40})$/)
    const maciAddress = regMatch[1]
    
    const userKeypairs: Keypair[] = []

    console.log(`Signing up ${data.numUsers} users`)
    // Sign up
    for (let i = 0; i < data.numUsers; i++) {
        const userKeypair = new Keypair()
        userKeypairs.push(userKeypair)
        // Run the signup command
        const signupCommand = `node ../cli/build/index.js signup` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -d ${userPrivKey}` +
            ` -x ${maciAddress}`

        //console.log(signupCommand)

        const signupExec = exec(signupCommand)
        if (signupExec.stderr) {
            console.error(signupExec.stderr)
            return false
        }

        maciState.signUp(
            userKeypair.pubKey, 
            BigInt(initialVoiceCredits),
        )
    }

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    expect(maciState.genStateRoot().toString()).toEqual((await maciContract.getStateTreeRoot()).toString())

    await maciContract.signUpTimestamp()

    await delay(1000 * signupDuration)

    // Publish messages
    console.log(`Publishing messages`)

    for (let i = 0; i < data.commands.length; i++) {
        if (data.commands[i].user >= userKeypairs.length) {
            continue
        }

        const userKeypair = userKeypairs[data.commands[i].user]
        const stateIndex = data.commands[i].user + 1
        const voteOptionIndex = data.commands[i].voteOptionIndex
        const newVoteWeight  = data.commands[i].voteWeight
        const nonce = data.commands[i].nonce
        const salt = '0x' + genRandomSalt().toString(16)
 
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

        //console.log(publishCommand)

        const publishExec = exec(publishCommand)
        if (publishExec.stderr) {
            console.log(publishExec.stderr)
            return false
        }

        const publishOutput = publishExec.stdout.trim()
        //console.log(publishOutput)

        const publishRegMatch = publishOutput.match(
            /Transaction hash: (0x[a-fA-F0-9]{64})\nEphemeral private key: (macisk.[a-f0-9]+)$/)

        // The publish command generates and outputs a random ephemeral private
        // key, so we have to retrieve it from the standard output
        const encPrivKey = PrivKey.unserialize(publishRegMatch[2])
        const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))

        const command = new Command(
            BigInt(stateIndex),
            userKeypair.pubKey,
            BigInt(voteOptionIndex),
            BigInt(newVoteWeight),
            BigInt(nonce),
            BigInt(salt),
        )

        const signature = command.sign(userKeypair.privKey)

        const message = command.encrypt(
            signature,
            Keypair.genEcdhSharedKey(
                encPrivKey,
                coordinatorKeypair.pubKey,
            )
        )

        maciState.publishMessage(
            message,
            encPubKey,
        )
    }

    // Check whether the message tree root is correct
    expect(maciState.genMessageRoot().toString()).toEqual((await maciContract.getMessageTreeRoot()).toString())

    await delay(1000 * votingDuration)

    const tallyFile = path.join(process.cwd(), 'tally.json')
    const proofsFile = path.join(process.cwd(), 'proofs.json')

    // Generate proofs
    const genProofsCmd = `node ../cli/build/index.js genProofs` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -t ${tallyFile}` +
        ` -o ${proofsFile}` +
        ` -x ${maciAddress}`

    console.log(genProofsCmd)

    const e = exec(genProofsCmd)

    if (e.stderr) {
        console.log(e.stderr)
    }

    const output = e.stdout.trim()

    if (!output.endsWith('OK')) {
        console.log(output)
    }

    // Check whether the command succeeded
    expect(output.endsWith('OK')).toBeTruthy()

    const proveOnChainCmd = `node ../cli/build/index.js proveOnChain` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -d ${deployerPrivKey}` +
        ` -o ${proofsFile}` +
        ` -x ${maciAddress}`
    console.log(proveOnChainCmd)

    const proveOnChainOutput = exec(proveOnChainCmd)
    const tally = JSON.parse(fs.readFileSync(tallyFile).toString())

    if (proveOnChainOutput.stderr) {
        console.log(proveOnChainOutput.stderr)
    }

    expect(proveOnChainOutput.stdout.trim().endsWith('OK')).toBeTruthy()

    const verifyCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js verify ` +
        '-t ' + tallyFile

    console.log(verifyCommand)

    const verifyOutput = exec(verifyCommand)

    if (verifyOutput.stderr) {
        console.log(verifyOutput.stderr)
    }

    const verifyRegMatch = verifyOutput.match(
        /The results commitment in the specified file is correct given the tally and salt\nThe total spent voice credit commitment in the specified file is correct given the tally and salt\nThe per vote option spent voice credit commitment in the specified file is correct given the tally and salt\nThe results commitment in the MACI contract on-chain is valid\nThe total spent voice credit commitment in the MACI contract on-chain is valid\nThe per vote option spent voice credit commitment in the MACI contract on-chain is valid\nThe total sum of votes in the MACI contract on-chain is valid.\n/
    )
    if (!verifyRegMatch) {
        console.log(verifyOutput)
    }
    expect(verifyRegMatch).toBeTruthy()

    const tallyWithoutProofsFile = 'tally_without_proofs.json'
    const ptwpCommand = `node ../cli/build/index.js processAndTallyWithoutProofs ` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -d ${userPrivKey}` +
        ` -x ${maciAddress}` +
        ` -t ${tallyWithoutProofsFile}`

    exec(ptwpCommand)

    const tallyWithoutProofs = JSON.parse(fs.readFileSync(tallyWithoutProofsFile).toString())

    expect(tally.totalVoiceCredits.spent).toEqual(tally.totalVoiceCredits.spent)

    expect(JSON.stringify(tally.results.tally))
        .toEqual(JSON.stringify(tallyWithoutProofs.results.tally))

    expect(JSON.stringify(tally.totalVoiceCreditsPerVoteOption.tally))
        .toEqual(JSON.stringify(tallyWithoutProofs.totalVoiceCreditsPerVoteOption.tally))

    return true
}

export {
    loadData,
    executeSuite,
}
