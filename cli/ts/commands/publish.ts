import { BaseContract } from "ethers";
import { type MACI, type Poll, getDefaultSigner, getDefaultNetwork, parseArtifact } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs";

import {
  type PublishArgs,
  info,
  logError,
  logGreen,
  logYellow,
  readContractAddress,
  validateSalt,
  promptSensitiveValue,
  contractExists,
  banner,
} from "../utils";

/**
 * Publish a new message to a MACI Poll contract
 * @param PublishArgs - The arguments for the publish command
 * @returns The ephemeral private key used to encrypt the message
 */
export const publish = async ({
  pubkey,
  stateIndex,
  voteOptionIndex,
  nonce,
  pollId,
  newVoteWeight,
  maciContractAddress,
  salt,
  privateKey,
  signer,
  quiet = true,
}: PublishArgs): Promise<string> => {
  banner(quiet);

  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();

  // validate that the pub key of the user is valid
  if (!PubKey.isValidSerializedPubKey(pubkey)) {
    logError("invalid MACI public key");
  }
  // deserialize
  const userMaciPubKey = PubKey.deserialize(pubkey);

  // validation of the maci contract address
  if (!readContractAddress("MACI", network?.name) && !maciContractAddress) {
    logError("MACI contract address is empty");
  }

  const maciAddress = maciContractAddress || readContractAddress("MACI", network?.name);

  if (!(await contractExists(ethSigner.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  // if no private key is passed we ask it securely
  const userPrivKey = privateKey || (await promptSensitiveValue("Insert your MACI private key"));

  if (!PrivKey.isValidSerializedPrivKey(userPrivKey)) {
    logError("Invalid MACI private key");
  }

  const userMaciPrivKey = PrivKey.deserialize(userPrivKey);

  // validate args
  if (voteOptionIndex < 0) {
    logError("invalid vote option index");
  }

  // check < 1 cause index zero is a blank state leaf
  if (stateIndex < 1) {
    logError("invalid state index");
  }

  if (nonce < 0) {
    logError("invalid nonce");
  }

  if (salt && !validateSalt(salt)) {
    logError("Invalid salt");
  }

  const userSalt = salt ? BigInt(salt) : genRandomSalt();

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContractAbi = parseArtifact("MACI")[0];
  const pollContractAbi = parseArtifact("Poll")[0];

  const maciContract = new BaseContract(maciAddress, maciContractAbi, ethSigner) as MACI;

  const pollAddress = await maciContract.getPoll(pollId);

  if (!(await contractExists(ethSigner.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = new BaseContract(pollAddress, pollContractAbi, ethSigner) as Poll;

  const maxValues = await pollContract.maxValues();
  const coordinatorPubKeyResult = await pollContract.coordinatorPubKey();
  const maxVoteOptions = Number(maxValues.maxVoteOptions);

  // validate the vote options index against the max leaf index on-chain
  if (maxVoteOptions < voteOptionIndex) {
    logError("Invalid vote option index");
  }

  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  const encKeypair = new Keypair();

  // create the command object
  const command: PCommand = new PCommand(
    stateIndex,
    userMaciPubKey,
    voteOptionIndex,
    newVoteWeight,
    nonce,
    BigInt(pollId),
    userSalt,
  );

  // sign the command with the user private key
  const signature = command.sign(userMaciPrivKey);
  // encrypt the command using a shared key between the user and the coordinator
  const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey));

  try {
    // submit the message onchain as well as the encryption public key
    const tx = await pollContract.publishMessage(message.asContractParam(), encKeypair.pubKey.asContractParam());
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    logGreen(quiet, info(`Ephemeral private key: ${encKeypair.privKey.serialize()}`));
  } catch (error) {
    logError((error as Error).message);
  }

  // we want the user to have the ephemeral private key
  return encKeypair.privKey.serialize();
};
