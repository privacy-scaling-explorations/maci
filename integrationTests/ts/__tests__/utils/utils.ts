import { UserCommand } from './user'
import { Subsidy, Tally, Vote } from './interfaces'
import { Keypair } from 'maci-domainobjs'
import { defaultVote } from './constants'
import { expect } from "chai"
import { arch } from 'os'

/**
 * Test utility to generate vote objects for integrationt ests
 * @param userIndex - the index of the user
 * @param voteIndex - the index of the vote
 * @param numVotesPerUser - the amount of votes per user
 * @param votes - the votes object
 * @param bribers - the bribers votes
 * @returns 
 */
const getTestVoteValues = (
    userIndex: number, 
    voteIndex: number,
    numVotesPerUser: number,
    votes?: any,
    bribers?: any 
) => {
    // check if we have specific votes
    const useVotes = votes && userIndex in votes
    let voteOptionIndex = defaultVote.voteOptionIndex
    let voteWeight = defaultVote.voteWeight
    let valid = true

    // if we have bribers
    if (bribers && userIndex in bribers) {
        if (!(bribers[userIndex].voteOptionIndices.length == numVotesPerUser)) {
            throw new Error(
                "failed generating user commands: more bribes than votes set per user"
            )
        }

        // if we were provided specific votes
        if (useVotes) {
            if (
                bribers[userIndex].voteOptionIndices[voteIndex] !=
                votes[userIndex][voteIndex].voteOptionIndex
            ) {
                throw new Error(
                    "failed generating user commands: conflict between bribers voteOptionIndex and the one set by voters"
                )
            }
        }
        voteOptionIndex = bribers[userIndex].voteOptionIndices[voteIndex]
    } else {
        voteOptionIndex = votes[userIndex][voteIndex].voteOptionIndex
    }

    if (useVotes) {
        voteWeight = votes[userIndex][voteIndex].voteWeight
        valid = votes[userIndex][voteIndex].valid
    }

    return { voteOptionIndex, voteWeight, valid }
}


export const genTestUserCommands = (
    numUsers: number,
    numVotesPerUser: number,
    bribers?: any,
    presetVotes?: any,
) => {
    const usersCommands: UserCommand[] = []
    for (let i=0; i< numUsers; i++) {
        const userKeypair = new Keypair()
        const votes: Vote[] = [];

        for (let j=0; j < numVotesPerUser; j++) {
            const { voteOptionIndex, voteWeight, valid } = getTestVoteValues(i , j, numVotesPerUser, presetVotes, bribers)
            const vote: Vote = {
                voteOptionIndex,
                voteWeight,
                nonce: j + 1,
                valid
            }

            votes.push(vote)
        }

        const userCommand = new UserCommand(
            userKeypair,
            votes,
            BigInt(defaultVote.maxVoteWeight),
            BigInt(defaultVote.nonce)
        )
        usersCommands.push(userCommand)
    }

    return usersCommands
}


/**
 * Assertion function to validate that the tally results are as expected
 * @param maxMessages 
 * @param expectedTally 
 * @param expectedPerVOSpentVoiceCredits 
 * @param expectedTotalSpentVoiceCredits 
 * @param tallyFile 
 */
export const expectTally = (
    maxMessages: number,
    expectedTally: number[],
    expectedPerVOSpentVoiceCredits: number[],
    expectedTotalSpentVoiceCredits: number,
    tallyFile: Tally
) => {
    const genTally: string[] = Array(maxMessages).fill('0')
    const genPerVOSpentVoiceCredits: string[] = Array(maxMessages).fill('0')
    expectedTally.map((voteWeight, voteOption) => {
        if (voteWeight != 0) {
            genTally[voteOption] = voteWeight.toString()
        }
    })    

    expectedPerVOSpentVoiceCredits.map((spentCredit, index) => {
        if (spentCredit != 0) {
            genPerVOSpentVoiceCredits[index] = spentCredit.toString()
        }
    })
   
    expect(tallyFile.results.tally).to.eq(genTally)
    expect(tallyFile.perVOSpentVoiceCredits.tally).to.eq(genPerVOSpentVoiceCredits)
    expect(tallyFile.totalSpentVoiceCredits.spent).to.eq(expectedTotalSpentVoiceCredits.toString())
}

/**
 * Assertion function to ensure that the subsidy results are as expected
 * @param maxMessages 
 * @param expectedSubsidy 
 * @param SubsidyFile 
 */
export const expectSubsidy = (
    maxMessages: number,
    expectedSubsidy: number[],
    subsidyFile: Subsidy
) => {
    const genSubsidy: string[] = Array(maxMessages).fill('0')
    expectedSubsidy.map((value, index) => {
        if (value != 0) {
            genSubsidy[index] = value.toString()
        }
    })

    expect(subsidyFile.results.subsidy).to.eq(genSubsidy)
}

/**
 * Stop the current thread for x seconds
 * @param ms - the number of ms to sleep for
 */
export const sleep = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check whether we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = () => arch().includes('arm') 