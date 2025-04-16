import { type IIpfsMessage, IpfsService } from "@maci-protocol/contracts";
import { PublicKey } from "@maci-protocol/domainobjs";

import type { IParseIpfsHashAddedEventsArgs } from "./types";

import { BLOCKS_STEP } from "../utils/constants";

/**
 * Parse the ipfs hash events from the Poll contract
 *
 * @param args parsing params
 * @returns ipfs messages
 */
export const parseIpfsHashAddedEvents = async ({
  pollContract,
  startBlock,
  provider,
  publicKeys,
  messageHashes,
}: IParseIpfsHashAddedEventsArgs): Promise<{ messages: IIpfsMessage[] }> => {
  const ipfsService = IpfsService.getInstance();
  const currentBlock = await provider.getBlockNumber();
  const ipfsHashes: string[] = [];

  for (let block = startBlock; block <= currentBlock; block += BLOCKS_STEP) {
    const toBlock = Math.min(block + BLOCKS_STEP - 1, currentBlock);
    // eslint-disable-next-line no-await-in-loop
    const events = await pollContract.queryFilter(pollContract.filters.IpfsHashAdded(), block, toBlock);

    // eslint-disable-next-line no-underscore-dangle
    ipfsHashes.push(...events.map((event) => event.args._ipfsHash));
  }

  const messages = await Promise.all(ipfsHashes.map((ipfsHash) => ipfsService.read<IIpfsMessage[]>(ipfsHash))).then(
    (data) =>
      data.reduce((acc, items) => {
        acc?.push(
          ...(items || [])
            .filter((message) =>
              publicKeys && publicKeys.length > 0
                ? publicKeys.some((publicKey) =>
                    PublicKey.deserialize(publicKey).equals(
                      new PublicKey([BigInt(message.publicKey[0]), BigInt(message.publicKey[1])]),
                    ),
                  )
                : true,
            )
            .filter((message) =>
              messageHashes && messageHashes.length > 0 ? messageHashes.some((hash) => message.hash === hash) : true,
            ),
        );

        return acc ?? [];
      }, []),
  );

  return {
    messages: messages ?? [],
  };
};
