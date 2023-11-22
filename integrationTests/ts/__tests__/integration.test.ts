import { MaciState, MaxValues, TreeDepths } from "maci-core"
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
    STATE_TREE_DEPTH, 
    VOTE_OPTION_TREE_DEPTH, 
    duration, 
    initialVoiceCredits, 
    ivcpData, 
    maxMessages, 
    messageBatchDepth 
} from "./utils/constants"
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs"
import { homedir } from "os"
import { expectSubsidy, expectTally, genTestUserCommands, isArm } from "./utils/utils"
import { genPubKey, genRandomSalt } from "maci-crypto"
import { existsSync, readFileSync, readdir, unlinkSync } from "fs"

/**
 * MACI Integration tests 
 * @dev These tests use the cli code to perform full testing of the
 * protocol.
 */
describe("integration tests", function() {
    this.timeout(10000000)

    // check on which system we are running
    const useWasm = isArm()

    // global variables we need shared between tests
    let maciState: MaciState 
    let contracts: DeployedContracts
    let pollContracts: PollContracts
    let pollId: number 
    const coordinatorKeypair = new Keypair()

    let vkRegistryAddress: string 
    // the code that we run before all tests
    before(async () => {
        // 1. deploy Vk Registry
        vkRegistryAddress = await deployVkRegistryContract(true)
        // 2. set verifying keys
        await setVerifyingKeys(
            STATE_TREE_DEPTH,
            INT_STATE_TREE_DEPTH,
            MSG_TREE_DEPTH,
            VOTE_OPTION_TREE_DEPTH,
            MSG_BATCH_DEPTH,
            join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"),
            join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"),   
            vkRegistryAddress,
            join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test.0.zkey"),
            true
        )
    })

    // the code that we run before each test
    beforeEach(async () => {
        // create a new maci state
        maciState = new MaciState(STATE_TREE_DEPTH)

        // 3. deploy maci
        contracts = await deploy(
            STATE_TREE_DEPTH,
            vkRegistryAddress,
            initialVoiceCredits,
            undefined,
            undefined,
            true
        )

        // 4. create a poll
        pollContracts = await deployPoll(
            duration,
            25,
            25,
            INT_STATE_TREE_DEPTH,
            MSG_BATCH_DEPTH,
            MSG_TREE_DEPTH,
            VOTE_OPTION_TREE_DEPTH,
            coordinatorKeypair.pubKey.serialize(),
            contracts.maciAddress,
            true
        )

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
            const subsidyEnabled = testCase.subsidy && testCase.subsidy.enabled
    
            const users = genTestUserCommands(
                testCase.numUsers,
                testCase.numVotesPerUser,
                testCase.bribers,
                testCase.votes 
            )
    
            // loop through all users and generate keypair + signup
            for (let i = 0; i < users.length; i++) {
                // generate a keypair
                const keypair = new Keypair()
                const _timestamp = Date.now()
                // signup 
                const stateIndex = await signup(
                    keypair.pubKey.serialize(),
                    contracts.maciAddress,
                    SG_DATA,
                    ivcpData,
                    true
                )
    
                // signup on local maci state
                maciState.signUp(
                    keypair.pubKey,
                    BigInt(initialVoiceCredits),
                    BigInt(_timestamp)
                )
    
                // publish messages
                for (let j = 0; j < users[i].votes.length; j++) {
                    const user = users[i]
                    const isKeyChange = (testCase.changeUsersKeys && j in testCase.changeUsersKeys[i])
                    const voteOptionIndex = isKeyChange ?
                    testCase.changeUsersKeys[i][j].voteOptionIndex : user.votes[j].voteOptionIndex
                    const newVoteWeight  = isKeyChange ?
                    testCase.changeUsersKeys[i][j].voteWeight : user.votes[j].voteWeight
                    const nonce = user.votes[j].nonce
                    const salt = '0x' + genRandomSalt().toString(16)
                    const userPrivKey = isKeyChange ?
                        user.changeKeypair() : keypair.privKey
                    
                    // actually publish it
                    // @todo if key change we also need a new pub key
                    const encryptionKey = await publish(
                        keypair.pubKey.serialize(),
                        Number(stateIndex),
                        voteOptionIndex,
                        nonce,
                        pollId,
                        newVoteWeight,
                        contracts.maciAddress,
                        salt,
                        userPrivKey.serialize(),
                        true
                    )
    
                    const encPrivKey = PrivKey.deserialize(encryptionKey)
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
    
            await timeTravel(duration, true)

            // merge messages
            await mergeMessages(pollId, contracts.maciAddress, undefined, true)

            // merge signups
            await mergeSignups(pollId, contracts.maciAddress, undefined, true)

            // generate proofs
            await genProofs(
                join(__dirname, "../../../cli/proofs"),
                join(__dirname, "../../../cli/tally.json"),
                join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"),
                join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"),
                0,
                join(__dirname, "../../../cli//subsidy.json"),
                join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test.0.zkey"),
                `${homedir()}/rapidsnark/build/prover`,
                join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test"),
                join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test"),
                join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test"),
                coordinatorKeypair.privKey.serialize(),
                contracts.maciAddress,
                undefined,
                join(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test.wasm"),
                join(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test.wasm"),
                join(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test.wasm"),
                useWasm,
                true
            )

            // verify that the data stored on the tally file is correct
            const tally = JSON.parse(readFileSync(join(__dirname, "../../../cli/tally.json")).toString())
            expectTally(maxMessages, testCase.expectedTally, testCase.expectedSpentVoiceCredits, testCase.expectedTotalSpentVoiceCredits, tally)
            
            if (subsidyEnabled) {
                const subsidy = JSON.parse(readFileSync(join(__dirname, "../../../cli/subsidy.json")).toString())
                expectSubsidy(maxMessages, testCase.subsidy.expectedSubsidy, subsidy)
            }
            
            // prove on chain if everything matches
            await proveOnChain(
                pollId.toString(),
                join(__dirname, "../../../cli/proofs"),
                contracts.maciAddress,
                pollContracts.messageProcessor,
                pollContracts.tally,
                pollContracts.subsidy,
                true
            )
    
            // verify the proofs
            await verify(
                pollId.toString(),
                join(__dirname, "../../../cli/tally.json"),
                contracts.maciAddress,
                pollContracts.tally,
                pollContracts.subsidy,
                subsidyEnabled ? join(__dirname, "../../../cli/subsidy.json") : undefined,
                true
            )
        })
    }
})