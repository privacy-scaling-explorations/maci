/* eslint-disable no-console */
import { Message, Keypair } from "maci-domainobjs";

import { MACI, Poll } from "../../typechain-types";

import { Deployment } from "./Deployment";
import { EContracts } from "./types";

/**
 * Utility function to send a batch of messages to a poll contract
 * @dev This function will attempt to send a batch of messages to a poll contract
 * and if it fails, it will attempt to send a smaller batch size
 * @param deployment - The deployment instance
 * @param message - The message to send
 * @param keypair - The keypair to sign the message with
 * @param batchSize - The number of messages to send
 */
export async function publishBatch(
  deployment: Deployment,
  message: Message,
  keypair: Keypair,
  batchSize: number,
): Promise<void> {
  // then try and publish a large batch of votes
  const maciContract = await deployment.getContract<MACI>({
    name: EContracts.MACI,
  });
  const lastPollId = (await maciContract.nextPollId()) - 1n;

  const pollContract = await deployment.getContract<Poll>({
    name: EContracts.Poll,
    key: `poll-${lastPollId}`,
  });

  const messageBatch = Array.from({ length: batchSize }, () => message.asContractParam());
  const pubKeyBatch = Array.from({ length: batchSize }, () => keypair.pubKey.asContractParam());

  let optimalBatchSize = batchSize;

  while (optimalBatchSize > 0) {
    const finalMessageBatch = messageBatch.slice(0, optimalBatchSize);
    const finalPubKeyBatch = pubKeyBatch.slice(0, optimalBatchSize);

    try {
      // eslint-disable-next-line no-await-in-loop
      const tx = await pollContract.publishMessageBatch(finalMessageBatch, finalPubKeyBatch);
      // eslint-disable-next-line no-await-in-loop
      const receipt = await tx.wait();
      console.log(`Successfully published batch of ${optimalBatchSize} messages`);
      console.log(`Gas used: ${receipt?.gasUsed.toString()} wei`);
      console.log(`Tx: ${tx.hash}`);
      break; // If successful, we've found the largest working batch size
    } catch (error) {
      // If this size doesn't work, reduce by 1 and try again
      optimalBatchSize -= 1;
    }
  }

  if (optimalBatchSize > 0) {
    console.log(`Found optimal batch size: ${optimalBatchSize}`);
  } else {
    console.error("Unable to publish even a single message");
  }
}
