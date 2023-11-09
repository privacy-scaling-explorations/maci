import { MaciState, MaxValues, STATE_TREE_DEPTH, TreeDepths } from "maci-core"
import { 
    deploy, 
    deployPoll, 
    deployVkRegistryContract, 
    genProofs, 
    mergeMessages, 
    mergeSignups, 
    proveOnChain, 
    publish, 
    setVerifyingKeys, 
    signup, 
    timeTravel, 
    verify,
    DeployedContracts, 
    PollContracts
} from "maci-cli"
import { join } from "path"
import { 
    INT_STATE_TREE_DEPTH, 
    MSG_BATCH_DEPTH, 
    MSG_TREE_DEPTH, 
    SG_DATA, 
    VOTE_OPTION_TREE_DEPTH, 
    duration, 
    initialVoiceCredits, 
    ivcpData, 
    maxMessages, 
    messageBatchDepth 
} from "./utils/constants"
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs"
import { homedir } from "os"
import { expectSubsidy, expectTally, genTestUserCommands, sleep } from "./utils/utils"
import { genPubKey, genRandomSalt } from "maci-crypto"
import { existsSync, readFileSync, readdir, unlinkSync } from "fs"
import { expect } from "chai"

/**
 * MACI Integration tests 
 * @dev These tests use the cli code to perform full testing of the
 * protocol.
 */
