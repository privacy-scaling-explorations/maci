/* eslint-disable no-bitwise */

/**
 * This function generates the signature of a Poll Joining Verifying Key.
 * This can be used to check if a PollJoining' circuit verifying key is registered
 * in a smart contract that holds several verifying keys.
 * @param stateTreeDepth - The depth of the state tree.
 * @returns Returns a signature for querying if a verifying key with the given parameters is already registered in the contract.
 */
export const generatePollJoiningVerifyingKeySignature = (stateTreeDepth: number): bigint =>
  BigInt(stateTreeDepth) << 64n;

/**
 * This function generates the signature of a Poll Joined Verifying Key.
 * This can be used to check if a PollJoined' circuit verifying key is registered
 * in a smart contract that holds several verifying keys.
 * @param stateTreeDepth - The depth of the state tree.
 * @returns Returns a signature for querying if a verifying key with the given parameters is already registered in the contract.
 */
export const generatePollJoinedVerifyingKeySignature = (stateTreeDepth: number): bigint =>
  BigInt(stateTreeDepth) << 128n;

/**
 * This function generates the signature of a ProcessMessage Verifying Key.
 * This can be used to check if a ProcessMessages' circuit verifying key is registered
 * in a smart contract that holds several verifying keys.
 * @param stateTreeDepth - The depth of the state tree.
 * @param voteOptionTreeDepth - The depth of the vote option tree.
 * @param batchSize - The size of the batch.
 * @returns Returns a signature for querying if a verifying key with the given parameters is already registered in the contract.
 */
export const generateProcessVerifyingKeySignature = (
  stateTreeDepth: number,
  voteOptionTreeDepth: number,
  batchSize: number,
): bigint => (BigInt(batchSize) << 128n) + (BigInt(stateTreeDepth) << 64n) + BigInt(voteOptionTreeDepth);

/**
 * This function generates the signature of a Tally Verifying Key.
 * This can be used to check if a VoteTally circuit verifying key is registered
 * in a smart contract that holds several verifying keys.
 * @param _stateTreeDepth - The depth of the state tree.
 * @param _intStateTreeDepth - The depth of the intermediate state tree.
 * @param _voteOptionTreeDepth - The depth of the vote option tree.
 * @returns Returns a signature for querying if a verifying key with
 * the given parameters is already registered in the contract.
 */
export const generateTallyVerifyingKeySignature = (
  _stateTreeDepth: number,
  _intStateTreeDepth: number,
  _voteOptionTreeDepth: number,
): bigint => (BigInt(_stateTreeDepth) << 128n) + (BigInt(_intStateTreeDepth) << 64n) + BigInt(_voteOptionTreeDepth);
