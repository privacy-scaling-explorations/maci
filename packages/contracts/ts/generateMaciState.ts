/* eslint-disable no-underscore-dangle */
import { MaciState } from "@maci-protocol/core";
import { PublicKey, Message } from "@maci-protocol/domainobjs";

import assert from "assert";
import fs from "fs";
import path from "path";

import type { Action, IGenerateMaciStateFromContractArgs, IIpfsMessage } from "./types";

import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "../typechain-types";

import { IpfsService } from "./ipfs";
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
 * @param ipfsMessageBackupFiles - backup files for ipfs messages
 * @param logsOutputPath - the file path where to save the logs for debugging and auditing purposes
 * @returns an instance of MaciState
 */
export const generateMaciStateFromContract = async ({
  provider,
  address,
  coordinatorKeypair,
  pollId,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock,
  sleepAmount,
  ipfsMessageBackupFiles = [],
  logsOutputPath,
}: IGenerateMaciStateFromContractArgs): Promise<MaciState> => {
  // ensure the pollId is valid
  assert(pollId >= 0);

  const ipfsService = IpfsService.getInstance();
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

  const backupMessagesByIpfsHash = await extractBackupIpfsMessages(ipfsMessageBackupFiles);

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
          publicKey: new PublicKey([BigInt(event.args._userPublicKeyX), BigInt(event.args._userPublicKeyY)]),
          timestamp: Number(event.args._timestamp),
        },
      });
    });

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < deployPollLogs.length; j += 1) {
      const event = deployPollLogs[j];
      assert(!!event);

      const id = event.args._pollId;
      const pollMode = Number(event.args._mode);

      const publicKey = new PublicKey([
        BigInt(event.args._coordinatorPublicKeyX),
        BigInt(event.args._coordinatorPublicKeyY),
      ]);
      // eslint-disable-next-line no-await-in-loop
      const pollContracts = await maciContract.getPoll(id);

      actions.push({
        type: "DeployPoll",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: { pollId: id, pollAddresses: pollContracts.poll, publicKey, pollMode },
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

  const [coordinatorPublicKeyOnChain, pollEndTimestamp, onChainTreeDepths, messageBatchSizeOnChain] = await Promise.all(
    [
      pollContract.coordinatorPublicKey(),
      pollContract.endDate(),
      pollContract.treeDepths(),
      pollContract.messageBatchSize(),
    ],
  );

  assert(coordinatorPublicKeyOnChain[0].toString() === coordinatorKeypair.publicKey.raw[0].toString());
  assert(coordinatorPublicKeyOnChain[1].toString() === coordinatorKeypair.publicKey.raw[1].toString());

  const treeDepths = {
    tallyProcessingStateTreeDepth: Number(onChainTreeDepths.tallyProcessingStateTreeDepth),
    voteOptionTreeDepth: Number(onChainTreeDepths.voteOptionTreeDepth),
    stateTreeDepth: Number(onChainTreeDepths.stateTreeDepth),
  };

  const messageBatchSize = Number(messageBatchSizeOnChain);

  // fetch poll contract logs
  for (let i = fromBlock; i <= lastBlock; i += blocksPerRequest + 1) {
    const toBlock = i + blocksPerRequest >= lastBlock ? lastBlock : i + blocksPerRequest;

    // eslint-disable-next-line no-await-in-loop
    const [publishMessageLogs, joinPollLogs, ipfsHashAddedLogs] = await Promise.all([
      pollContract.queryFilter(pollContract.filters.PublishMessage(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.PollJoined(), i, toBlock),
      pollContract.queryFilter(pollContract.filters.IpfsHashAdded(), i, toBlock),
    ]);

    joinPollLogs.forEach((event) => {
      assert(!!event);

      const nullifier = BigInt(event.args._nullifier);

      const publicKeyX = BigInt(event.args._pollPublicKeyX);
      const publicKeyY = BigInt(event.args._pollPublicKeyY);

      const voiceCreditBalance = BigInt(event.args._voiceCreditBalance);

      actions.push({
        type: "PollJoined",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: {
          publicKey: new PublicKey([publicKeyX, publicKeyY]),
          newVoiceCreditBalance: voiceCreditBalance,
          nullifier,
        },
      });
    });

    // eslint-disable-next-line no-await-in-loop
    const ipfsMessages = await Promise.all(
      ipfsHashAddedLogs.map(async (event) => {
        assert(!!event);

        return ipfsService
          .read<IIpfsMessage[]>(event.args._ipfsHash)
          .then((data) => {
            const messages = data && data.length > 0 ? data : backupMessagesByIpfsHash.get(event.args._ipfsHash);

            if (!messages || messages.length === 0) {
              throw new Error(`invalid json for cid ${event.args._ipfsHash}`);
            }

            return messages;
          })
          .then((messages) => ({
            data: messages.map((value) => ({
              message: new Message(value.data.map(BigInt)),
              encryptionPublicKey: new PublicKey([BigInt(value.publicKey[0]), BigInt(value.publicKey[1])]),
            })),
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
          }));
      }),
    );

    ipfsHashAddedLogs.forEach((event) => {
      assert(!!event);
      const ipfsHash = event.args._ipfsHash;

      actions.push({
        type: "IpfsHashAdded",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: {
          ipfsHash,
        },
      });
    });

    ipfsMessages.forEach(({ data, blockNumber, transactionIndex }) => {
      data.forEach(({ message, encryptionPublicKey }) => {
        actions.push({
          type: "PublishMessage",
          blockNumber,
          transactionIndex,
          data: {
            message,
            encryptionPublicKey,
          },
        });
      });
    });

    publishMessageLogs.forEach((event) => {
      assert(!!event);

      const message = new Message(event.args._message[0].map((x) => BigInt(x)));

      const encryptionPublicKey = new PublicKey(
        event.args._encryptionPublicKey.map((x) => BigInt(x.toString())) as [bigint, bigint],
      );

      actions.push({
        type: "PublishMessage",
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        data: {
          message,
          encryptionPublicKey,
        },
      });
    });

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  const voteOptions = await pollContract.voteOptions();

  // Reconstruct MaciState in order
  sortActions(actions).forEach((action) => {
    switch (true) {
      case action.type === "SignUp": {
        const { publicKey } = action.data;

        maciState.signUp(publicKey!);
        break;
      }

      case action.type === "DeployPoll" && action.data.pollId?.toString() === pollId.toString(): {
        maciState.deployPoll(
          pollEndTimestamp,
          treeDepths,
          messageBatchSize,
          coordinatorKeypair,
          voteOptions,
          action.data.pollMode!,
        );
        break;
      }

      case action.type === "DeployPoll" && action.data.pollId?.toString() !== pollId.toString(): {
        maciState.deployNullPoll();
        break;
      }

      case action.type === "PublishMessage": {
        const { encryptionPublicKey, message } = action.data;
        maciState.polls.get(pollId)?.publishMessage(message!, encryptionPublicKey!);
        break;
      }

      case action.type === "PollJoined": {
        const { publicKey, newVoiceCreditBalance, nullifier } = action.data;
        maciState.polls.get(pollId)?.joinPoll(nullifier!, publicKey!, newVoiceCreditBalance!);
        break;
      }

      default:
        break;
    }
  });

  // Set totalSignups
  const totalSignupsAndMessages = await pollContract.totalSignupsAndMessages();

  const poll = maciState.polls.get(pollId);

  // ensure all messages were recorded
  assert(Number(totalSignupsAndMessages[1]) === poll?.messages.length);
  // set the number of signups
  poll.updatePoll(totalSignupsAndMessages[0]);

  maciState.polls.set(pollId, poll);

  // Save logs if output path is provided
  if (logsOutputPath) {
    const logsOutputDirectory = path.resolve(logsOutputPath);

    if (!fs.existsSync(logsOutputDirectory)) {
      await fs.promises.mkdir(logsOutputDirectory, { recursive: true });
    }

    const logs = {
      maciAddress: address,
      pollId: pollId.toString(),
      fromBlock,
      toBlock: lastBlock,
      timestamp: new Date().toISOString(),
      actions,
    };

    await fs.promises.writeFile(logsOutputPath, JSON.stringify(logs, null, 2));
  }

  return maciState;
};

async function extractBackupIpfsMessages(ipfsMessageBackupFiles: string[]): Promise<Map<string, IIpfsMessage[]>> {
  try {
    const data = await Promise.all(
      ipfsMessageBackupFiles.map((file) =>
        fs.promises
          .readFile(file, "utf-8")
          .then((res) => JSON.parse(res) as IIpfsMessage[])
          .then((messages) => ({ ipfsHash: path.parse(file).base.replace(".json", ""), messages })),
      ),
    );

    return data.reduce((acc, { ipfsHash, messages }) => {
      acc.set(ipfsHash, messages);

      return acc;
    }, new Map());
  } catch (error) {
    return new Map();
  }
}
