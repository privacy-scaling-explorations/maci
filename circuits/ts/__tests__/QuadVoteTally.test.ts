jest.setTimeout(200000)
import { config } from 'maci-config'
import { 
    genPerVOSpentVoiceCreditsCommitment,
    genTallyResultCommitment,
    genSpentVoiceCreditsCommitment,
    MaciState,
} from 'maci-core'
import {
    genRandomSalt,
} from 'maci-crypto'

import {
    Keypair,
    Command,
} from 'maci-domainobjs'

import {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
} from '../'

const stateTreeDepth = config.maci.merkleTrees.stateTreeDepth
const messageTreeDepth = config.maci.merkleTrees.messageTreeDepth
const voteOptionTreeDepth = config.maci.merkleTrees.voteOptionTreeDepth
const initialVoiceCreditBalance = config.maci.initialVoiceCreditBalance
const voteOptionsMaxIndex = config.maci.voteOptionsMaxLeafIndex
const quadVoteTallyBatchSize = config.maci.quadVoteTallyBatchSize

const randomRange = (min: number, max: number) => {
  return BigInt(Math.floor(Math.random() * (max - min) + min))
}

const coordinator = new Keypair()
const voteWeight = BigInt(9)

describe('Quadratic vote tallying circuit', () => {
    let circuit
    const maciState = new MaciState(
        coordinator,
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        voteOptionsMaxIndex,
    )

    beforeAll(async () => {
        circuit = await compileAndLoadCircuit('test/quadVoteTally_test.circom')
    })

    it('should correctly tally results for 1 user with 1 message in 1 batch', async () => {

        const startIndex = BigInt(0)

        const user = new Keypair()
        // Sign up the user
        maciState.signUp(user.pubKey, initialVoiceCreditBalance)

        // Publish and process a message
        const voteOptionIndex = randomRange(0, voteOptionsMaxIndex)
        const command = new Command(
            BigInt(1),
            user.pubKey,
            voteOptionIndex,
            voteWeight,
            BigInt(1),
            genRandomSalt(),
        )

        const signature = command.sign(user.privKey)
        const sharedKey = Keypair.genEcdhSharedKey(user.privKey, coordinator.pubKey)
        const message = command.encrypt(signature, sharedKey)

        // Publish a message
        maciState.publishMessage(message, user.pubKey)

        // Process the message
        maciState.processMessage(0)

        const currentResults = maciState.computeCumulativeVoteTally(startIndex, quadVoteTallyBatchSize)

        // Ensure that the current results are all 0 since this is the first
        // batch
        for (let i = 0; i < currentResults.length; i++) {
            expect(currentResults[i].toString()).toEqual(BigInt(0).toString())
        }

        // Calculate the vote tally for a batch of state leaves
        const tally = maciState.computeBatchVoteTally(startIndex, quadVoteTallyBatchSize)

        expect(tally.length.toString()).toEqual((5 ** voteOptionTreeDepth).toString())
        expect(tally[voteOptionIndex].toString()).toEqual(voteWeight.toString())

        const currentResultsSalt = BigInt(0)
        const newResultsSalt = genRandomSalt()

        const currentSpentVoiceCreditsSalt = BigInt(0)
        const newSpentVoiceCreditsSalt = genRandomSalt()

        const currentPerVOSpentVoiceCreditsCommitment = BigInt(0)
        const newPerVOSpentVoiceCreditsSalt = genRandomSalt()

        // Generate circuit inputs
        const circuitInputs 
            = maciState.genQuadVoteTallyCircuitInputs(
                startIndex,
                quadVoteTallyBatchSize,
                currentResultsSalt,
                newResultsSalt,
                currentSpentVoiceCreditsSalt,
                newSpentVoiceCreditsSalt,
                currentPerVOSpentVoiceCreditsCommitment,
                newPerVOSpentVoiceCreditsSalt,
            )

        expect(circuitInputs.stateLeaves.length).toEqual(quadVoteTallyBatchSize)

        const witness = await executeCircuit(circuit, circuitInputs)

        // Check the result tally commitment
        const expectedResultsCommitmentOutput = getSignalByName(circuit, witness, 'main.newResultsCommitment').toString()
        const expectedResultsCommitment = genTallyResultCommitment(tally, newResultsSalt, voteOptionTreeDepth)

        expect(expectedResultsCommitmentOutput.toString()).toEqual(expectedResultsCommitment.toString())

        // Check the total spent voice credit commitment
        const expectedSpentVoiceCreditsCommitmentOutput = getSignalByName(circuit, witness, 'main.newSpentVoiceCreditsCommitment').toString()

        const expectedSpentVoiceCreditsCommitment = genSpentVoiceCreditsCommitment(
            voteWeight * voteWeight,
            newSpentVoiceCreditsSalt,
        )
        expect(expectedSpentVoiceCreditsCommitmentOutput.toString())
            .toEqual(expectedSpentVoiceCreditsCommitment.toString())

        // Check the total spent voice credit commitment per vote option
        const perVOSpentVoiceCredits = maciState.computeBatchPerVOSpentVoiceCredits(
            startIndex,
            quadVoteTallyBatchSize,
        )

        const expectedPerVOSpentVoiceCreditsCommitment = genPerVOSpentVoiceCreditsCommitment(
            perVOSpentVoiceCredits,
            newPerVOSpentVoiceCreditsSalt,
            voteOptionTreeDepth,
        )

        const expectedPerVOSpentVoiceCreditsCommitmentOutput = getSignalByName(circuit, witness, 'main.newPerVOSpentVoiceCreditsCommitment').toString()

        expect(expectedPerVOSpentVoiceCreditsCommitmentOutput.toString())
            .toEqual(expectedPerVOSpentVoiceCreditsCommitment.toString())

        // Check the sum of votes
        const totalVotes = getSignalByName(circuit, witness, 'main.totalVotes').toString()
        expect(totalVotes.toString()).toEqual(voteWeight.toString())
    })
})
