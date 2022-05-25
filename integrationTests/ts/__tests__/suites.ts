import * as path from 'path'
import * as fs from 'fs'
import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

import {
    MaciState,
    TreeDepths,
    MaxValues,
} from 'maci-core'

import {
    genRandomSalt,
} from 'maci-crypto'

import { genPubKey } from 'maci-crypto'

import { exec, loadYaml, genTestUserCommands, expectTally } from './utils'

const loadData = (name: string) => {
    return require('@maci-integrationTests/ts/__tests__/' + name)
}

const executeSuite = async (data: any, expect: any) => {
    const config = loadYaml()
    const coordinatorKeypair = new Keypair()

    const maciState = new MaciState(
        coordinatorKeypair,
        config.constants.maci.stateTreeDepth,
        config.constants.maci.messageTreeDepth,
        config.constants.maci.voteOptionTreeDepth,
        config.constants.maci.maxVoteOptions,
    )

    const deployVkRegistryCommand = `node build/index.js deployVkRegistry`
    const vkDeployOutput = exec(deployVkRegistryCommand)
    const vkAddressMatch = vkDeployOutput.stdout.trim().match(/(0x[a-fA-F0-9]{40})/)
    if (!vkAddressMatch) {
        console.log(vkDeployOutput)
        return false
    }
    const vkAddress = vkAddressMatch[1]
    console.log(vkAddress)

    const setVerifyingKeysCommand = `node build/index.js setVerifyingKeys` +
        ` -s ${config.constants.maci.stateTreeDepth}` +
        ` -i ${config.constants.poll.intStateTreeDepth}` +
        ` -m ${config.constants.maci.messageTreeDepth}` +
        ` -v ${config.constants.maci.voteOptionTreeDepth}` +
        ` -b ${config.constants.poll.messageBatchDepth}` +
        ` -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey` +
        ` -t ./zkeys/TallyVotes_10-1-2_test.0.zkey` +
        ` -k ${vkAddress}`

    console.log(setVerifyingKeysCommand)

    const setVerifyingKeysOutput = exec(setVerifyingKeysCommand).stdout.trim()
    console.log(setVerifyingKeysOutput)

    // Run the create subcommand
    const createCommand = `node build/index.js create` +
        ` -r ${vkAddress}`

    console.log(createCommand)

    const createOutput = exec(createCommand).stdout.trim()
    console.log(createOutput)

    const regMatch = createOutput.match(/(0x[a-fA-F0-9]{40})/)
    const maciAddress = regMatch[1]

    const deployPoll = `node build/index.js deployPoll` +
        ` -x ${maciAddress}` +
        ` -pk ${coordinatorKeypair.pubKey.serialize()}` +
        ` -t ${config.constants.poll.duration}` +
        ` -g ${config.constants.maci.maxMessages}` +
        ` -i ${config.constants.poll.intStateTreeDepth}` +
        ` -m ${config.constants.poll.messageTreeDepth}` +
        ` -b ${config.constants.poll.messageBatchDepth}` +
        ` -v ${config.constants.maci.voteOptionTreeDepth}`

    console.log(deployPoll)
    const deployPollOutput = exec(deployPoll).stdout.trim()
    console.log(deployPollOutput)

    const deployPollRegMatch = deployPollOutput.match(/PollProcessorAndTallyer contract: (0x[a-fA-F0-9]{40})/)
    const pptAddress = deployPollRegMatch[1]
    const deployPollIdRegMatch = deployPollOutput.match(/Poll ID: ([0-9])/)
    const pollId = deployPollIdRegMatch[1]

    const treeDepths = {} as TreeDepths
    treeDepths.intStateTreeDepth = config.constants.poll.intStateTreeDepth
    treeDepths.messageTreeDepth = config.constants.poll.messageTreeDepth
    treeDepths.messageTreeSubDepth = config.constants.poll.messageBatchDepth
    treeDepths.voteOptionTreeDepth = config.constants.maci.voteOptionTreeDepth

    const maxValues = {} as MaxValues
    maxValues.maxUsers = config.constants.maci.maxUsers
    maxValues.maxMessages = config.constants.maci.maxMessages
    maxValues.maxVoteOptions  = 5 ** config.constants.maci.voteOptionTreeDepth
    const messageBatchSize = 5 ** config.constants.poll.messageBatchDepth
    maciState.deployPoll(
        config.constants.poll.duration,
        (Date.now() + (config.constants.poll.duration * 60000)),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair
    )

    const userKeypairs: Keypair[] = []

    console.log(`Signing up ${data.numUsers} users`)

    const users = genTestUserCommands(
        data.numUsers,
        config.defaultVote.voiceCreditBalance,
        data.numVotesPerUser,
        data.bribers
    )

    // Sign up
    for (let i = 0; i < users.length; i++) {
        const userKeypair = users[i].keypair
        userKeypairs.push(userKeypair)
        // Run the signup command
        const signupCommand = `node ../cli/build/index.js signup` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -x ${maciAddress}`

        console.log(signupCommand)

        const signupExec = exec(signupCommand)
        if (signupExec.stderr) {
            console.error(signupExec.stderr)
            return false
        }

        maciState.signUp(
            userKeypair.pubKey,
            BigInt(config.constants.maci.initialVoiceCredits),
            Date.now()
        )
    }

    // Publish messages
    console.log(`Publishing messages`)

    for (let i = 0; i < users.length; i++) {
        if (i >= userKeypairs.length) {
            continue
        }

        for (let j = 0; j < users[i].votes.length; j++ ) {
            // find which vote index the user should change keys
            const isKeyChange = (data.changeUsersKeys && j in data.changeUsersKeys[i])
            const stateIndex = i + 1
            const voteOptionIndex = isKeyChange ?
                data.changeUsersKeys[i][j].voteOptionIndex : users[i].votes[j].voteOptionIndex
            const newVoteWeight  = isKeyChange ?
                data.changeUsersKeys[i][j].voteWeight : users[i].votes[j].voteWeight
            const nonce = users[i].votes[j].nonce
            const salt = '0x' + genRandomSalt().toString(16)
            const userPrivKey = isKeyChange ?
                users[i].changeKeypair() : userKeypairs[i].privKey
            const userKeypair = userKeypairs[i]
            // Run the publish command
            const publishCommand = `node build/index.js publish` +
                ` -sk ${userPrivKey.serialize()}` +
                ` -p ${userKeypair.pubKey.serialize()}` +
                ` -x ${maciAddress}` +
                ` -i ${stateIndex}` +
                ` -v ${voteOptionIndex}` +
                ` -w ${newVoteWeight}` +
                ` -n ${nonce}` +
                ` -o ${pollId}`

            console.log(publishCommand)

            const publishExec = exec(publishCommand)
            if (publishExec.stderr) {
                console.log(publishExec.stderr)
                return false
            }

            const publishOutput = publishExec.stdout.trim()
            console.log(publishOutput)

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
                BigInt(pollId),
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
            maciState.polls[pollId].publishMessage(
                message,
                encPubKey,
            )
        }
    }

    const timeTravelCommand = `node build/index.js timeTravel -s ${config.constants.maci.votingDuration}`
    let e = exec(timeTravelCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const mergeMessagesCommand = `node build/index.js mergeMessages -x ${maciAddress} -o ${pollId}`
    e = exec(mergeMessagesCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const mergeSignupsCommand = `node build/index.js mergeSignups -x ${maciAddress} -o ${pollId}`
    e = exec(mergeSignupsCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const removeOldProofs = `rm -rf tally.json proofs`
    e = exec(removeOldProofs)

    const genProofsCommand = `node build/index.js genProofs` +
        ` -x ${maciAddress}` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -o ${pollId}` +
        ` -r ~/rapidsnark/build/prover` +
        ` -wp ./zkeys/ProcessMessages_10-2-1-2_test` +
        ` -wt ./zkeys/TallyVotes_10-1-2_test` +
        ` -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey` +
        ` -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey` +
        ` -t tally.json` +
        ` -f proofs/`

    console.log(genProofsCommand)
    e = exec(genProofsCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const tally = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../cli/tally.json')).toString())
    // Validate generated proof file
    expect(JSON.stringify(tally.pollId)).toEqual(pollId)
    expectTally(
        config.constants.maci.maxMessages,
        data.expectedTally,
        data.expectedSpentVoiceCredits,
        data.expectedTotalSpentVoiceCredits,
        tally
    )

    const proveOnChainCommand = `node build/index.js proveOnChain` +
        ` -x ${maciAddress}` +
        ` -o ${pollId}` +
        ` -q ${pptAddress}` +
        ` -f proofs/`

    console.log(proveOnChainCommand)
    e = exec(proveOnChainCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const verifyCommand = `node build/index.js verify` +
        ` -x ${maciAddress}` +
        ` -o ${pollId}` +
        ` -q ${pptAddress}` +
        ` -t tally.json`

    console.log(verifyCommand)
    e = exec(verifyCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    return true
}

export {
    loadData,
    executeSuite,
}
