/* eslint-disable no-console */
import { PrivKey, Keypair } from "@maci-protocol/domainobjs";
import { task, types } from "hardhat/config";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { info, success, logGreen, logYellow, logRed } from "../../ts/logger";
import { IPollFlowTaskArgs } from "../helpers/types";

/**
 * Task to execute a complete MACI poll flow from deployment to proof verification.
 * This runs all required steps in sequence for testing purposes.
 */
task("poll-flow", "Execute complete MACI poll flow (deploy, signup, join, vote, merge, prove)")
  .addParam("privkey", "The user's private key", undefined, types.string)
  .addParam("voteOptionIndex", "The vote option index to vote for", undefined, types.int)
  .addParam("voteWeight", "The weight of the vote", undefined, types.int)
  .addOptionalParam("pollParams", "Poll parameters JSON file path", undefined, types.string)
  .setAction(async (args: IPollFlowTaskArgs, hre: HardhatRuntimeEnvironment): Promise<void> => {
    logYellow({ text: info("Starting complete MACI poll flow...") });

    try {
      // 1. First, deploy full MACI environment if not already deployed
      await hre.run("deploy-full");

      // 2. Deploy a poll
      await hre.run("deploy-poll");

      // Get the poll ID (should be 0 for the first poll)
      const pollId = 0;

      // 3. Signup the user
      const userPrivKey = args.privkey;
      const privKey = PrivKey.deserialize(userPrivKey);

      // Convert private key to public key and get proper format
      const keypair = new Keypair(privKey);
      const pubKeyStr = keypair.pubKey.serialize();

      // Properly type the result from signup
      const signupResult = (await hre.run("signup", {
        pubkey: pubKeyStr,
      })) as { stateIndex: number };

      const { stateIndex } = signupResult;

      // 4. Join the poll
      await hre.run("joinPoll", {
        privKey: userPrivKey,
        stateIndex,
        pollId,
      });

      // 5. Vote in the poll
      await hre.run("vote", {
        pollId,
        privkey: userPrivKey,
        stateIndex,
        voteOptionIndex: args.voteOptionIndex,
        voteWeight: args.voteWeight,
        nonce: 1,
      });

      // 6. Process signups (merge)
      await hre.run("merge", { pollId });

      // 7. Time travel past the poll end time
      // (assuming default poll duration is 1 day, we add a bit more to be safe)
      await hre.run("timeTravel", { seconds: 90000 });

      // 8. Generate proofs
      await hre.run("prove", { pollId });

      // 9. Submit proofs on-chain
      await hre.run("submitOnChain", { pollId });

      logGreen({ text: success("Complete MACI poll flow executed successfully!") });
    } catch (error) {
      logRed({ text: `Error executing poll flow: ${(error as Error).message}` });
      throw error;
    }
  });
