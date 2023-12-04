import { Keypair, PubKey, Message } from "maci-domainobjs";

import { parseArtifact } from "./index";

import { MaciState } from "maci-core";

import { Contract, providers, utils } from "ethers";
// import { assert } from 'assert'
import assert = require("assert");
import { sleep } from "./utils";

interface Action {
  type: string;
  data: any;
  blockNumber: number;
  transactionIndex: number;
}

const genMaciStateFromContract = async (
  provider: providers.Provider,
  address: string,
  coordinatorKeypair: Keypair,
  pollId: number,
  fromBlock: number = 0,
  blocksPerRequest: number = 50,
  endBlock?: number,
  sleepAmount?: number,
): Promise<MaciState> => {
  pollId = Number(pollId);
  // Verify and sort pollIds
  assert(pollId >= 0);

  const [pollContractAbi] = parseArtifact("Poll");
  const [maciContractAbi] = parseArtifact("MACI");

  const maciContract = new Contract(address, maciContractAbi, provider);

  const maciIface = new utils.Interface(maciContractAbi);
  const pollIface = new utils.Interface(pollContractAbi);

  // Check stateTreeDepth
  const stateTreeDepth = await maciContract.stateTreeDepth();

  // we need to pass the stateTreeDepth
  const maciState = new MaciState(stateTreeDepth);

  assert(stateTreeDepth === maciState.stateTreeDepth);

  let initLogs: any[] = [];
  let signUpLogs: any[] = [];
  let mergeStateAqSubRootsLogs: any[] = [];
  let mergeStateAqLogs: any[] = [];
  let deployPollLogs: any[] = [];

  const lastBlock = endBlock ? endBlock : await provider.getBlockNumber();

  // Fetch event logs in batches
  for (let i = fromBlock; i < lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? undefined : i + blocksPerRequest;

    const tmpInitLogs = await provider.getLogs({
      ...maciContract.filters.Init(),
      fromBlock: i,
      toBlock,
      address: address,
    });

    initLogs = initLogs.concat(tmpInitLogs);

    const tmpSignUpLogs = await provider.getLogs({
      ...maciContract.filters.SignUp(),
      fromBlock: i,
      toBlock,
      address: address,
    });
    signUpLogs = signUpLogs.concat(tmpSignUpLogs);

    const tmpMergeStateAqSubRootsLogs = await provider.getLogs({
      ...maciContract.filters.MergeStateAqSubRoots(),
      fromBlock: i,
      toBlock,
      address: address,
    });
    mergeStateAqSubRootsLogs = mergeStateAqSubRootsLogs.concat(tmpMergeStateAqSubRootsLogs);

    const tmpMergeStateAqLogs = await provider.getLogs({
      ...maciContract.filters.MergeStateAq(),
      fromBlock: i,
      toBlock,
      address: address,
    });
    mergeStateAqLogs = mergeStateAqLogs.concat(tmpMergeStateAqLogs);

    const tmpDeployPollLogs = await provider.getLogs({
      ...maciContract.filters.DeployPoll(),
      fromBlock: i,
      toBlock,
      address: address,
    });
    deployPollLogs = deployPollLogs.concat(tmpDeployPollLogs);

    if (sleepAmount) await sleep(sleepAmount);
  }

  // init() should only be called up to 1 time
  assert(initLogs.length <= 1, "More than 1 init() event detected which should not be possible");

  let vkRegistryAddress;

  for (const log of initLogs) {
    const mutableLog = {
      ...log,
      topics: [...log.topics],
    };
    const event = maciIface.parseLog(mutableLog);
    vkRegistryAddress = event.args._vkRegistry;
  }

  const actions: Action[] = [];

  for (const log of signUpLogs) {
    assert(log != undefined);
    const mutableLog = {
      ...log,
      topics: [...log.topics],
    };
    const event = maciIface.parseLog(mutableLog);
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
  }

  // TODO: consider removing MergeStateAqSubRoots and MergeStateAq as the
  // functions in Poll which call them already have their own events
  for (const log of mergeStateAqSubRootsLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = maciIface.parseLog(mutableLogs);
    const p = Number(event.args._pollId);

    actions.push({
      type: "MergeStateAqSubRoots",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        numSrQueueOps: Number(event.args._numSrQueueOps),
        pollId: p,
      },
    });
  }

  for (const log of mergeStateAqLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = maciIface.parseLog(mutableLogs);
    const p = Number(event.args._pollId);

    actions.push({
      type: "MergeStateAq",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        pollId: p,
      },
    });
  }

  let i = 0;
  const foundPollIds: number[] = [];
  const pollContractAddresses: string[] = [];
  for (const log of deployPollLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = maciIface.parseLog(mutableLogs);
    const pubKey = new PubKey(event.args._pubKey.map((x) => BigInt(x.toString())));

    const pollId = Number(event.args._pollId);
    assert(pollId === i);

    const pollAddr = event.args._pollAddr;
    actions.push({
      type: "DeployPoll",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: { pollId, pollAddr, pubKey },
    });

    foundPollIds.push(Number(pollId));
    pollContractAddresses.push(pollAddr);
    i++;
  }

  // Check whether each pollId exists
  assert(foundPollIds.indexOf(Number(pollId)) > -1, "Error: the specified pollId does not exist on-chain");

  const pollContractAddress = pollContractAddresses[pollId];
  const pollContract = new Contract(pollContractAddress, pollContractAbi, provider);

  const coordinatorPubKeyOnChain = await pollContract.coordinatorPubKey();
  assert(coordinatorPubKeyOnChain[0].toString() === coordinatorKeypair.pubKey.rawPubKey[0].toString());
  assert(coordinatorPubKeyOnChain[1].toString() === coordinatorKeypair.pubKey.rawPubKey[1].toString());

  const dd = await pollContract.getDeployTimeAndDuration();
  const deployTime = Number(dd[0]);
  const duration = Number(dd[1]);
  const onChainMaxValues = await pollContract.maxValues();
  const onChainTreeDepths = await pollContract.treeDepths();
  const onChainBatchSizes = await pollContract.batchSizes();

  assert(vkRegistryAddress === (await maciContract.vkRegistry()));

  const maxValues = {
    maxMessages: Number(onChainMaxValues.maxMessages.toNumber()),
    maxVoteOptions: Number(onChainMaxValues.maxVoteOptions.toNumber()),
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
  let publishMessageLogs: any[] = [];
  let topupLogs: any[] = [];
  let mergeMaciStateAqSubRootsLogs: any[] = [];
  let mergeMaciStateAqLogs: any[] = [];
  let mergeMessageAqSubRootsLogs: any[] = [];
  let mergeMessageAqLogs: any[] = [];

  for (let i = fromBlock; i < lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? undefined : i + blocksPerRequest;

    const tmpPublishMessageLogs = await provider.getLogs({
      ...pollContract.filters.PublishMessage(),
      fromBlock: i,
      toBlock,
    });
    publishMessageLogs = publishMessageLogs.concat(tmpPublishMessageLogs);

    const tmpTopupLogs = await provider.getLogs({
      ...pollContract.filters.TopupMessage(),
      fromBlock: i,
      toBlock,
      address: pollContract.address,
    });
    topupLogs = topupLogs.concat(tmpTopupLogs);

    const tmpMergeMaciStateAqSubRootsLogs = await provider.getLogs({
      ...pollContract.filters.MergeMaciStateAqSubRoots(),
      fromBlock: i,
      toBlock,
      address: pollContract.address,
    });
    mergeMaciStateAqSubRootsLogs = mergeMaciStateAqSubRootsLogs.concat(tmpMergeMaciStateAqSubRootsLogs);

    const tmpMergeMaciStateAqLogs = await provider.getLogs({
      ...pollContract.filters.MergeMaciStateAq(),
      fromBlock: i,
      toBlock,
      address: pollContract.address,
    });
    mergeMaciStateAqLogs = mergeMaciStateAqLogs.concat(tmpMergeMaciStateAqLogs);

    const tmpMergeMessageAqSubRootsLogs = await provider.getLogs({
      ...pollContract.filters.MergeMessageAqSubRoots(),
      fromBlock: i,
      toBlock,
      address: pollContract.address,
    });
    mergeMessageAqSubRootsLogs = mergeMessageAqSubRootsLogs.concat(tmpMergeMessageAqSubRootsLogs);

    const tmpMergeMessageAqLogs = await provider.getLogs({
      ...pollContract.filters.MergeMessageAq(),
      fromBlock: i,
      toBlock,
      address: pollContract.address,
    });
    mergeMessageAqLogs = mergeMessageAqLogs.concat(tmpMergeMessageAqLogs);

    if (sleepAmount) await sleep(sleepAmount);
  }

  for (const log of publishMessageLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = pollIface.parseLog(mutableLogs);

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
  }

  for (const log of topupLogs) {
    assert(log != undefined);
    const mutableLog = {
      ...log,
      topics: [...log.topics],
    };
    const event = pollIface.parseLog(mutableLog);
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
  }

  for (const log of mergeMaciStateAqSubRootsLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = pollIface.parseLog(mutableLogs);

    const numSrQueueOps = Number(event.args._numSrQueueOps);
    actions.push({
      type: "MergeMaciStateAqSubRoots",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        numSrQueueOps,
      },
    });
  }

  for (const log of mergeMaciStateAqLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };

    const event = pollIface.parseLog(mutableLogs);

    const stateRoot = BigInt(event.args._stateRoot);
    actions.push({
      type: "MergeMaciStateAq",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: { stateRoot },
    });
  }

  for (const log of mergeMessageAqSubRootsLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = pollIface.parseLog(mutableLogs);

    const numSrQueueOps = Number(event.args._numSrQueueOps);
    actions.push({
      type: "MergeMessageAqSubRoots",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: {
        numSrQueueOps,
      },
    });
  }

  for (const log of mergeMessageAqLogs) {
    assert(log != undefined);
    const mutableLogs = {
      ...log,
      topics: [...log.topics],
    };
    const event = pollIface.parseLog(mutableLogs);

    const messageRoot = BigInt(event.args._messageRoot);
    actions.push({
      type: "MergeMessageAq",
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      data: { messageRoot },
    });
  }

  // Sort actions
  sortActions(actions);

  // Reconstruct MaciState in order

  for (const action of actions) {
    if (action["type"] === "SignUp") {
      maciState.signUp(action.data.pubKey, action.data.voiceCreditBalance, action.data.timestamp);
    } else if (action["type"] === "DeployPoll") {
      if (action.data.pollId === pollId) {
        maciState.deployPoll(
          duration,
          BigInt(deployTime + duration),
          maxValues,
          treeDepths,
          batchSizes.messageBatchSize,
          coordinatorKeypair,
        );
      } else {
        maciState.deployNullPoll();
      }
    } else if (action["type"] === "PublishMessage") {
      maciState.polls[pollId].publishMessage(action.data.message, action.data.encPubKey);
    } else if (action["type"] === "TopupMessage") {
      maciState.polls[pollId].topupMessage(action.data.message);
    } else if (action["type"] === "MergeMessageAqSubRoots") {
      maciState.polls[pollId].messageAq.mergeSubRoots(action.data.numSrQueueOps);
    } else if (action["type"] === "MergeMessageAq") {
      maciState.polls[pollId].messageAq.merge(treeDepths.messageTreeDepth);
      const poll = maciState.polls[pollId];
      assert(poll.messageAq.mainRoots[treeDepths.messageTreeDepth] === action.data.messageRoot);
    }
  }

  // Set numSignUps
  const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages();

  const poll = maciState.polls[pollId];
  assert(Number(numSignUpsAndMessages[1]) === poll.messages.length);

  maciState.polls[pollId].numSignUps = Number(numSignUpsAndMessages[0]);

  return maciState;
};

/*
 * The comparision function for Actions based on block number and transaction
 * index.
 */
const sortActions = (actions: Action[]) => {
  actions.sort((a, b) => {
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
  return actions;
};

export { genMaciStateFromContract };
