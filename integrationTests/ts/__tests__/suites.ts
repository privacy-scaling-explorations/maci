import * as path from 'path'
import * as fs from 'fs'
import {
    PubKey,
    PrivKey,
    Keypair,
    PCommand,
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

import { exec, loadYaml, genTestUserCommands, expectTally, expectSubsidy } from './utils'

const execute = (command: any) => {
    console.log(command)

    const childProcess = exec(command)
    console.log(`stdout: ${childProcess.stdout}`)
    if (childProcess.stderr) {
        throw new Error(`exec failed: ${childProcess.stderr}`)
    }
    return childProcess
}

const loadData = (name: string) => {
    return require('@maci-integrationTests/ts/__tests__/' + name)
}

const executeSuite = async (data: any, expect: any) => {
    try {
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

        let subsidyZkeyFilePath
        let subsidyWitnessCalculatorPath
        let subsidyResultFilePath
        const subsidyEnabled = data.subsidy && data.subsidy.enabled
        subsidyEnabled ? subsidyZkeyFilePath = " --subsidy-zkey ./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey" : subsidyZkeyFilePath = ''
        subsidyEnabled ? subsidyWitnessCalculatorPath = " --subsidy-witnessgen ./zkeys/SubsidyPerBatch_10-1-2_test" : subsidyWitnessCalculatorPath = ''
        subsidyEnabled ? subsidyResultFilePath = " --subsidy-file subsidy.json" : subsidyResultFilePath = ''
        let genProofSubsidyArgument = subsidyResultFilePath + subsidyWitnessCalculatorPath + subsidyZkeyFilePath
        

        const setVerifyingKeysCommand = `node build/index.js setVerifyingKeys` +
            ` -s ${config.constants.maci.stateTreeDepth}` +
            ` -i ${config.constants.poll.intStateTreeDepth}` +
            ` -m ${config.constants.maci.messageTreeDepth}` +
            ` -v ${config.constants.maci.voteOptionTreeDepth}` +
            ` -b ${config.constants.poll.messageBatchDepth}` +
            ` -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey` +
            ` -zpd ./zkeys/ProcessDeactivationMessages_5-10_test.0.zkey` +
            ` -t ./zkeys/TallyVotes_10-1-2_test.0.zkey` +
            ` -znkg ./zkeys/GenerateKeyFromDeactivated_10_test.0.zkey` +
            ` -k ${vkAddress}` +
            ` ${subsidyZkeyFilePath}`

        execute(setVerifyingKeysCommand)

        // Run the create subcommand
        // TODO: Make signup-deadline dynamic now + 30 days for example
        const createCommand = `node build/index.js create` +
            ` -r ${vkAddress}` +
            ` --signup-deadline 1692424915`+
            ` --deactivation-period 86400`
        const createOutput = execute(createCommand).stdout.trim()
        const regMatch = createOutput.match(/MACI: (0x[a-fA-F0-9]{40})/)
        const maciAddress = regMatch[1]

        const deployPollCommand = `node build/index.js deployPoll` +
            ` -x ${maciAddress}` +
            ` -pk ${coordinatorKeypair.pubKey.serialize()}` +
            ` -t ${config.constants.poll.duration}` +
            ` -g ${config.constants.maci.maxMessages}` +
            ` -mv ${config.constants.maci.maxVoteOptions}` +
            ` -i ${config.constants.poll.intStateTreeDepth}` +
            ` -m ${config.constants.poll.messageTreeDepth}` +
            ` -b ${config.constants.poll.messageBatchDepth}` +
            ` -v ${config.constants.maci.voteOptionTreeDepth}`

        const deployPollOutput = execute(deployPollCommand).stdout.trim()
        const deployPollIdRegMatch = deployPollOutput.match(/Poll ID: ([0-9])/)
        const pollId = deployPollIdRegMatch[1]
        const deployPollMPRegMatch = deployPollOutput.match(/MessageProcessor contract: (0x[a-fA-F0-9]{40})/)
        const mpAddress = deployPollMPRegMatch[1]
        const deployPollTallyRegMatch = deployPollOutput.match(/Tally contract: (0x[a-fA-F0-9]{40})/)
        const tallyAddress = deployPollTallyRegMatch[1]

        let subsidyAddress
        const deployPollSubsidyRegMatch = deployPollOutput.match(/Subsidy contract: (0x[a-fA-F0-9]{40})/) 
        const subsidyContract =  deployPollSubsidyRegMatch[1]
        subsidyEnabled ? subsidyAddress = "--subsidy " + subsidyContract: subsidyAddress = ''



        const treeDepths = {} as TreeDepths
        treeDepths.intStateTreeDepth = config.constants.poll.intStateTreeDepth
        treeDepths.messageTreeDepth = config.constants.poll.messageTreeDepth
        treeDepths.messageTreeSubDepth = config.constants.poll.messageBatchDepth
        treeDepths.voteOptionTreeDepth = config.constants.maci.voteOptionTreeDepth

        const maxValues = {} as MaxValues
        maxValues.maxUsers = config.constants.maci.maxUsers
        maxValues.maxMessages = config.constants.maci.maxMessages
        maxValues.maxVoteOptions  = config.constants.maci.maxVoteOptions
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
            data.bribers,
            data.votes
        )

        // Sign up
        for (let i = 0; i < users.length; i++) {
            const userKeypair = users[i].keypair
            userKeypairs.push(userKeypair)
            // Run the signup command
            const signupCommand = `node build/index.js signup` +
                ` -p ${userKeypair.pubKey.serialize()}` +
                ` -x ${maciAddress}`
            execute(signupCommand)

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
                const publishOutput = execute(publishCommand).stdout.trim()
                const publishRegMatch = publishOutput.match(
                    /Transaction hash: (0x[a-fA-F0-9]{64})\nEphemeral private key: (macisk.[a-f0-9]+)$/)

                // The publish command generates and outputs a random ephemeral private
                // key, so we have to retrieve it from the standard output
                const encPrivKey = PrivKey.unserialize(publishRegMatch[2])
                const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))

                const command = new PCommand(
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
        execute(timeTravelCommand)

        const mergeMessagesCommand = `node build/index.js mergeMessages -x ${maciAddress} -o ${pollId}`
        execute(mergeMessagesCommand)

        const mergeSignupsCommand = `node build/index.js mergeSignups -x ${maciAddress} -o ${pollId}`
        execute(mergeSignupsCommand)

        const removeOldProofs = `rm -rf tally.json subsidy.json proofs/`
        execute(removeOldProofs)

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
            ` -f proofs/` +
            ` ${genProofSubsidyArgument}`
        execute(genProofsCommand)

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
        if (subsidyEnabled) {
            const subsidy = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../cli/subsidy.json')).toString())
            // Validate generated proof file
            expect(JSON.stringify(subsidy.pollId)).toEqual(pollId)
            expectSubsidy(
                config.constants.maci.maxMessages,
                data.subsidy.expectedSubsidy,
                subsidy
            )
        }
        

        const proveOnChainCommand = `node build/index.js proveOnChain` +
            ` -x ${maciAddress}` +
            ` -o ${pollId}` +
            ` --mp ${mpAddress}` +
            ` --tally ${tallyAddress}` +
            ` -f proofs/` +
            ` ${subsidyAddress}`
        execute(proveOnChainCommand)

        const verifyCommand = `node build/index.js verify` +
            ` -x ${maciAddress}` +
            ` -o ${pollId}` +
            ` -t tally.json` +
            ` ${subsidyResultFilePath}`
        execute(verifyCommand)
    }
    catch(e) {
        console.error(e)
        return false
    } 
    
    return true
}

