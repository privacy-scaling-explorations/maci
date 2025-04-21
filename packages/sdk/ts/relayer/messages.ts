import type {
  IGetMessageBatchesArgs,
  IGetMessageBatchesData,
  IGetRelayedMessagesArgs,
  IGetRelayedMessagesData,
  IMessageBatch,
  IRelayMessagesArgs,
  IRelayMessagesData,
} from "./types";

import { getPollContracts } from "../poll/utils";

import { parseIpfsHashAddedEvents } from "./utils";

/**
 * Get relayed messages from Poll contract.
 *
 * @param args get relayed messages arguments
 * @returns relayed messages
 */
export const getRelayedMessages = async ({
  maciAddress,
  pollId,
  signer,
  provider,
  startBlock = 0,
  publicKeys,
  messageHashes,
}: IGetRelayedMessagesArgs): Promise<IGetRelayedMessagesData> => {
  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer, provider });

  const { messages } = await parseIpfsHashAddedEvents({
    pollContract,
    startBlock,
    publicKeys,
    messageHashes,
    provider,
  });

  return { messages };
};

/**
 * Get message batches from relayer service.
 *
 * @param args get message batches arguments
 * @returns message batches
 */
export const getMessageBatches = async ({
  url,
  limit,
  skip,
  ipfsHashes,
  maciContractAddress,
  poll,
  publicKeys,
  messageHashes,
}: IGetMessageBatchesArgs): Promise<IGetMessageBatchesData> => {
  const messageBatches = await fetch(`${url}/v1/messageBatches/get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit,
      skip,
      ipfsHashes,
      poll,
      maciContractAddress,
      messageHashes,
      publicKeys,
    }),
  })
    .then((res) => res.json())
    .then((res) => res as IMessageBatch[]);

  return { messageBatches };
};

/**
 * Relay IPFS messages to Poll contract.
 *
 * @param args relay messages arguments
 * @returns transaction hash
 */
export const relayMessages = async ({
  maciAddress,
  pollId,
  ipfsHash,
  messages,
  signer,
  provider,
}: IRelayMessagesArgs): Promise<IRelayMessagesData> => {
  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer, provider });

  const messageHashes = await Promise.all(
    messages.map(({ data, publicKey }) =>
      pollContract.hashMessageAndPublicKey({ data }, { x: publicKey[0], y: publicKey[1] }),
    ),
  );

  const receipt = await pollContract.relayMessagesBatch(messageHashes, ipfsHash).then((tx) => tx.wait());

  return {
    hash: receipt?.hash,
  };
};
