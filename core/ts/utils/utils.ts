import assert from "assert";

interface TreeDepths {
  intStateTreeDepth: number;
  messageTreeDepth: number;
  messageTreeSubDepth: number;
  voteOptionTreeDepth: number;
}

interface BatchSizes {
  tallyBatchSize: number;
  subsidyBatchSize: number;
  messageBatchSize: number;
}

interface MaxValues {
  maxMessages: number;
  maxVoteOptions: number;
}

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

const genTallyVkSig = (_stateTreeDepth: number, _intStateTreeDepth: number, _voteOptionTreeDepth: number): bigint => {
  return (
    (BigInt(_stateTreeDepth) << BigInt(128)) + (BigInt(_intStateTreeDepth) << BigInt(64)) + BigInt(_voteOptionTreeDepth)
  );
};

const genSubsidyVkSig = (_stateTreeDepth: number, _intStateTreeDepth: number, _voteOptionTreeDepth: number): bigint => {
  return (
    (BigInt(_stateTreeDepth) << BigInt(128)) + (BigInt(_intStateTreeDepth) << BigInt(64)) + BigInt(_voteOptionTreeDepth)
  );
};

// moved awway from core/ts/macistate.ts

const packProcessMessageSmallVals = (
  maxVoteOptions: bigint,
  numUsers: bigint,
  batchStartIndex: number,
  batchEndIndex: number,
) => {
  const packedVals =
    // Note: the << operator has lower precedence than +
    BigInt(`${maxVoteOptions}`) +
    (BigInt(`${numUsers}`) << BigInt(50)) +
    (BigInt(batchStartIndex) << BigInt(100)) +
    (BigInt(batchEndIndex) << BigInt(150));

  return packedVals;
};

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

const packTallyVotesSmallVals = (batchStartIndex: number, batchSize: number, numSignUps: number) => {
  // Note: the << operator has lower precedence than +
  const packedVals = BigInt(batchStartIndex) / BigInt(batchSize) + (BigInt(numSignUps) << BigInt(50));

  return packedVals;
};

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
