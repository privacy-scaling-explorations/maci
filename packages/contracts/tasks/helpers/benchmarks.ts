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

  let low = 1;
  let high = batchSize;
  let optimalBatchSize = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testMessageBatch = messageBatch.slice(0, mid);
    const testPubKeyBatch = pubKeyBatch.slice(0, mid);

    try {
      // eslint-disable-next-line no-await-in-loop
      await pollContract.publishMessageBatch.estimateGas(testMessageBatch, testPubKeyBatch);
      optimalBatchSize = mid;
      low = mid + 1;
    } catch (error) {
      high = mid - 1;
    }
  }

  if (optimalBatchSize > 0) {
    const finalMessageBatch = messageBatch.slice(0, optimalBatchSize);
    const finalPubKeyBatch = pubKeyBatch.slice(0, optimalBatchSize);

    try {
      const tx = await pollContract.publishMessageBatch(finalMessageBatch, finalPubKeyBatch);
      const receipt = await tx.wait();
      console.log(`Gas used: ${receipt?.gasUsed.toString()} wei\n`);
      console.log(`Tx: ${tx.hash}\n`);

      console.log(`Submitted a batch of ${optimalBatchSize} messages\n`);
    } catch (err) {
      console.error(`Failed to submit a batch of ${optimalBatchSize} messages\n`);
    }
  } else {
    console.error("Unable to submit even a single message\n");
  }
}
