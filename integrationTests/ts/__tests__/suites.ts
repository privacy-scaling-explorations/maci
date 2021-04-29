const { ethers } = require('hardhat')
import {
    PubKey,
    PrivKey,
    VerifyingKey,
    Keypair,
    Command,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genPerVOSpentVoiceCreditsCommitment,
    genSpentVoiceCreditsCommitment,
    genTallyResultCommitment,
    genProcessVkSig,
    genTallyVkSig,
    MaciState,
    TreeDepths,
    MaxValues,
    Poll
} from 'maci-core'

import {
    genRandomSalt,
} from 'maci-crypto'

import {
    parseArtifact,
    getDefaultSigner,
    deployTestContracts,
    deployFreeForAllSignUpGatekeeper,
    deployConstantInitialVoiceCreditProxy,
} from 'maci-contracts'

import { genPubKey } from 'maci-crypto'

import { exec, delay, loadYaml } from './utils'

const loadData = (name: string) => {
    return require('@maci-integrationTests/ts/__tests__/suites/' + name)
}

const executeSuite = async (data: any, expect: any) => {
    console.log(data)
    const config = loadYaml()
    const signer = await getDefaultSigner()
    const coordinatorKeypair = new Keypair()
    const maciPrivkey = coordinatorKeypair.privKey.serialize()
    const providerUrl = config.constants.chain.url
    const provider = new ethers.providers.JsonRpcProvider(providerUrl)
    const deployerWallet = new ethers.Wallet.fromMnemonic(config.constants.chain.testMnemonic)
    const userPrivKey = deployerWallet.privateKey
    const deployerPrivKey = deployerWallet.privateKey

    const gatekeeper = await deployFreeForAllSignUpGatekeeper()

    const maciState = new MaciState(
        coordinatorKeypair,
        config.constants.maci.stateTreeDepth,
        config.constants.maci.messageTreeDepth,
        config.constants.maci.voteOptionTreeDepth,
        config.constants.maci.maxVoteOptions,
    )

    const deployVkRegistryCommand = `node build/index.js deployVkRegistry`
    const vkDeployOutput = exec(deployVkRegistryCommand).stdout.trim()
    const vkAddressMatch = vkDeployOutput.match(/(0x[a-fA-F0-9]{40})/)
    const vkAddress = vkAddressMatch[1]
    console.log(vkAddress)

    const setVerifyingKeysCommand = `node build/index.js setVerifyingKeys` +
        ` -s ${config.constants.maci.stateTreeDepth}` +
        ` -i ${config.constants.poll.intStateTreeDepth}` +
        ` -m ${config.constants.maci.messageTreeDepth}` +
        ` -v ${config.constants.maci.voteOptionTreeDepth}` +
        ` -b ${config.constants.poll.messageBatchDepth}` +
        ` -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey` +
        ` -t ./zkeys/TallyVotes_10-1-2.test.0.zkey` +
        ` -k ${vkAddress}`

    console.log(setVerifyingKeysCommand)
    const setVerifyingKeysOutput = exec(setVerifyingKeysCommand).stdout.trim()

    // Run the create subcommand
    const createCommand = `node build/index.js create` +
        ` -r ${vkAddress}`

    console.log(createCommand)

    const createOutput = exec(createCommand).stdout.trim()

    // Log the output for further manual testing
    console.log(createOutput)


    const regMatch = createOutput.match(/(0x[a-fA-F0-9]{40})/)
    const maciAddress = regMatch[1]

    const deployPoll = `node build/index.js deployPoll` +
        ` -x ${maciAddress}` +
        ` -pk ${coordinatorKeypair.pubKey.serialize()}` +
        ` -t ${config.constants.poll.duration}` +
        ` -g ${config.constants.maci.maxMessages}` +
        ` -mv ${config.constants.maci.maxVoteOptions}` +
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

    let treeDepths = {} as TreeDepths
    treeDepths.intStateTreeDepth = config.constants.poll.intStateTreeDepth
    treeDepths.messageTreeDepth = config.constants.poll.messageTreeDepth
    treeDepths.messageTreeSubDepth = config.constants.poll.messageBatchDepth
    treeDepths.voteOptionTreeDepth = config.constants.maci.voteOptionTreeDepth

    const maxValues = {} as MaxValues
    maxValues.maxUsers = config.constants.maci.maxUsers
    maxValues.maxMessages = config.constants.maci.maxMessages
    maxValues.maxVoteOptions  = config.constants.maci.maxVoteOptions
    const [ vkRegisteryAbi ] = parseArtifact('VkRegistry')
    const vkRegistryContract = new ethers.Contract(
        vkAddress,
        vkRegisteryAbi,
        signer,
    )
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

    const maciContractAbi = parseArtifact('MACI')[0]
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    console.log(`Signing up ${data.numUsers} users`)
    // Sign up
    for (let i = 0; i < data.numUsers; i++) {
        const userKeypair = new Keypair()
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
        const publishCommand = `node build/index.js publish` +
            ` -sk ${userKeypair.privKey.serialize()}` +
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

    const removeOldProofs = `rm -f tally.json proofs.json`
    e = exec(removeOldProofs)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const genProofsCommand = `node build/index.js genProofs` +
        ` -x ${maciAddress}` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -o ${pollId}` +
        ` -r ~/rapidsnark/build/prover` +
        ` -wp ./zkeys/ProcessMessages_10-2-1-2.test` +
        ` -wt ./zkeys/TallyVotes_10-1-2.test` +
        ` -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey` +
        ` -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey` +
        ` -t tally.json` +
        ` -f proofs.json`

    e = exec(genProofsCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    const proveOnChainCommand = `node build/index.js proveOnChain` +
        ` -x ${maciAddress}` +
        ` -o ${pollId}` +
        ` -q ${pptAddress}` +
        ` -f proofs.json`

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

    e = exec(verifyCommand)

    if (e.stderr) {
        console.log(e.stderr)
        return false
    }
    console.log(e.stdout)

    // Process messages
    /*
    const processCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js process` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -d ${userPrivKey}` +
        ` -x ${maciAddress}` +
        ` --repeat`

    console.log(processCommand)

    const e = exec(processCommand)

    if (e.stderr) {
        console.log(e.stderr)
    }
    console.log(e.stdout)

    const output = e.stdout.trim()

    // Check whether the transaction succeeded
    const processRegMatch = output.match(
        /Processed batch starting at index ([0-9]+)\nTransaction hash: (0x[a-fA-F0-9]{64})\nRandom state leaf: (.+)$/
    )

    expect(processRegMatch).toBeTruthy()

    // Check whether it has processed all batches
    const processedIndexNum = parseInt(processRegMatch[1], 10)
    expect(processedIndexNum.toString()).toEqual('0')

    const currentMessageBatchIndex = await maciContract.currentMessageBatchIndex()
    expect(currentMessageBatchIndex.toString()).toEqual('0')

    const randomLeaf = StateLeaf.unserialize(processRegMatch[3])
    */
    /*
    const tallyCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js tally` +
        ` -sk ${coordinatorKeypair.privKey.serialize()}` +
        ` -d ${userPrivKey}` +
        ` -x ${maciAddress}` +
        ` -z ${randomLeaf.serialize()}` +
        ` -t test_tally.json` +
        ` -c 0x0000000000000000000000000000000000000000000000000000000000000000` +
        ` -tvc ${config.constants.maci.ivcpData}` +
        ` -pvc 0x0000000000000000000000000000000000000000000000000000000000000000` +
        ` -r`

    console.log(tallyCommand)

    const tallyOutput = exec(tallyCommand)

    if (tallyOutput.stderr) {
        console.log(tallyOutput.stderr)
    }

    console.log(tallyOutput.stdout)

    const tallyRegMatch = tallyOutput.match(
        /Transaction hash: (0x[a-fA-F0-9]{64})\nCurrent results salt: (0x[a-fA-F0-9]+)\nResult commitment: 0x[a-fA-F0-9]+\nTotal spent voice credits salt: (0x[a-fA-F0-9]+)\nTotal spent voice credits commitment: 0x[a-fA-F0-9]+\nTotal spent voice credits per vote option salt: (0x[a-fA-F0-9]+)\nTotal spent voice credits per vote option commitment: (0x[a-fA-F0-9]+)\nTotal votes: (.+)\n$/
    )

    if (!tallyRegMatch) {
        console.log('Mismatch:')
        console.log(tallyOutput)
    }

    expect(tallyRegMatch).toBeTruthy()

    const resultsSalt = BigInt(tallyRegMatch[2])

    const finalTallyCommitment = await maciContract.currentResultsCommitment()
    const expectedTallyCommitment = genTallyResultCommitment(
        data.expectedTally,
        resultsSalt,
        config.constants.maci.voteOptionTreeDepth,
    )

    expect(finalTallyCommitment.toString())
        .toEqual(expectedTallyCommitment.toString())

    const tvcSalt = BigInt(tallyRegMatch[3])
    const finalTvcCommitment = 
        await maciContract.currentSpentVoiceCreditsCommitment()

    const expectedTvcCommitment = genSpentVoiceCreditsCommitment(
        data.expectedTotalSpentVoiceCredits,
        tvcSalt,
    )
    expect(expectedTvcCommitment.toString())
        .toEqual(finalTvcCommitment.toString())


    const pvcSalt = BigInt(tallyRegMatch[4])
    const finalPvcCommitment =
        await maciContract.currentPerVOSpentVoiceCreditsCommitment()
    const expectedPvcCommitment = genPerVOSpentVoiceCreditsCommitment(
        data.expectedSpentVoiceCredits,
        pvcSalt,
        config.constants.maci.voteOptionTreeDepth,
    )
    expect(expectedPvcCommitment.toString())
        .toEqual(finalPvcCommitment.toString())

    const totalVotes = BigInt(tallyRegMatch[6])
    const expectedTotalVotes = await maciContract.totalVotes()
    expect(totalVotes.toString()).toEqual(expectedTotalVotes.toString())

    const verifyCommand = `NODE_OPTIONS=--max-old-space-size=4096 node ../cli/build/index.js verify ` +
        '-t test_tally.json'

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
    */

    return true
}

export {
    loadData,
    executeSuite,
}
