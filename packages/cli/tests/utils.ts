import { cidToBytes32, createCidFromObject, relayMessages } from "maci-sdk";

import fs from "fs";
import os from "os";
import path from "path";

import type { Signer } from "ethers";
import type { IIpfsMessage } from "maci-contracts";

import { backupFolder } from "./constants";

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
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => os.arch().includes("arm");

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
 * Get backup filenames from backup folder.
 *
 * @returns filenames
 */
export const getBackupFilenames = async (): Promise<string[]> =>
  fs.promises.readdir(backupFolder).then((paths) => paths.map((filename) => path.resolve(backupFolder, filename)));

interface IRelayTestMessagesArgs {
  messages: IIpfsMessage[];
  maciAddress: string;
  signer: Signer;
  pollId: number;
}

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
