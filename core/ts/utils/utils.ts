import assert from "assert";

/**
 * This interface defines the tree depths.
 * @property intStateTreeDepth - The depth of the intermediate state tree.
 * @property messageTreeDepth - The depth of the message tree.
 * @property messageTreeSubDepth - The depth of the message tree sub.
 * @property voteOptionTreeDepth - The depth of the vote option tree.
 */
interface TreeDepths {
  intStateTreeDepth: number;
  messageTreeDepth: number;
  messageTreeSubDepth: number;
  voteOptionTreeDepth: number;
}

/**
 * This interface defines the batch sizes.
 * @property tallyBatchSize - The size of the tally batch.
 * @property messageBatchSize - The size of the message batch.
 * @property subsidyBatchSize - The size of the subsidy batch.
 */
interface BatchSizes {
  tallyBatchSize: number;
  messageBatchSize: number;
  subsidyBatchSize: number;
}

/**
 * This interface defines the maximum values that the circuit can handle.
 * @property maxMessages - The maximum number of messages.
 * @property maxVoteOptions - The maximum number of vote options.
 */
interface MaxValues {
  maxMessages: number;
  maxVoteOptions: number;
}

/**
 * This function generates the signature of a ProcessMessage Verifying Key(VK).
 * This can be used to check if a ProcessMessages' circuit VK is registered
 * in a smart contract that holds several VKs.
 * @param _stateTreeDepth - The depth of the state tree.
 * @param _messageTreeDepth - The depth of the message tree.
 * @param _voteOptionTreeDepth - The depth of the vote option tree.
 * @param _batchSize - The size of the batch.
 * @returns Returns a signature for querying if a verifying key with the given parameters is already registered in the contract.
 */
const genProcessVkSig = (
  _stateTreeDepth: number,
  _messageTreeDepth: number,
  _voteOptionTreeDepth: number,
  _batchSize: number,
): bigint => {
  return (
    (BigInt(_batchSize) << BigInt(192)) +
    (BigInt(_stateTreeDepth) << BigInt(128)) +
    (BigInt(_messageTreeDepth) << BigInt(64)) +
    BigInt(_voteOptionTreeDepth)
  );
};

/**
 * This function generates the signature of a Tally Verifying Key(VK).
 * This can be used to check if a TallyVotes' circuit VK is registered
 * in a smart contract that holds several VKs.
 * @param _stateTreeDepth - The depth of the state tree.
 * @param _intStateTreeDepth - The depth of the intermediate state tree.
 * @param _voteOptionTreeDepth - The depth of the vote option tree.
 * @returns Returns a signature for querying if a verifying key with
 * the given parameters is already registered in the contract.
 */
const genTallyVkSig = (_stateTreeDepth: number, _intStateTreeDepth: number, _voteOptionTreeDepth: number): bigint => {
  return (
    (BigInt(_stateTreeDepth) << BigInt(128)) + (BigInt(_intStateTreeDepth) << BigInt(64)) + BigInt(_voteOptionTreeDepth)
  );
};

/**
 * This function generates the signature of a Subsidy Verifying Key(VK).
 * This can be used to check if a SubsidyCalculations' circuit VK is registered
 * in a smart contract that holds several VKs.
 * @param _stateTreeDepth - The depth of the state tree.
 * @param _intStateTreeDepth - The depth of the intermediate state tree.
 * @param _voteOptionTreeDepth - The depth of the vote option tree.
 * @returns Returns a signature for querying if a verifying key with
 * the given parameters is already registered in the contract.
 */
const genSubsidyVkSig = (_stateTreeDepth: number, _intStateTreeDepth: number, _voteOptionTreeDepth: number): bigint => {
  return (
    (BigInt(_stateTreeDepth) << BigInt(128)) + (BigInt(_intStateTreeDepth) << BigInt(64)) + BigInt(_voteOptionTreeDepth)
  );
};

/**
 * This function packs it's parameters into a single bigint.
 * @param maxVoteOptions - The maximum number of vote options.
 * @param numUsers - The number of users.
 * @param batchStartIndex - The start index of the batch.
 * @param batchEndIndex - The end index of the batch.
 * @returns Returns a single bigint that contains the packed values.
 */
const packProcessMessageSmallVals = (
  maxVoteOptions: bigint,
  numUsers: bigint,
  batchStartIndex: number,
  batchEndIndex: number,
): bigint => {
  const packedVals =
    // Note: the << operator has lower precedence than +
    BigInt(`${maxVoteOptions}`) +
    (BigInt(`${numUsers}`) << BigInt(50)) +
    (BigInt(batchStartIndex) << BigInt(100)) +
    (BigInt(batchEndIndex) << BigInt(150));

  return packedVals;
};

/**
 * This function unpacks partial values for the ProcessMessages circuit from a single bigint.
 * @param packedVals - The single bigint that contains the packed values.
 * @returns Returns an object that contains the unpacked values.
 */
const unpackProcessMessageSmallVals = (packedVals: bigint) => {
  let asBin = packedVals.toString(2);
  assert(asBin.length <= 200);
  while (asBin.length < 200) {
    asBin = "0" + asBin;
  }
  const maxVoteOptions = BigInt("0b" + asBin.slice(150, 200));
  const numUsers = BigInt("0b" + asBin.slice(100, 150));
  const batchStartIndex = BigInt("0b" + asBin.slice(50, 100));
  const batchEndIndex = BigInt("0b" + asBin.slice(0, 50));

  return {
    maxVoteOptions,
    numUsers,
    batchStartIndex,
    batchEndIndex,
  };
};

/**
 * This function packs it's parameters into a single bigint.
 * @param batchStartIndex - The start index of the batch.
 * @param batchSize - The size of the batch.
 * @param numSignUps - The number of sign ups.
 * @returns Returns a single bigint that contains the packed values.
 */
const packTallyVotesSmallVals = (batchStartIndex: number, batchSize: number, numSignUps: number): bigint => {
  // Note: the << operator has lower precedence than +
  const packedVals = BigInt(batchStartIndex) / BigInt(batchSize) + (BigInt(numSignUps) << BigInt(50));

  return packedVals;
};

/**
 * This function unpacks partial values for the TallyVotes circuit from a single bigint.
 * @param packedVals - The single bigint that contains the packed values.
 * @returns Returns an object that contains the unpacked values.
 */
const unpackTallyVotesSmallVals = (packedVals: bigint) => {
  let asBin = packedVals.toString(2);
  assert(asBin.length <= 100);
  while (asBin.length < 100) {
    asBin = "0" + asBin;
  }
  const numSignUps = BigInt("0b" + asBin.slice(0, 50));
  const batchStartIndex = BigInt("0b" + asBin.slice(50, 100));

  return { numSignUps, batchStartIndex };
};

/**
 * This function packs it's parameters into a single bigint.
 * @param row - The row.
 * @param col - The column.
 * @param numSignUps - The number of sign ups.
 * @returns Returns a single bigint that contains the packed values.
 */
const packSubsidySmallVals = (row: number, col: number, numSignUps: number) => {
  // Note: the << operator has lower precedence than +
  const packedVals = (BigInt(numSignUps) << BigInt(100)) + (BigInt(row) << BigInt(50)) + BigInt(col);

  return packedVals;
};

export {
  TreeDepths,
  MaxValues,
  BatchSizes,
  genProcessVkSig,
  genTallyVkSig,
  genSubsidyVkSig,
  packProcessMessageSmallVals,
  unpackProcessMessageSmallVals,
  packTallyVotesSmallVals,
  unpackTallyVotesSmallVals,
  packSubsidySmallVals,
};