const executeSuiteElgamal = async (data: any, expect: any) => {
    try {
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

        let subsidyZkeyFilePath
        let subsidyWitnessCalculatorPath
        let subsidyResultFilePath
        const subsidyEnabled = data.subsidy && data.subsidy.enabled
        subsidyEnabled ? subsidyZkeyFilePath = " --subsidy-zkey ./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey" : subsidyZkeyFilePath = ''
        subsidyEnabled ? subsidyWitnessCalculatorPath = " --subsidy-witnessgen ./zkeys/SubsidyPerBatch_10-1-2_test" : subsidyWitnessCalculatorPath = ''
        subsidyEnabled ? subsidyResultFilePath = " --subsidy-file subsidy.json" : subsidyResultFilePath = ''
        let genProofSubsidyArgument = subsidyResultFilePath + subsidyWitnessCalculatorPath + subsidyZkeyFilePath
        

        const setVerifyingKeysCommand = `node build/index.js setVerifyingKeys` +
            ` -s ${config.constants.maci.stateTreeDepth}` +
            ` -i ${config.constants.poll.intStateTreeDepth}` +
            ` -m ${config.constants.maci.messageTreeDepth}` +
            ` -v ${config.constants.maci.voteOptionTreeDepth}` +
            ` -b ${config.constants.poll.messageBatchDepth}` +
            ` -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey` +
            ` -zpd ./zkeys/ProcessDeactivationMessages_5-10_test.0.zkey` +
            ` -t ./zkeys/TallyVotes_10-1-2_test.0.zkey` +
            ` -znkg ./zkeys/GenerateKeyFromDeactivated_10_test.0.zkey` +
            ` -k ${vkAddress}` +
            ` ${subsidyZkeyFilePath}`

        execute(setVerifyingKeysCommand)

        // Run the create subcommand
        // TODO: Make signup-deadline dynamic now + 30 days for example
        const createCommand = `node build/index.js create` +
            ` -r ${vkAddress}` +
            ` --signup-deadline 1692424915`+
            ` --deactivation-period ${config.constants.maci.deactivationPeriodDuration}`
        const createOutput = execute(createCommand).stdout.trim()
        const regMatch = createOutput.match(/MACI: (0x[a-fA-F0-9]{40})/)
        const maciAddress = regMatch[1]

        const deployPollCommand = `node build/index.js deployPoll` +
            ` -x ${maciAddress}` +
            ` -pk ${coordinatorKeypair.pubKey.serialize()}` +
            ` -t ${config.constants.poll.duration}` +
            ` -g ${config.constants.maci.maxMessages}` +
            ` -mv ${config.constants.maci.maxVoteOptions}` +
            ` -i ${config.constants.poll.intStateTreeDepth}` +
            ` -m ${config.constants.poll.messageTreeDepth}` +
            ` -b ${config.constants.poll.messageBatchDepth}` +
            ` -v ${config.constants.maci.voteOptionTreeDepth}`

        const deployPollOutput = execute(deployPollCommand).stdout.trim()
        const deployPollIdRegMatch = deployPollOutput.match(/Poll ID: ([0-9])/)
        const pollId = deployPollIdRegMatch[1]
        const deployPollMPRegMatch = deployPollOutput.match(/MessageProcessor contract: (0x[a-fA-F0-9]{40})/)
        const mpAddress = deployPollMPRegMatch[1]
        const deployPollTallyRegMatch = deployPollOutput.match(/Tally contract: (0x[a-fA-F0-9]{40})/)
        const tallyAddress = deployPollTallyRegMatch[1]

        let subsidyAddress
        const deployPollSubsidyRegMatch = deployPollOutput.match(/Subsidy contract: (0x[a-fA-F0-9]{40})/) 
        const subsidyContract =  deployPollSubsidyRegMatch[1]
        subsidyEnabled ? subsidyAddress = "--subsidy " + subsidyContract: subsidyAddress = ''



        const treeDepths = {} as TreeDepths
        treeDepths.intStateTreeDepth = config.constants.poll.intStateTreeDepth
        treeDepths.messageTreeDepth = config.constants.poll.messageTreeDepth
        treeDepths.messageTreeSubDepth = config.constants.poll.messageBatchDepth
        treeDepths.voteOptionTreeDepth = config.constants.maci.voteOptionTreeDepth

        const maxValues = {} as MaxValues
        maxValues.maxUsers = config.constants.maci.maxUsers
        maxValues.maxMessages = config.constants.maci.maxMessages
        maxValues.maxVoteOptions  = config.constants.maci.maxVoteOptions
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
            data.bribers,
            data.votes
        )

        // Sign up
        for (let i = 0; i < users.length; i++) {
            const userKeypair = users[i].keypair
            userKeypairs.push(userKeypair)
            // Run the signup command
            const signupCommand = `node build/index.js signup` +
                ` -p ${userKeypair.pubKey.serialize()}` +
                ` -x ${maciAddress}`
            execute(signupCommand)

            maciState.signUp(
                userKeypair.pubKey,
                BigInt(config.constants.maci.initialVoiceCredits),
                Date.now()
            )
        }

        console.log(`Deactivating keys for ${data.numUsers} users`)

        // Deactivating keys for every user
        for (let i = 0; i < users.length; i++) {
            // Run the deactivateKey command
            const deactivateKeyCommand = `node build/index.js deactivateKey` +
                ` --privkey ${userKeypairs[i].privKey.serialize()}` +
                ` --state-index ${i + 1}` +
                ` --nonce 2 ` +
                ` --salt 0x798D81BE4A9870C079B8DE539496AB95 ` + 
                ` --poll-id ${pollId}`

            execute(deactivateKeyCommand)
        }

        console.log(`Confirming deactivation`);

        const confirmDeactivationCommand = `node build/index.js confirmDeactivation` +  
            ` --poll-id ${pollId} ` +
            ` --privkey ${coordinatorKeypair.privKey.serialize()} ` +
            ` --from-block 0 ` +
            ` --batch-size 1` 
        execute(confirmDeactivationCommand)

        const timeTravelCommand2 = `node build/index.js timeTravel -s ${config.constants.maci.deactivationPeriodDuration}`
        execute(timeTravelCommand2)

        // Completing deactivation
        console.log(`Completing deactivation`)

        const completeDeactivationCommand = `node build/index.js completeDeactivation` +  
            ` --poll-id ${pollId} ` +
            ` --privkey ${coordinatorKeypair.privKey.serialize()} ` +
            ` --state-num-sr-queue-ops 1 ` +
            ` --deactivated-keys-num-sr-queue-ops 1 ` +
            ` --from-block 0 ` +
            ` --process-deactivation-witnessgen ./zkeys/ProcessDeactivationMessages_5-10_test ` +
            ` --process-deactivation-zkey ./zkeys/ProcessDeactivationMessages_5-10_test.0.zkey ` +
            ` --rapidsnark ~/rapidsnark/build/prover `
        execute(completeDeactivationCommand)

        console.log(`Generating new keys for ${data.numUsers} users`)

        // Generating new key for every user
        for (let i = 0; i < users.length; i++) {
            // Run the generateNewKey command
            const oldUserPubKey = userKeypairs[i].pubKey.serialize(); 
            const oldUserPrivKey = userKeypairs[i].privKey.serialize(); 
            
            users[i].changeKeypair();

            const generateNewKeyCommand = `node build/index.js generateNewKey ` +
                ` --new-pub-key ${userKeypairs[i].pubKey.serialize()} ` +
                ` --new-priv-key ${userKeypairs[i].privKey.serialize()} ` +
                ` --old-pub-key ${oldUserPubKey} ` +
                ` --old-priv-key ${oldUserPrivKey} ` +
                ` --coord-priv-key ${coordinatorKeypair.privKey.serialize()} ` + // TODO: This is wrong, no private key of coord should be available to the user
                ` --state-index ${i + 1} ` +
                ` --salt 0x798D81BE4A9870C079B8DE539496AB95 ` +
                ` --poll-id ${pollId} ` +
                ` --from-block 0 ` +
                ` --new-key-generation-witnessgen ./zkeys/GenerateKeyFromDeactivated_10_test ` +
                ` --new-key-generation-zkey ./zkeys/GenerateKeyFromDeactivated_10_test.0.zkey ` +
                ` --rapidsnark ~/rapidsnark/build/prover `

            execute(generateNewKeyCommand)
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
                const publishOutput = execute(publishCommand).stdout.trim()
                const publishRegMatch = publishOutput.match(
                    /Transaction hash: (0x[a-fA-F0-9]{64})\nEphemeral private key: (macisk.[a-f0-9]+)$/)

                // The publish command generates and outputs a random ephemeral private
                // key, so we have to retrieve it from the standard output
                const encPrivKey = PrivKey.unserialize(publishRegMatch[2])
                const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))

                const command = new PCommand(
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
        execute(timeTravelCommand)

        const mergeMessagesCommand = `node build/index.js mergeMessages -x ${maciAddress} -o ${pollId}`
        execute(mergeMessagesCommand)

        const mergeSignupsCommand = `node build/index.js mergeSignups -x ${maciAddress} -o ${pollId}`
        execute(mergeSignupsCommand)

        const removeOldProofs = `rm -rf tally.json subsidy.json proofs/`
        execute(removeOldProofs)

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
            ` -f proofs/` +
            ` ${genProofSubsidyArgument}`
        execute(genProofsCommand)

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
        if (subsidyEnabled) {
            const subsidy = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../cli/subsidy.json')).toString())
            // Validate generated proof file
            expect(JSON.stringify(subsidy.pollId)).toEqual(pollId)
            expectSubsidy(
                config.constants.maci.maxMessages,
                data.subsidy.expectedSubsidy,
                subsidy
            )
        }
        

        const proveOnChainCommand = `node build/index.js proveOnChain` +
            ` -x ${maciAddress}` +
            ` -o ${pollId}` +
            ` --mp ${mpAddress}` +
            ` --tally ${tallyAddress}` +
            ` -f proofs/` +
            ` ${subsidyAddress}`
        execute(proveOnChainCommand)

        const verifyCommand = `node build/index.js verify` +
            ` -x ${maciAddress}` +
            ` -o ${pollId}` +
            ` -t tally.json` +
            ` ${subsidyResultFilePath}`
        execute(verifyCommand)
    }
    catch(e) {
        console.error(e)
        return false
    } 
    
    return true
}

export {
    loadData,
    executeSuite,
    executeSuiteElgamal
}
