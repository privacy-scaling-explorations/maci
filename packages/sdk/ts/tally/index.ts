export { generateTallyCommitments } from "./commitments";
export { verify } from "./verification";
export type {
  ITallyData,
  IVerifyArgs,
  IGenerateTallyCommitmentsArgs,
  ITallyCommitments,
  IVoteTallyInputs,
  IGetResultPerOptionArgs,
  IGetResultsArgs,
  IResult,
} from "./types";
export { getResultPerOption, getResults, isTallied } from "./results";
