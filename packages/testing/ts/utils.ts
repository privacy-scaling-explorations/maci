// eslint-disable-next-line import/no-extraneous-dependencies
import { Keypair } from "@maci-protocol/domainobjs";
import { type ITallyData } from "@maci-protocol/sdk";
import { cidToBytes32, createCidFromObject, relayMessages } from "@maci-protocol/sdk";
import { expect } from "chai";

import fs from "fs";
import { arch } from "os";
import path from "path";

import type { IVote, IBriber, IRelayTestMessagesArgs } from "./types";

import { User } from "./user";

export const backupFolder = "./backup";

export const defaultVote = {
  voteWeight: 1n,
  nonce: 1n,
  maxVoteWeight: 25n,
  voteCreditBalance: 1n,
  voteOptionIndex: 0n,
};

/**
 * Read a JSON file from disk
 * @param filePath - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = async <T = Record<string, Record<string, string> | undefined>>(
  filePath: string,
): Promise<T> => {
  const isExists = fs.existsSync(filePath);

  if (!isExists) {
    throw new Error(`File ${filePath} does not exist`);
  }

  return fs.promises.readFile(filePath).then((res) => JSON.parse(res.toString()) as T);
};

/**
 * Test utility to generate vote objects for integrationt ests
 * @param userIndex - the index of the user
 * @param voteIndex - the index of the vote
 * @param numVotesPerUser - the amount of votes per user
 * @param votes - the votes object
 * @param bribers - the bribers votes
 * @returns
 */
const getTestVoteValues = (
  userIndex: number,
  voteIndex: number,
  numVotesPerUser: number,
  votes?: IVote[][],
  bribers?: IBriber[],
) => {
  // check if we have specific votes
  const useVotes = votes && userIndex in votes;
  let { voteOptionIndex } = defaultVote;
  let { voteWeight } = defaultVote;

  // if we have bribers
  if (bribers && userIndex in bribers) {
    if (!(bribers[userIndex].voteOptionIndices.length === numVotesPerUser)) {
      throw new Error("failed generating user commands: more bribes than votes set per user");
    }

    // if we were provided specific votes
    if (useVotes) {
      if (bribers[userIndex].voteOptionIndices[voteIndex] !== votes[userIndex][voteIndex].voteOptionIndex) {
        throw new Error(
          "failed generating user commands: conflict between bribers voteOptionIndex and the one set by voters",
        );
      }
    }
    voteOptionIndex = bribers[userIndex].voteOptionIndices[voteIndex];
  } else if (useVotes) {
    voteOptionIndex = votes[userIndex][voteIndex].voteOptionIndex;
  }

  if (useVotes) {
    voteWeight = votes[userIndex][voteIndex].voteWeight;
  }

  return { voteOptionIndex, voteWeight };
};

/**
 * Generate a list of user commands for integration tests
 * @param numUsers - the number of users
 * @param numVotesPerUser - the number of votes per user
 * @param bribers - the number of bribers
 * @param presetVotes - the preset votes if any
 * @returns an array of UserCommand objects
 */
export const genTestUserCommands = (
  numUsers: number,
  numVotesPerUser: number,
  bribers?: IBriber[],
  presetVotes?: IVote[][],
): User[] => {
  const usersCommands: User[] = [];
  for (let i = 0; i < numUsers; i += 1) {
    const userKeypair = new Keypair();
    const votes: IVote[] = [];

    for (let j = 0; j < numVotesPerUser; j += 1) {
      const { voteOptionIndex, voteWeight } = getTestVoteValues(i, j, numVotesPerUser, presetVotes, bribers);
      const vote = {
        voteOptionIndex,
        voteWeight,
        nonce: BigInt(j + 1),
      };

      votes.push(vote);
    }

    const userCommand = new User(userKeypair, votes, defaultVote.maxVoteWeight, defaultVote.nonce);
    usersCommands.push(userCommand);
  }

  return usersCommands;
};

/**
 * Assertion function to validate that the tally results are as expected
 * @param maxMessages - the max number of messages
 * @param expectedTally - the expected tally values
 * @param expectedPerVoteOptionSpentVoiceCredits - the expected per vote option spent voice credits
 * @param expectedTotalSpentVoiceCredits - the expected total spent voice credits
 * @param tallyFile the tally file itself as an object
 */
export const expectTally = (
  maxMessages: number,
  expectedTally: number[],
  expectedPerVoteOptionSpentVoiceCredits: number[],
  expectedTotalSpentVoiceCredits: number,
  tallyFile: ITallyData,
): void => {
  const genTally = Array(maxMessages).fill("0");
  const genPerVOSpentVoiceCredits = Array(maxMessages).fill("0");

  expectedTally.forEach((voteWeight, voteOption) => {
    if (voteWeight !== 0) {
      genTally[voteOption] = voteWeight.toString();
    }
  });

  expectedPerVoteOptionSpentVoiceCredits.forEach((spentCredit, index) => {
    if (spentCredit !== 0) {
      genPerVOSpentVoiceCredits[index] = spentCredit.toString();
    }
  });

  expect(tallyFile.results.tally).to.deep.equal(genTally);
  expect(tallyFile.perVoteOptionSpentVoiceCredits?.tally).to.deep.equal(genPerVOSpentVoiceCredits);
  expect(tallyFile.totalSpentVoiceCredits.spent).to.eq(expectedTotalSpentVoiceCredits.toString());
};

/**
 * Stop the current thread for x seconds
 * @param ms - the number of ms to sleep for
 */
export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Check whether we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => arch().includes("arm");

/**
 * Write backup data to file.
 *
 * @param name file name without extension
 * @param data backup data
 */
export const writeBackupFile = async (name: string, data: unknown): Promise<void> => {
  if (!fs.existsSync(backupFolder)) {
    await fs.promises.mkdir(backupFolder);
  }

  await fs.promises.writeFile(path.resolve(backupFolder, `${name}.json`), JSON.stringify(data));
};

/**
 * Test utility to clean up the proofs directory
 * and the tally.json file
 */
export const clean = async (withBackup = true): Promise<void> => {
  const files = await fs.promises.readdir("./proofs");

  await Promise.all(files.map((file) => fs.promises.rm(path.resolve("./proofs", file))));

  if (fs.existsSync("./tally.json")) {
    await fs.promises.rm("./tally.json");
  }

  if (withBackup && fs.existsSync(backupFolder)) {
    await fs.promises.rm(backupFolder, { recursive: true, force: true });
  }
};

/**
 * Get backup filenames from backup folder.
 *
 * @returns filenames
 */
export const getBackupFilenames = async (): Promise<string[]> =>
  fs.promises.readdir(backupFolder).then((paths) => paths.map((filename) => path.resolve(backupFolder, filename)));

/**
 * Relay test messages to mock contracts and save messages to backup folder.
 *
 * @param args relay test messages arguments
 */
export const relayTestMessages = async ({
  messages,
  maciAddress,
  pollId,
  signer,
}: IRelayTestMessagesArgs): Promise<void> => {
  const cid = await createCidFromObject(messages);
  const ipfsHash = await cidToBytes32(cid);

  await writeBackupFile(ipfsHash, messages);

  await relayMessages({
    maciAddress,
    pollId,
    ipfsHash,
    messages,
    signer,
  });
};
