export {
  getPolicyTrait,
  getPolicyContractNamesByTrait,
  getSemaphorePolicyData,
  getZupassPolicyData,
  getEASPolicyData,
  getMerkleProofPolicyData,
} from "./policy";
export { mergeSignups } from "./merge";
export { generateMaciState } from "./state";
export { EPolicyTrait } from "./types";
export type {
  IGetPolicyTraitArgs,
  IGetPolicyDataArgs,
  ISemaphorePolicyData,
  IZupassPolicyData,
  IEASPolicyData,
  IMerkleProofPolicyData,
  IMergeSignupsArgs,
  IGenerateMaciStateArgs,
} from "./types";
