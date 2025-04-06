declare module '@maci-protocol/domainobjs' {
  export class PubKey {
    copy(): PubKey;
  }

  export class StateLeaf {
    copy(): StateLeaf;
    pubKey: PubKey;
    voiceCreditBalance: bigint;
  }

  export class Ballot {
    copy(): Ballot;
    nonce: bigint;
    votes: bigint[];
  }

  export class Message {
    data: bigint[];
  }

  export interface IProcessMessagesCircuitInputs {
    stateLeafIndex: number;
    newStateLeaf: StateLeaf;
    originalStateLeaf: StateLeaf;
    originalStateLeafPathElements: bigint[][];
    originalVoteWeight: bigint;
    originalVoteWeightsPathElements: bigint[][];
    newBallot: Ballot;
    originalBallot: Ballot;
    originalBallotPathElements: bigint[][];
    command: any;
  }

  export interface IPollJoinedCircuitInputs {
    privKey: any;
    pathElements: string[];
    voiceCreditsBalance: string;
    joinTimestamp: string;
    pathIndices: string[];
    actualStateTreeDepth: string;
    stateRoot: string;
  }

  export interface IPollResultsCircuitInputs {
    results: string[];
    resultsRoot: string;
    currentResultsCommitment: string;
    currentVotesForOption: string[];
    currentSpentVoiceCreditsCommitment: string;
    currentPerVOSpentVoiceCreditsCommitment: string;
  }

  export interface IPollStateCircuitInputs {
    pollStateRoot: string;
    pollBallotRoot: string;
  }
} 