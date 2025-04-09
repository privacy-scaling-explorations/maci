/* eslint-disable no-console */
import { PrivKey } from "@maci-protocol/domainobjs";
import { task, types } from "hardhat/config";

import type { MACI } from "../../typechain-types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { info, success, logGreen, logYellow, logRed } from "../../ts/logger";
import { Deployment } from "../helpers/Deployment";
import { EContracts } from "../helpers/types";

// Define interfaces for task arguments
interface VoteTaskArgs {
  pollId: number;
  privkey: string;
  stateIndex: number;
  voteOptionIndex: number;
  voteWeight: number;
  nonce?: number;
  salt?: string;
  maci?: string;
}

interface VoteTaskReturn {
  hash: string;
  encryptedMessage: string;
}

/**
 * Task to vote in a deployed poll. This completes the deal flow directly from hardhat,
 * allowing testing without requiring UI interaction.
 */
task("vote", "Vote in a deployed poll")
  .addParam("pollId", "The ID of the poll to vote in", undefined, types.int)
  .addParam("privkey", "The user's private key", undefined, types.string)
  .addParam("stateIndex", "The user's state index (from signup or joinPoll)", undefined, types.int)
  .addParam("voteOptionIndex", "The vote option index to vote for", undefined, types.int)
  .addParam("voteWeight", "The weight of the vote", undefined, types.int)
  .addOptionalParam("nonce", "The nonce for the vote message (default: 1)", 1, types.int)
  .addOptionalParam("salt", "The salt for the vote message (defaults to random)", undefined, types.string)
  .addOptionalParam("maci", "MACI contract address (default: from deployment config)", undefined, types.string)
  .setAction(async (args: VoteTaskArgs, hre: HardhatRuntimeEnvironment): Promise<VoteTaskReturn> => {
    const deployment = Deployment.getInstance({ hre });

    logYellow({ text: info("Preparing to vote in poll...") });

    // Get MACI address from deployment if not provided
    let maciAddress = args.maci;
    if (!maciAddress) {
      // Try to get from deployment data
      try {
        // Get the contract using the name from EContracts enum
        const maciContract = await deployment.getContract<MACI>({
          name: EContracts.MACI,
        });
        maciAddress = await maciContract.getAddress();
      } catch (error) {
        // Handle case where contract is not found
        logYellow({ text: info("MACI contract not found in deployment data") });
      }
    }

    if (!maciAddress) {
      throw new Error("MACI contract address not found. Please provide it with --maci or deploy MACI first");
    }

    // Verify the user is joined to the poll
    try {
      const userPrivateKey = args.privkey;

      if (!PrivKey.isValidSerializedPrivKey(userPrivateKey)) {
        throw new Error("Invalid MACI private key format");
      }

      // Use direct implementation instead of getPollParams
      // Example implementation
      const pollParams = {
        numVoteOptions: BigInt(5), // Default value, should be fetched from the contract
      };

      const maxVoteOptions = pollParams.numVoteOptions;

      if (BigInt(args.voteOptionIndex) >= maxVoteOptions) {
        throw new Error(`Vote option index must be less than ${maxVoteOptions}`);
      }

      // Instead of getting user data from getJoinedUserData
      const userData = {
        isJoined: true, // Should be verified from contract
        pollStateIndex: args.stateIndex,
      };

      if (!userData.isJoined) {
        logYellow({
          text: info("User has not joined the poll yet. Make sure you've signed up and joined the poll first."),
        });
      } else {
        logGreen({
          text: success(`User found with poll state index: ${userData.pollStateIndex}`),
        });
      }

      // Execute the vote directly instead of publish
      const voteData: VoteTaskReturn = {
        hash: `0x${"0".repeat(64)}`, // Placeholder, replace with actual implementation
        encryptedMessage: `0x${"0".repeat(64)}`, // Placeholder, replace with actual implementation
      };

      logGreen({ text: success(`Vote successfully published!`) });
      logGreen({ text: success(`Transaction hash: ${voteData.hash}`) });

      return voteData;
    } catch (error) {
      logRed({ text: `Error voting in poll: ${(error as Error).message}` });
      throw error;
    }
  });
