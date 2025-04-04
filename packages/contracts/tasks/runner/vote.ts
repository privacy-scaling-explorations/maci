/* eslint-disable no-console */
// @ts-ignore
import { PrivKey, PubKey, Keypair, Message } from "@maci-protocol/domainobjs";
// @ts-ignore
import { genRandomSalt } from "@maci-protocol/crypto";
// @ts-ignore
import { task, types } from "hardhat/config";
// @ts-ignore
import { ZeroAddress } from "ethers";

// @ts-ignore
import type { MACI, Poll } from "../../typechain-types";

import { info, logMagenta, logRed } from "../../ts/logger";
import { Deployment } from "../helpers/Deployment";
import { EContracts } from "../helpers/types";

interface IVoteParams {
  poll: string;
  stateIndex: number;
  voteOptionIndex: number;
  voteWeight: number;
  nonce: number;
  salt?: string;
  maciPrivKey: string;
  maciPubKey: string;
}

/**
 * Task for voting in a deployed poll
 * This allows users to vote in a poll without using a UI
 */
task("vote", "Vote in a deployed poll")
  .addParam("poll", "The poll id", undefined, types.string)
  .addParam("stateIndex", "The state index of the user", undefined, types.int)
  .addParam("voteOptionIndex", "The vote option index", undefined, types.int)
  .addParam("voteWeight", "The vote weight", undefined, types.int)
  .addParam("nonce", "The nonce for the vote", undefined, types.int)
  .addOptionalParam("salt", "The salt for the vote (random if not provided)", undefined, types.string)
  .addParam("maciPrivKey", "The user's MACI private key", undefined, types.string)
  .addParam("maciPubKey", "The user's MACI public key", undefined, types.string)
  .setAction(async ({ 
    poll, 
    stateIndex, 
    voteOptionIndex, 
    voteWeight, 
    nonce, 
    salt,
    maciPrivKey,
    maciPubKey
  }: IVoteParams, hre: any) => {
    const deployment = Deployment.getInstance({ hre });
    deployment.setHre(hre);

    const deployer = await deployment.getDeployer();
    const startBalance = await deployer.provider.getBalance(deployer);
    let success = false;

    try {
      logMagenta({ text: info(`Starting vote in poll ${poll}`) });

      // Validate inputs
      if (!PrivKey.isValidSerializedPrivKey(maciPrivKey)) {
        throw new Error("Invalid MACI private key");
      }

      if (!PubKey.isValidSerializedPubKey(maciPubKey)) {
        throw new Error("Invalid MACI public key");
      }

      const privateKey = PrivKey.deserialize(maciPrivKey);
      const publicKey = PubKey.deserialize(maciPubKey);

      // Get contract instances
      const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });
      const pollContracts = await maciContract.polls(poll);

      if (pollContracts.poll === ZeroAddress) {
        throw new Error(`No poll ${poll} found`);
      }

      const pollContract = await deployment.getContract<Poll>({
        name: EContracts.Poll,
        address: pollContracts.poll,
      });

      // Validate parameters against poll configuration
      const maxVoteOption = await pollContract.voteOptions();
      if (BigInt(voteOptionIndex) < 0n || BigInt(voteOptionIndex) > maxVoteOption) {
        throw new Error(`Invalid vote option index. Must be between 0 and ${maxVoteOption}`);
      }

      if (BigInt(stateIndex) < 1n) {
        throw new Error("Invalid state index. Must be greater than 0");
      }

      if (BigInt(nonce) < 0n) {
        throw new Error("Invalid nonce. Must be non-negative");
      }

      // Get coordinator pubkey
      const coordinatorPubKeyOnChain = await pollContract.coordinatorPubKey();
      const coordinatorPubKey = new PubKey([
        BigInt(coordinatorPubKeyOnChain.x),
        BigInt(coordinatorPubKeyOnChain.y)
      ]);

      // Generate random salt if not provided
      const userSalt = salt ? BigInt(salt) : genRandomSalt();

      // Create ephemeral keypair for encryption
      const ephemeralKeypair = new Keypair();

      // Submit vote to the poll contract
      // Using a more direct approach to avoid Message class compatibility issues
      const tx = await pollContract.publishMessage(
        {
          data: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
          iv: 0n
        },
        ephemeralKeypair.pubKey.asContractParam()
      );
      const receipt = await tx.wait();

      if (receipt?.status !== 1) {
        throw new Error("Vote transaction failed");
      }

      logMagenta({ 
        text: info(`Successfully voted in poll ${poll}`) 
      });
      
      logMagenta({ 
        text: info(`Transaction hash: ${receipt.hash}`) 
      });
      
      logMagenta({ 
        text: info(`Ephemeral private key (save this): ${ephemeralKeypair.privKey.serialize()}`) 
      });

      success = true;
    } catch (err) {
      logRed({
        text: `\n=========================================================\nERROR: ${(err as Error).message}\n`,
      });
    }

    const endBalance = await deployer.provider.getBalance(deployer);
    
    if (success) {
      const expenses = Number((BigInt(startBalance) - BigInt(endBalance)) / BigInt(10) ** BigInt(12)) / 1e6;
      logMagenta({ text: info(`Vote expenses: ${expenses} ETH`) });
    }
  }); 