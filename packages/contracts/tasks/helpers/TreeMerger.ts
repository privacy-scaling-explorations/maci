/* eslint-disable no-console */
import type { ITreeMergeParams } from "./types";
import type { Poll } from "../../typechain-types";
import type { Signer } from "ethers";

import { info, logGreen, logMagenta, success } from "../../ts/logger";

/**
 * @notice Tree merger keeps merging simple for hardhat task.
 * This class is using for merging signups and messages.
 */
export class TreeMerger {
  /**
   * Poll contract
   */
  private pollContract: Poll;

  /**
   * Ethers signer
   */
  private deployer: Signer;

  /**
   * Initialize class properties
   *
   * @param {ITreeMergeParams} params - contracts and signer
   */
  constructor({ deployer, pollContract }: ITreeMergeParams) {
    this.pollContract = pollContract;
    this.deployer = deployer;
  }

  /**
   * Check if voting period is over. Otherwise, throw an error.
   */
  async checkPollDuration(): Promise<void> {
    // check if it's time to merge the message AQ
    const deadline = await this.pollContract.endDate();

    const blockNumber = await this.deployer.provider!.getBlockNumber();
    const block = await this.deployer.provider!.getBlock(blockNumber);
    const now = Number(block?.timestamp);

    if (now < deadline) {
      throw new Error("Voting period is not over");
    }
  }

  /**
   * Merge user signup MACI state
   *
   * @param pollId - poll id
   */
  async mergeSignups(): Promise<void> {
    // check if the state tree has been fully merged
    const isMerged = await this.pollContract.stateMerged();

    if (!isMerged) {
      // go and merge the state tree
      logMagenta({ text: info("Merging subroots to a main state root...") });
      const receipt = await this.pollContract.mergeState().then((tx) => tx.wait());

      if (receipt?.status !== 1) {
        throw new Error("Error merging signup state subroots");
      }

      logGreen({ text: success(`Merge state transaction hash: ${receipt.hash}`) });
      logMagenta({ text: info(`Gas used: ${receipt.gasUsed.toString()}`) });
    } else {
      logMagenta({ text: info("The state tree has already been merged.") });
    }
  }
}
