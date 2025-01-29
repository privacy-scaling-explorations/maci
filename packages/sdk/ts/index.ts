export { getPoll, getPollParams } from "./poll";
export { verify } from "./verify";
export { generateTallyCommitments } from "./tallyCommitments";
export { isUserRegistered, isJoinedUser, signup } from "./user";
export { getAllOnChainVks, compareVks, extractAllVks } from "./verifyingKeys";
export { isArm } from "./utils";
export { genSignUpTree } from "./trees";
export { generateVote, getCoordinatorPubKey } from "./votes";

export {
  EMode,
  EContracts,
  EGatekeepers,
  EInitialVoiceCreditProxies,
  EDeploySteps,
  Deployment,
  ContractStorage,
  ProofGenerator,
  TreeMerger,
  Prover,
  extractVk,
  genProofRapidSnark,
  genProofSnarkjs,
  formatProofForVerifierContract,
  verifyProof,
  linkPoseidonLibraries,
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployMaci,
  deployMockVerifier,
  deployVkRegistry,
  deployVerifier,
  genMaciStateFromContract,
  getDefaultSigner,
  cleanThreads,
  unlinkFile,
} from "maci-contracts";

export type {
  FullProveResult,
  IGenerateProofsOptions,
  IGenerateProofsBatchData,
  IDeployParams,
  IMergeParams,
  IProveParams,
  IVerifyingKeyStruct,
  SnarkProof,
} from "maci-contracts";

export * from "maci-contracts/typechain-types";

export type {
  TallyData,
  VerifyArgs,
  IGetPollArgs,
  IGetPollData,
  IIsRegisteredUser,
  IIsJoinedUser,
  IExtractAllVksArgs,
  IMaciVks,
  IGenSignUpTree,
} from "./utils";
