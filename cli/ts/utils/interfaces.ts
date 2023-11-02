export interface DeployArgs {
    vkRegistryAddress?: string,
    initialVoiceCredits?: number,
    initialVoiceCreditsProxyAddress?: string,
    signupGatekeeperAddress?: string,
    quiet?: boolean
}

export interface DeployVkRegistryArgs {
    quiet?: boolean 
}

export interface AirdropArgs {
    amount: number,
    contractAddress?: string
    pollId?: number
    maciAddress?: string
    quiet?: boolean
}

export interface DeployPollArgs {
    pollDuration: number
    maxMessages: number 
    maxVoteOptions: number
    intStateTreeDepth: number 
    messageTreeSubDepth: number 
    messageTreeDepth: number 
    voteOptionTreeDepth: number
    coordinatorPubkey: string 
    maciAddress?: string 
    quiet?: boolean 
}

export interface PublishArgs {
    pubkey: string 
    maciContractAddress?: string 
    stateIndex: number 
    voteOptionIndex: number 
    nonce: number 
    salt?: string  
    pollId: number
    newVoteWeight: number  
    privateKey?: string 
    quiet?: boolean 
}

export interface GenMaciPubKeyArgs {
    privkey: string
    quiet?: boolean 
}

export interface MergeMessagesArgs {
    quiet?: boolean
    maciContractAddress?: string 
    pollId: number  
    numQueueOps?: string 
}

export interface MergeSignupsArgs {
    maciContractAddress?: string 
    quiet?: boolean 
    pollId: number
    numQueueOps?: string
}

export interface TimeTravelArgs {
    quiet?: boolean
    provider?: string
    seconds: number 
}

export interface SignUpArgs {
    maciPubKey: string
    maciAddress?: string 
    sgDataArg?: string
    ivcpDataArg?: string
    quiet?: boolean 
}

export interface TopupArgs {
    amount: number
    maciAddress?: string
    quiet?: boolean
    stateIndex: number 
    pollId: number
}

export interface SetVerifyingKeysArgs {
    vkRegistry?: string 
    stateTreeDepth: number 
    intStateTreeDepth: number 
    messageTreeDepth: number 
    voteOptionTreeDepth: number
    messageBatchDepth: number 
    processMessagesZkeyPath: string 
    tallyVotesZkeyPath: string
    subsidyZkeyPath?: string
    quiet?: boolean
}

export interface FundWalletArgs {
    quiet?: boolean
    amount: number 
    address: string 
}


export interface VerifyArgs {
    quiet?: boolean
    pollId: string 
    maciAddress?: string 
    tallyAddress?: string 
    subsidyAddress?: string
    tallyFile: string 
    subsidyFile?: string
}

export interface GenProofsArgs {
    outputDir: string 
    tallyFile: string 
    quiet?: boolean
    rapidsnark: string,
    processWitgen: string,
    tallyWitgen: string,
    tallyZkey: string,
    processZkey: string,
    subsidyFile?: string,
    subsidyZkey?: string,
    subsidyWitgen?: string,
    coordinatorPrivKey?: string 
    maciAddress?: string 
    pollId: number 
    transactionHash?: string,
    processWasm?: string,
    tallyWasm?: string,
    subsidyWasm?: string
}

export interface ProveOnChainArgs {
    quiet?: boolean
    pollId: string  
    maciAddress?: string 
    messageProcessorAddress?: string
    tallyAddress?: string 
    subsidyAddress?: string
    proofDir: string 
}

export interface CheckVerifyingKeysArgs {
    quiet?: boolean 
    maciContract?: string
    stateTreeDepth: number
    intStateTreeDepth: number
    messageTreeDepth: number
    voteOptionTreeDepth: number
    messageBatchDepth: number
    processMessagesZkeyPath: string
    tallyVotesZkeyPath: string
}

export interface GenKeyPairArgs { 
    quiet?: boolean
}

export interface ShowContractsArgs { 
    quiet?: boolean
}

export interface DeployedContracts {
    maciAddress: string 
    stateAqAddress: string
    pollFactoryAddress: string
    topupCreditAddress: string
    poseidonT3Address: string
    poseidonT4Address: string
    poseidonT5Address: string
    poseidonT6Address: string
    initialVoiceCreditProxyAddress: string
    signUpGatekeeperAddress: string
    verifierAddress: string
}

export interface PollContracts {
    messageProcessor: string 
    tally: string 
    subsidy: string
    poll: string 
}