import * as ethers from 'ethers'
import * as shell from 'shelljs'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as  path from 'path';
import { Vote, UserCommand } from './user'
import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

const exec = (command: string) => {
    return shell.exec('cd ../cli/ && ' + command, { silent: true })
}

const delay = (ms: number): Promise<void> => {
    return new Promise((resolve: Function) => setTimeout(resolve, ms))
}

const loadYaml = () => {
    try {
      const doc = yaml.load(fs.readFileSync(path.join(__dirname, '../../') + 'integrations.yml', 'utf8'));
      return doc
    } catch (e) {
      console.log(e);
    }
}

const genTestAccounts = (
    numAccounts: number,
    mnemonic,
) => {
    const accounts: ethers.Wallet[] = []

    for (let i=0; i<numAccounts; i++) {
        const path = `m/44'/60'/${i}'/0/0`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
        accounts.push(wallet)
    }

    return accounts
}

const genTestUserCommands = (
    numUsers: number,
    voteCreditBalance: number,
    numVotesPerUser: number,
    bribers?: any,
    votes?: any,
    invalidVotes?: any,
) => {
    const getTestVoteValues = (userIndex, voteIndex) => {
        const useVotes = votes && userIndex in votes
        let voteOptionIndex = config.defaultVote.voteOptionIndex
        let voteWeight = config.defaultVote.voteWeight
        let valid = true

        if (bribers && userIndex in bribers) {
            if (!(bribers[userIndex].voteOptionIndices.length == numVotesPerUser)) {
                throw new Error(
                    "failed generating user commands: more bribes than votes set per user"
                )
            }

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
        }

        if (useVotes) {
            voteOptionIndex = votes[userIndex][voteIndex].voteOptionIndex
            voteWeight = votes[userIndex][voteIndex].voteWeight
            valid = votes[userIndex][voteIndex].valid
        }

        return { voteOptionIndex, voteWeight, valid }
    }

    const config = loadYaml()
    let usersCommands: UserCommand[] = []
    for (let i=0; i< numUsers; i++) {
        const userKeypair = new Keypair()
        let votes: Vote[] = [];

        for (let j=0; j < numVotesPerUser; j++) {
            const { voteOptionIndex, voteWeight, valid } = getTestVoteValues(i,j)
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
            config.defaultVote.maxVoteWeight,
            config.defaultVote.nonce
        )
        usersCommands.push(userCommand)
    }

    return usersCommands;
}

interface Tally {
    provider: string,
    maci: string,
    pollId: number,
    newTallyCommitment: string,
    results: {
        tally: string[],
        salt: string
    }
    totalSpentVoiceCredits: {
        spent: string,
        salt: string
    }
    perVOSpentVoiceCredits: {
        tally: string[],
        salt: string
    }
}

interface Subsidy {
    provider: string,
    maci: string,
    pollId: number,
    newSubsidyCommitment: string,
    results: {
        subsidy: string[],
        salt: string
    }
}

const expectTally = (
    maxMessages: number,
    expectedTally: number[],
    expectedPerVOSpentVoiceCredits: number[],
    expectedTotalSpentVoiceCredits: number,
    tallyFile: Tally
) => {
    let genTally: string[] = Array(maxMessages).fill('0')
    let genPerVOSpentVoiceCredits: string[] = Array(maxMessages).fill('0')
    const calculateTally =
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

    expect(tallyFile.results.tally).toEqual(genTally)
    expect(tallyFile.perVOSpentVoiceCredits.tally).toEqual(genPerVOSpentVoiceCredits)
    expect(tallyFile.totalSpentVoiceCredits.spent).toEqual(expectedTotalSpentVoiceCredits.toString())
}

const expectSubsidy = (
    maxMessages: number,
    expectedSubsidy: number[],
    SubsidyFile: Subsidy
) => {
    let genSubsidy: string[] = Array(maxMessages).fill('0')
    const calculateTally =
    expectedSubsidy.map((value, index) => {
        if (value != 0) {
            genSubsidy[index] = value.toString()
        }
    })

    expect(SubsidyFile.results.subsidy).toEqual(genSubsidy)
}

export { exec, delay, loadYaml, genTestAccounts, genTestUserCommands, expectTally, expectSubsidy }
