import { MaciState, MaxValues, STATE_TREE_DEPTH, TreeDepths } from "maci-core"
import { DeployedContracts, deploy, deployPoll, deployVkRegistryContract, genKeyPair, genProofs, mergeMessages, mergeSignups, proveOnChain, setVerifyingKeys, signup, timeTravel, verify } from "maci-cli/ts/api"
import { join } from "path"
import { INT_STATE_TREE_DEPTH, MSG_BATCH_DEPTH, MSG_TREE_DEPTH, SG_DATA, VOTE_OPTION_TREE_DEPTH, duration, initialVoiceCredits, ivcpData, messageBatchDepth } from "./constants"
import { Keypair } from "maci-domainobjs"
import { getDefaultSigner } from "maci-contracts"
import { PollContracts } from "maci-cli/ts/utils"
import { homedir } from "os"

/**
 * MACI Integration tests 
 * @dev These tests use the cli code to perform full testing of the
 * protocol.
 */
describe("integration tests", () => {
    /*
  {
            "name": "Happy path",
            "description": "Full tree, 4 batches, no bribers",
            "numVotesPerUser": 1,
            "numUsers": 15,
            "expectedTally": [15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "expectedSpentVoiceCredits": [15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "expectedTotalSpentVoiceCredits": 15
        },
    */
    let signer: any 
    let maciState: MaciState 
    let contracts: DeployedContracts
    let pollContracts: PollContracts
    beforeEach(async () => {
        signer = await getDefaultSigner()
        const maciState = new MaciState()

        // 1. deploy Vk Registry
        const vkRegistryAddress = await deployVkRegistryContract({quiet: true})
       
        // 2. set verifying keys
        await setVerifyingKeys({
            vkRegistry: vkRegistryAddress,
            stateTreeDepth: STATE_TREE_DEPTH,
            intStateTreeDepth: INT_STATE_TREE_DEPTH,
            messageTreeDepth: MSG_TREE_DEPTH,
            voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
            messageBatchDepth: MSG_BATCH_DEPTH,
            processMessagesZkeyPath: join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"),
            tallyVotesZkeyPath: join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"),
            quiet: true
        })

        // deploy maci
        contracts = await deploy({
            vkRegistryAddress: vkRegistryAddress,
            quiet: true
        })

        const coordinatorKeypair = new Keypair()

        // create a poll
        pollContracts = await deployPoll({
            maciAddress: contracts.maciAddress,
            pollDuration: 300,
            intStateTreeDepth: INT_STATE_TREE_DEPTH,
            messageTreeDepth: MSG_TREE_DEPTH,
            messageTreeSubDepth: MSG_BATCH_DEPTH,
            voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
            maxMessages: 25,
            maxVoteOptions: 25,
            coordinatorPubkey: coordinatorKeypair.pubKey.rawPubKey.toString(),
            quiet: true
        })

        const treeDepths: TreeDepths = {
            intStateTreeDepth: INT_STATE_TREE_DEPTH,
            messageTreeDepth: MSG_TREE_DEPTH,
            messageTreeSubDepth: MSG_BATCH_DEPTH,
            voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH
        }
        const maxValues: MaxValues = {
            maxMessages: 25,
            maxVoteOptions: 25 
        }
        const messageBatchSize = 5 ** messageBatchDepth

        maciState.deployPoll(
            duration, 
            BigInt(Date.now() + (duration * 60000)),
            maxValues,
            treeDepths,
            messageBatchSize,
            coordinatorKeypair
        )
    })

    it("Full tree, 4 batches, no bribers", async () => {
        const userKeypairs: Keypair[] = []

        // loop through all users
        for (let i = 0; i < 15; i++) {
            // generate a keypair
            const keypair = new Keypair()
            userKeypairs.push(keypair)
            const _timestamp = Date.now()
            // signup 
            const stateIndex = await signup({
                quiet: true,
                maciPubKey: keypair.pubKey.serialize(),
                maciAddress: contracts.maciAddress,
                sgDataArg: SG_DATA,
                ivcpDataArg: ivcpData
            })

            maciState.signUp(
                keypair.pubKey,
                BigInt(initialVoiceCredits),
                BigInt(_timestamp)
            )

            const userVotes: any[] = []
            // loop through each of their votes
            for (let j = 0; j < userVotes.length; j++) {

            }

            // publish 
        }

        /*

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

        */
        await timeTravel({quiet: true, provider: signer.provider, seconds: 3600})

        // merge messages
        await mergeMessages({quiet: true, pollId: 0, maciContractAddress: contracts.maciAddress})

        // merge signups
        await mergeSignups({quiet: true, pollId: 0, maciContractAddress: contracts.maciAddress})
        // console.log(`Signing up ${data.numUsers} users`)

        // generate proofs
        await genProofs({
            quiet: true, 
            coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
            pollId: 1,
            processWitgen: join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test"),
            tallyWitgen: join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test"),
            subsidyWitgen: join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test"),
            processZkey: join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"),
            tallyZkey: join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"),
            subsidyZkey: join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test.0.zkey"),
            tallyFile: join(__dirname, "../../../cli/tally.json"),
            subsidyFile: join(__dirname, "../../../cli/subsidy.json"),
            outputDir: join(__dirname, "../../../cli/proofs"),
            rapidsnark: `${homedir()}/rapidsnark/build/prover`
        })
        
        await proveOnChain({
            quiet: true,
            pollId: '0',
            maciAddress: contracts.maciAddress,
            messageProcessorAddress: pollContracts.messageProcessor,
            tallyAddress: pollContracts.tally,
            proofDir: join(__dirname, "../../../cli/proofs")
        })

        await verify({
            quiet: true,
            maciAddress: contracts.maciAddress,
            tallyAddress: pollContracts.tally,
            // subsidyAddress: pollContracts.subsidy,
            pollId: '0',
            tallyFile: join(__dirname, "../../../cli/tally.json"),
            // subsidyFile: "./subsidy.json"
        })
    })
})