describe("integration tests", function() {
    this.timeout(10000000)
    // global variables we need shared between tests
    let maciState: MaciState 
    let contracts: DeployedContracts
    let pollContracts: PollContracts
    let pollId: number 
    const coordinatorKeypair = new Keypair()

    // the code that we run before each test
    beforeEach(async () => {
        // create a new maci state
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

        // 3. deploy maci
        contracts = await deploy({
            vkRegistryAddress: vkRegistryAddress,
            quiet: true
        })

        // 4. create a poll
        pollContracts = await deployPoll({
            maciAddress: contracts.maciAddress,
            pollDuration: duration,
            intStateTreeDepth: INT_STATE_TREE_DEPTH,
            messageTreeDepth: MSG_TREE_DEPTH,
            messageTreeSubDepth: MSG_BATCH_DEPTH,
            voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
            maxMessages: 25,
            maxVoteOptions: 25,
            coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
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

        pollId = maciState.deployPoll(
            duration, 
            BigInt(Date.now() + (duration * 60000)),
            maxValues,
            treeDepths,
            messageBatchSize,
            coordinatorKeypair
        )
    })

    // after each test we need to cleanup some files
    afterEach(() => {
        if (existsSync(join(__dirname, "../../../cli/tally.json"))) unlinkSync(join(__dirname, "../../../cli/tally.json"))
        if (existsSync(join(__dirname, "../../../cli/subsidy.json"))) unlinkSync(join(__dirname, "../../../cli/subsidy.json"))
        const directory = join(__dirname, "../../../cli/proofs/")
        if (!existsSync(directory)) return
        readdir(directory, (err, files) => {
            if (err) throw err
            for (const file of files) {
                unlinkSync(join(directory, file))
            }
        })
    })

    // read the test suite data
    const data = JSON.parse(readFileSync(join(__dirname, `./data/suites.json`)).toString())
    for (const testCase of data.suites) {
        it(testCase.description, async () => {
            // check if we have subsidy enabled
            const subsidyEnabled = data.subsidy && data.subsidy.enabled
    
            const users = genTestUserCommands(
                data.numUsers,
                data.numVotesPerUser,
                data.bribers,
                data.votes 
            )
    
            // loop through all users and generate keypair + signup
            for (let i = 0; i < users.length; i++) {
                // generate a keypair
                const keypair = new Keypair()
                const _timestamp = Date.now()
                // signup 
                const stateIndex = await signup({
                    quiet: true,
                    maciPubKey: keypair.pubKey.serialize(),
                    maciAddress: contracts.maciAddress,
                    sgDataArg: SG_DATA,
                    ivcpDataArg: ivcpData
                })
    
                // signup on local maci state
                maciState.signUp(
                    keypair.pubKey,
                    BigInt(initialVoiceCredits),
                    BigInt(_timestamp)
                )
    
                // publish messages
                for (let j = 0; j < users[i].votes.length; j++) {
                    const user = users[i]
                    const isKeyChange = (data.changeUsersKeys && j in data.changeUsersKeys[i])
                    const voteOptionIndex = isKeyChange ?
                        data.changeUsersKeys[i][j].voteOptionIndex : user.votes[j].voteOptionIndex
                    const newVoteWeight  = isKeyChange ?
                        data.changeUsersKeys[i][j].voteWeight : user.votes[j].voteWeight
                    const nonce = user.votes[j].nonce
                    const salt = '0x' + genRandomSalt().toString(16)
                    const userPrivKey = isKeyChange ?
                        user.changeKeypair() : keypair.privKey
                    
                    // actually publish it
                    // @todo if key change we also need a new pub key
                    const encryptionKey = await publish({
                        quiet: true,
                        maciContractAddress: contracts.maciAddress,
                        pubkey: keypair.pubKey.serialize(),
                        privateKey: userPrivKey.serialize(),
                        voteOptionIndex: voteOptionIndex,
                        nonce: nonce,
                        salt: salt,
                        newVoteWeight: newVoteWeight,
                        stateIndex: Number(stateIndex),
                        pollId: pollId
                    })
    
                    const encPrivKey = PrivKey.unserialize(encryptionKey)
                    const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))
    
                    // create the command to add to the local state
                    const command = new PCommand(
                        BigInt(stateIndex),
                        keypair.pubKey,
                        BigInt(voteOptionIndex),
                        BigInt(newVoteWeight),
                        BigInt(nonce),
                        BigInt(pollId),
                        BigInt(salt)
                    )
                    const signature = command.sign(keypair.privKey)
                    const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encPrivKey, coordinatorKeypair.pubKey))
                    maciState.polls[pollId].publishMessage(message, encPubKey)
                }
            }
    
            await timeTravel({ quiet: false, seconds: duration + 1000 })

            // merge messages
            await mergeMessages({ quiet: true, pollId: pollId, maciContractAddress: contracts.maciAddress })

            // merge signups
            await mergeSignups({ quiet: true, pollId: pollId, maciContractAddress: contracts.maciAddress })
    
            // generate proofs
            await genProofs({
                quiet: true, 
                coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
                pollId: pollId,
                processWitgen: join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test"),
                tallyWitgen: join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test"),
                subsidyWitgen: subsidyEnabled ? join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test") : undefined,
                processZkey: join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"),
                tallyZkey: join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"),
                subsidyZkey: subsidyEnabled ? join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test.0.zkey") : undefined,
                tallyFile: join(__dirname, "../../../cli/tally.json"),
                subsidyFile: subsidyEnabled ? join(__dirname, "../../../cli/subsidy.json") : undefined,
                outputDir: join(__dirname, "../../../cli/proofs"),
                rapidsnark: `${homedir()}/rapidsnark/build/prover`
            })
    
            // verify that the data stored on the tally file is correct
            const tally = JSON.parse(readFileSync(join(__dirname, "../../../cli/tally.json")).toString())
            expect(JSON.stringify(tally.pollId)).to.eq(pollId)
            expectTally(maxMessages, data.expectedTally, data.expectedPerVOSpentVoiceCredits, data.expectedTotalSpentVoiceCredits, tally)
            if (subsidyEnabled) {
                const subsidy = JSON.parse(readFileSync(join(__dirname, "../../../cli/subsidy.json")).toString())
                expectSubsidy(maxMessages, data.expectedSubsidy, subsidy)
            }
            
            // prove on chain if everything matches
            await proveOnChain({
                quiet: true,
                pollId: pollId.toString(),
                maciAddress: contracts.maciAddress,
                messageProcessorAddress: pollContracts.messageProcessor,
                tallyAddress: pollContracts.tally,
                subsidyAddress: subsidyEnabled ? pollContracts.subsidy : undefined,
                proofDir: join(__dirname, "../../../cli/proofs")
            })
    
            // verify the proofs
            await verify({
                quiet: true,
                maciAddress: contracts.maciAddress,
                tallyAddress: pollContracts.tally,
                subsidyAddress: subsidyEnabled ? pollContracts.subsidy : undefined,
                pollId: pollId.toString(),
                tallyFile: join(__dirname, "../../../cli/tally.json"),
                subsidyFile: subsidyEnabled ? "./subsidy.json" : undefined
            })
        })
    }
})