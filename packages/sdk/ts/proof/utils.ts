import type { IPollJoiningArtifactsUrl } from "./types";

/**
 * Get the url of the poll joining artifacts
 *
 * @param testing - Whether to get the testing artifacts
 * @param stateTreeDepth - The depth of the state tree
 * @returns The url of the poll joining artifacts
 */
export const getPollJoiningArtifactsUrl = (testing: boolean, stateTreeDepth: number): IPollJoiningArtifactsUrl => {
  if (testing) {
    return {
      zKeyUrl: `https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v3.0.0/browser-poll-join/testing/PollJoining_${stateTreeDepth}_test.0.zkey`,
      wasmUrl: `https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v3.0.0/browser-poll-join/testing/PollJoining_${stateTreeDepth}_test.wasm`,
    };
  }

  return {
    zKeyUrl: `https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v3.0.0/browser-poll-join/production/PollJoining_${stateTreeDepth}.0.zkey`,
    wasmUrl: `https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v3.0.0/browser-poll-join/production/PollJoining_${stateTreeDepth}.wasm`,
  };
};
