/**
 * A util interface that represents a vote object
 */
export interface Vote {
    voteOptionIndex: number
    voteWeight: number
    nonce: number
    valid: boolean
}

export interface Tally {
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

export interface Subsidy {
    provider: string,
    maci: string,
    pollId: number,
    newSubsidyCommitment: string,
    results: {
        subsidy: string[],
        salt: string
    }
}