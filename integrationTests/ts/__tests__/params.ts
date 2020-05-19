import { calcTreeDepthFromMaxLeaves } from './utils'

const maxUsers = 5 ** 2 - 1
const maxMessages = 5 ** 2 - 1
const maxVoteOptions = 15
const signupDuration = 15 
const votingDuration = 60
const messageBatchSize = 5
const tallyBatchSize = 5
const initialVoiceCredits = 1000
const stateTreeDepth = calcTreeDepthFromMaxLeaves(maxUsers)
const messageTreeDepth = calcTreeDepthFromMaxLeaves(maxMessages)
const voteOptionTreeDepth = calcTreeDepthFromMaxLeaves(maxVoteOptions)

export {
    maxUsers,
    maxMessages,
    maxVoteOptions,
    signupDuration,
    votingDuration,
    messageBatchSize,
    tallyBatchSize,
    initialVoiceCredits,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
}
