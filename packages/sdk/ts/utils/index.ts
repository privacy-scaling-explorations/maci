export { cidToBytes32, createCidFromObject } from "./cid";
export { BLOCKS_STEP } from "./constants";
export { contractExists, currentBlockTimestamp } from "./contracts";
export { asHex } from "./formatting";
export { validateParams } from "./params";
export { calculateBinaryTreeDepthFromMaxLeaves, calculateQuinTreeDepthFromMaxLeaves } from "./trees";
export { isArm } from "./utils";
export { generateAndVerifyProof } from "./proofs";

export type { ICircuitParams, ISnarkJSVerificationKey } from "./types";
