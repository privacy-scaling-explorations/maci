/* eslint-disable no-underscore-dangle */
import { Provider, Interface, Log, BaseContract } from "ethers";
import { MaciState } from "maci-core";
import { Keypair, PubKey, Message } from "maci-domainobjs";

import assert from "assert";

import { MACI, Poll } from "../typechain-types";

import { parseArtifact } from "./deploy";
import { sleep } from "./utils";

interface Action {
  type: string;
  data: Partial<{
    pubKey: PubKey;
    encPubKey: PubKey;
    message: Message;
    voiceCreditBalance: number;
    timestamp: number;
    stateIndex: number;
    numSrQueueOps: number;
    pollId: number;
    pollAddr: string;
    stateRoot: bigint;
    messageRoot: bigint;
  }>;
  blockNumber: number;
  transactionIndex: number;
}

const genMaciStateFromContract = async (
  provider: Provider,
  address: string,
  coordinatorKeypair: Keypair,
  pollId: number,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock: number | undefined = undefined,
  sleepAmount: number | undefined = undefined,
): Promise<MaciState> => {
  // Verify and sort pollIds
  assert(pollId >= 0);

  const [pollContractAbi] = parseArtifact("Poll");
  const [maciContractAbi] = parseArtifact("MACI");

  const maciContract = new BaseContract(address, maciContractAbi, provider) as MACI;

  const maciIface = new Interface(maciContractAbi);
  const pollIface = new Interface(pollContractAbi);

  // Check stateTreeDepth
  const stateTreeDepth = await maciContract.stateTreeDepth();

  // we need to pass the stateTreeDepth
  const maciState = new MaciState(Number(stateTreeDepth));

  assert(stateTreeDepth === BigInt(maciState.stateTreeDepth));

  let signUpLogs: Log[] = [];
  let deployPollLogs: Log[] = [];

  const lastBlock = endBlock || (await provider.getBlockNumber());

  // Fetch event logs in batches
  for (let i = fromBlock; i < lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? undefined : i + blocksPerRequest;

    const [tmpSignUpLogs, tmpDeployPollLogs] =
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([
        maciContract.queryFilter(maciContract.filters.SignUp(), i, toBlock),
        maciContract.queryFilter(maciContract.filters.DeployPoll(), i, toBlock),
      ]);

    signUpLogs = signUpLogs.concat(tmpSignUpLogs);
    deployPollLogs = deployPollLogs.concat(tmpDeployPollLogs);

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  let actions: Action[] = [];

  signUpLogs.forEach((log) => {
    assert(!!log);
    const mutableLog = { ...log, topics: [...log.topics] };
    const event = maciIface.parseLog(mutableLog) as unknown as {
      args: { _stateIndex: number; _userPubKey: string[]; _voiceCreditBalance: number; _timestamp: number };
    };

    actions.push({
      type: "SignUp",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        stateIndex: Number(event.args._stateIndex),
        pubKey: new PubKey(event.args._userPubKey.map((x) => BigInt(x))),
        voiceCreditBalance: Number(event.args._voiceCreditBalance),
        timestamp: Number(event.args._timestamp),
      },
    });
  });

  let index = 0;
  const foundPollIds: number[] = [];
  const pollContractAddresses: string[] = [];

  deployPollLogs.forEach((log) => {
    assert(!!log);
    const mutableLogs = { ...log, topics: [...log.topics] };
    const event = maciIface.parseLog(mutableLogs) as unknown as {
      args: { _pubKey: string[]; _pollAddr: string; _pollId: number };
    };

    const pubKey = new PubKey(event.args._pubKey.map((x) => BigInt(x.toString())));

    const p = Number(event.args._pollId);
    assert(p === index);

    const pollAddr = event.args._pollAddr;
    actions.push({
      type: "DeployPoll",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: { pollId: p, pollAddr, pubKey },
    });

    foundPollIds.push(Number(p));
    pollContractAddresses.push(pollAddr);
    index += 1;
  });

  // Check whether each pollId exists
  assert(foundPollIds.includes(Number(pollId)), "Error: the specified pollId does not exist on-chain");

  const pollContractAddress = pollContractAddresses[pollId];
  const pollContract = new BaseContract(pollContractAddress, pollContractAbi, provider) as Poll;

  const coordinatorPubKeyOnChain = await pollContract.coordinatorPubKey();
  assert(coordinatorPubKeyOnChain[0].toString() === coordinatorKeypair.pubKey.rawPubKey[0].toString());
  assert(coordinatorPubKeyOnChain[1].toString() === coordinatorKeypair.pubKey.rawPubKey[1].toString());

  const dd = await pollContract.getDeployTimeAndDuration();
  const deployTime = Number(dd[0]);
  const duration = Number(dd[1]);
  const onChainMaxValues = await pollContract.maxValues();
  const onChainTreeDepths = await pollContract.treeDepths();
  const onChainBatchSizes = await pollContract.batchSizes();

  const maxValues = {
    maxMessages: Number(onChainMaxValues.maxMessages),
    maxVoteOptions: Number(onChainMaxValues.maxVoteOptions),
  };
  const treeDepths = {
    intStateTreeDepth: Number(onChainTreeDepths.intStateTreeDepth),
    messageTreeDepth: Number(onChainTreeDepths.messageTreeDepth),
    messageTreeSubDepth: Number(onChainTreeDepths.messageTreeSubDepth),
    voteOptionTreeDepth: Number(onChainTreeDepths.voteOptionTreeDepth),
  };
  const batchSizes = {
    tallyBatchSize: Number(onChainBatchSizes.tallyBatchSize),
    subsidyBatchSize: Number(onChainBatchSizes.subsidyBatchSize),
    messageBatchSize: Number(onChainBatchSizes.messageBatchSize),
  };

  // fetch poll contract logs
  let publishMessageLogs: Log[] = [];
  let topupLogs: Log[] = [];
  let mergeMaciStateAqSubRootsLogs: Log[] = [];
  let mergeMaciStateAqLogs: Log[] = [];
  let mergeMessageAqSubRootsLogs: Log[] = [];
  let mergeMessageAqLogs: Log[] = [];

  for (let i = fromBlock; i < lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? undefined : i + blocksPerRequest;

    const [
      tmpPublishMessageLogs,
      tmpTopupLogs,
      tmpMergeMaciStateAqSubRootsLogs,
      tmpMergeMaciStateAqLogs,
      tmpMergeMessageAqSubRootsLogs,
      tmpMergeMessageAqLogs,
      // eslint-disable-next-line no-await-in-loop
    ] = await Promise.all([
      pollContract.queryFilter(pollContract.filters.PublishMessage(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.TopupMessage(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.MergeMaciStateAqSubRoots(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.MergeMaciStateAq(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.MergeMessageAqSubRoots(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.MergeMessageAq(), i, toBlock),
    ]);

    publishMessageLogs = publishMessageLogs.concat(tmpPublishMessageLogs);
    topupLogs = topupLogs.concat(tmpTopupLogs);
    mergeMaciStateAqSubRootsLogs = mergeMaciStateAqSubRootsLogs.concat(tmpMergeMaciStateAqSubRootsLogs);
    mergeMaciStateAqLogs = mergeMaciStateAqLogs.concat(tmpMergeMaciStateAqLogs);
    mergeMessageAqSubRootsLogs = mergeMessageAqSubRootsLogs.concat(tmpMergeMessageAqSubRootsLogs);
    mergeMessageAqLogs = mergeMessageAqLogs.concat(tmpMergeMessageAqLogs);

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  publishMessageLogs.forEach((log) => {
    assert(!!log);
    const mutableLogs = { ...log, topics: [...log.topics] };
    const event = pollIface.parseLog(mutableLogs) as unknown as {
      args: { _message: [string, string[]]; _encPubKey: string[] };
    };

    const message = new Message(
      BigInt(event.args._message[0]),

      event.args._message[1].map((x) => BigInt(x)),
    );

    const encPubKey = new PubKey(event.args._encPubKey.map((x) => BigInt(x.toString())));

    actions.push({
      type: "PublishMessage",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        message,
        encPubKey,
      },
    });
  });

  topupLogs.forEach((log) => {
    assert(!!log);
    const mutableLog = { ...log, topics: [...log.topics] };
    const event = pollIface.parseLog(mutableLog) as unknown as {
      args: { _message: [string, string[]] };
    };
    const message = new Message(
      BigInt(event.args._message[0]),
      event.args._message[1].map((x) => BigInt(x)),
    );

    actions.push({
      type: "TopupMessage",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        message,
      },
    });
  });

  mergeMessageAqSubRootsLogs.forEach((log) => {
    assert(!!log);
    const mutableLogs = { ...log, topics: [...log.topics] };
    const event = pollIface.parseLog(mutableLogs) as unknown as { args: { _numSrQueueOps: string } };

    const numSrQueueOps = Number(event.args._numSrQueueOps);
    actions.push({
      type: "MergeMessageAqSubRoots",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        numSrQueueOps,
      },
    });
  });

  mergeMessageAqLogs.forEach((log) => {
    assert(!!log);
    const mutableLogs = { ...log, topics: [...log.topics] };
    const event = pollIface.parseLog(mutableLogs);

    const messageRoot = BigInt((event?.args as unknown as { _messageRoot: string })._messageRoot);
    actions.push({
      type: "MergeMessageAq",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: { messageRoot },
    });
  });

  // Sort actions
  actions = sortActions(actions);

  // Reconstruct MaciState in order

  actions.forEach((action) => {
    switch (true) {
      case action.type === "SignUp": {
        const { pubKey, voiceCreditBalance, timestamp } = action.data;

        maciState.signUp(pubKey!, BigInt(voiceCreditBalance!), BigInt(timestamp!));
        break;
      }

      case action.type === "DeployPoll" && action.data.pollId?.toString() === pollId.toString(): {
        maciState.deployPoll(
          duration,
          BigInt(deployTime + duration),
          maxValues,
          treeDepths,
          batchSizes.messageBatchSize,
          coordinatorKeypair,
        );
        break;
      }

      case action.type === "DeployPoll" && action.data.pollId?.toString() !== pollId.toString(): {
        maciState.deployNullPoll();
        break;
      }

      case action.type === "PublishMessage": {
        const { encPubKey, message } = action.data;
        maciState.polls[pollId]?.publishMessage(message!, encPubKey!);
        break;
      }

      case action.type === "TopupMessage": {
        const { message } = action.data;
        maciState.polls[pollId]?.topupMessage(message!);
        break;
      }

      case action.type === "MergeMessageAq": {
        assert(maciState.polls[pollId]?.messageTree.root.toString() === action.data.messageRoot?.toString());
        break;
      }

      default:
        break;
    }
  });

  // Set numSignUps
  const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages();

  const poll = maciState.polls[pollId];
  assert(Number(numSignUpsAndMessages[1]) === poll.messages.length);

  poll.numSignUps = Number(numSignUpsAndMessages[0]);
  maciState.polls[pollId] = poll;

  return maciState;
};

/*
 * The comparision function for Actions based on block number and transaction
 * index.
 */
function sortActions(actions: Action[]): Action[] {
  return actions.slice().sort((a, b) => {
    if (a.blockNumber > b.blockNumber) {
      return 1;
    }

    if (a.blockNumber < b.blockNumber) {
      return -1;
    }

    if (a.transactionIndex > b.transactionIndex) {
      return 1;
    }

    if (a.transactionIndex < b.transactionIndex) {
      return -1;
    }

    return 0;
  });
}

export { genMaciStateFromContract };
