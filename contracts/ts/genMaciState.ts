/* eslint-disable no-underscore-dangle */
import { type Provider } from "ethers";
import { MaciState, MESSAGE_TREE_ARITY, STATE_TREE_ARITY } from "maci-core";
import { type Keypair, PubKey, Message } from "maci-domainobjs";

import assert from "assert";

import type { Action } from "./types";

import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "../typechain-types";

import { sleep, sortActions } from "./utils";

/**
 * Generate a MaciState object from the events of a MACI and Poll smart contracts
 * @param provider - the ethereum provider
 * @param address - the address of the MACI contract
 * @param coordinatorKeypair - the keypair of the coordinator
 * @param pollId - the id of the poll for which we are fetching events
 * @param fromBlock - the block number from which to start fetching events
 * @param blocksPerRequest - the number of blocks to fetch in each request
 * @param endBlock - the block number at which to stop fetching events
 * @param sleepAmount - the amount of time to sleep between each request
 * @returns an instance of MaciState
 */
export const genMaciStateFromContract = async (
  provider: Provider,
  address: string,
  coordinatorKeypair: Keypair,
  pollId: bigint,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock: number | undefined = undefined,
  sleepAmount: number | undefined = undefined,
): Promise<MaciState> => {
  // ensure the pollId is valid
  assert(pollId >= 0);

  const maciContract = MACIFactory.connect(address, provider);

  // Check stateTreeDepth
  const stateTreeDepth = await maciContract.stateTreeDepth();

  // we need to pass the stateTreeDepth
  const maciState = new MaciState(Number(stateTreeDepth));
  // ensure it is set correctly
  assert(stateTreeDepth === BigInt(maciState.stateTreeDepth));

  // if no last block is set then we fetch until the current block number
  const lastBlock = endBlock || (await provider.getBlockNumber());

  const actions: Action[] = [];
  const foundPollIds = new Set<number>();
  const pollContractAddresses = new Map<bigint, string>();

  // Fetch event logs in batches (lastBlock inclusive)
  for (let i = fromBlock; i <= lastBlock; i += blocksPerRequest + 1) {
    // the last block batch will be either current iteration block + blockPerRequest
    // or the end block if it is set
    const toBlock = i + blocksPerRequest >= lastBlock ? lastBlock : i + blocksPerRequest;

    const [signUpLogs, deployPollLogs] =
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([
        maciContract.queryFilter(maciContract.filters.SignUp(), i, toBlock),
        maciContract.queryFilter(maciContract.filters.DeployPoll(), i, toBlock),
      ]);

    signUpLogs.forEach((event) => {
      assert(!!event);

      actions.push({
        type: "SignUp",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: {
          stateIndex: Number(event.args._stateIndex),
          pubKey: new PubKey([BigInt(event.args._userPubKeyX), BigInt(event.args._userPubKeyY)]),
          voiceCreditBalance: Number(event.args._voiceCreditBalance),
          timestamp: Number(event.args._timestamp),
        },
      });
    });

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < deployPollLogs.length; j += 1) {
      const event = deployPollLogs[j];
      assert(!!event);

      const id = event.args._pollId;

      const pubKey = new PubKey([BigInt(event.args._coordinatorPubKeyX), BigInt(event.args._coordinatorPubKeyY)]);
      // eslint-disable-next-line no-await-in-loop
      const pollContracts = await maciContract.getPoll(id);

      actions.push({
        type: "DeployPoll",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: { pollId: id, pollAddr: pollContracts.poll, pubKey },
      });

      foundPollIds.add(Number(id));
      pollContractAddresses.set(BigInt(id), pollContracts.poll);
    }

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  // Check whether each pollId exists
  assert(foundPollIds.has(Number(pollId)), "Error: the specified pollId does not exist on-chain");

  const pollContractAddress = pollContractAddresses.get(pollId)!;
  const pollContract = PollFactory.connect(pollContractAddress, provider);

  const [coordinatorPubKeyHashOnChain, [deployTime, duration], onChainTreeDepths] = await Promise.all([
    pollContract.coordinatorPubKeyHash(),
    pollContract.getDeployTimeAndDuration().then((values) => values.map(Number)),
    pollContract.treeDepths(),
  ]);

  assert(coordinatorKeypair.pubKey.hash().toString() === coordinatorPubKeyHashOnChain.toString());

  const treeDepths = {
    intStateTreeDepth: Number(onChainTreeDepths.intStateTreeDepth),
    messageTreeDepth: Number(onChainTreeDepths.messageTreeDepth),
    messageTreeSubDepth: Number(onChainTreeDepths.messageTreeSubDepth),
    voteOptionTreeDepth: Number(onChainTreeDepths.voteOptionTreeDepth),
  };

  const batchSizes = {
    tallyBatchSize: STATE_TREE_ARITY ** Number(onChainTreeDepths.intStateTreeDepth),
    messageBatchSize: MESSAGE_TREE_ARITY ** Number(onChainTreeDepths.messageTreeSubDepth),
  };

  // fetch poll contract logs
  for (let i = fromBlock; i <= lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? lastBlock : i + blocksPerRequest;

    const [
      publishMessageLogs,
      mergeMessageAqLogs,
      // eslint-disable-next-line no-await-in-loop
    ] = await Promise.all([
      pollContract.queryFilter(pollContract.filters.PublishMessage(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.MergeMessageAq(), i, toBlock),
    ]);

    publishMessageLogs.forEach((event) => {
      assert(!!event);

      const message = new Message(event.args._message[0].map((x) => BigInt(x)));

      const encPubKey = new PubKey(event.args._encPubKey.map((x) => BigInt(x.toString())) as [bigint, bigint]);

      actions.push({
        type: "PublishMessage",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: {
          message,
          encPubKey,
        },
      });
    });

    mergeMessageAqLogs.forEach((event) => {
      assert(!!event);

      const messageRoot = BigInt((event.args as unknown as { _messageRoot: string })._messageRoot);
      actions.push({
        type: "MergeMessageAq",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: { messageRoot },
      });
    });

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  // Reconstruct MaciState in order
  sortActions(actions).forEach((action) => {
    switch (true) {
      case action.type === "SignUp": {
        const { pubKey, voiceCreditBalance, timestamp } = action.data;

        maciState.signUp(pubKey!, BigInt(voiceCreditBalance!), BigInt(timestamp!));
        break;
      }

      case action.type === "DeployPoll" && action.data.pollId?.toString() === pollId.toString(): {
        maciState.deployPoll(
          BigInt(deployTime + duration),
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
        maciState.polls.get(pollId)?.publishMessage(message!, encPubKey!);
        break;
      }

      // ensure that the message root is correct (i.e. all messages have been published offchain)
      case action.type === "MergeMessageAq": {
        assert(maciState.polls.get(pollId)?.messageTree.root.toString() === action.data.messageRoot?.toString());
        break;
      }

      default:
        break;
    }
  });

  // Set numSignUps
  const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages();

  const poll = maciState.polls.get(pollId);

  // ensure all messages were recorded
  assert(Number(numSignUpsAndMessages[1]) === poll?.messages.length);
  // set the number of signups
  poll.updatePoll(numSignUpsAndMessages[0]);

  // we need to ensure that the stateRoot is correct
  assert(poll.stateTree?.root.toString() === (await pollContract.mergedStateRoot()).toString());

  maciState.polls.set(pollId, poll);

  return maciState;
};
