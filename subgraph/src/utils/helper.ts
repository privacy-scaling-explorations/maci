/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-shadow */
import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Account, MACI, StateLeaf, User } from "../../generated/schema";

import { DEFAULT_MACI_ID } from "./constants";

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
export const packPubkey = (pubkeyX: BigInt, pubkeyY: BigInt): string => `${pubkeyX}-${pubkeyY}`;

export const createOrLoadMACI = (
  event: ethereum.Event,
  owner: Bytes | null = null,
  stateTreeDepth: number = 10,
): MACI => {
  let maci = MACI.load(DEFAULT_MACI_ID);

  if (!maci) {
    maci = new MACI(DEFAULT_MACI_ID);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    maci.owner = owner !== null ? owner : changetype<Bytes>(event.transaction.from);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    maci.stateTreeDepth = stateTreeDepth as i32;
    maci.updatedAt = event.block.timestamp;
    maci.blockNumber = event.block.number;
    maci.txHash = event.transaction.hash;

    maci.numPoll = BigInt.zero();
    maci.numRegistrar = BigInt.zero();
    maci.numVotes = BigInt.zero();
    maci.save();
  }

  return maci;
};

export const createOrLoadUser = (address: Bytes, event: ethereum.Event): User => {
  let user = User.load(address);

  if (!user) {
    user = new User(address);
    user.timestamp = event.block.timestamp;
    user.blockNumber = event.block.number;
    user.txHash = event.transaction.hash;
    user.save();
  }

  return user;
};

export const createOrLoadAccount = (
  pubkeyX: BigInt,
  pubkeyY: BigInt,
  event: ethereum.Event,
  owner: Bytes | null = null,
): Account => {
  let account = Account.load(packPubkey(pubkeyX, pubkeyY));

  if (!account) {
    account = new Account(packPubkey(pubkeyX, pubkeyY));
    account.owner = owner;
    account.timestamp = event.block.timestamp;
    account.blockNumber = event.block.number;
    account.txHash = event.transaction.hash;
    account.save();
  }

  return account;
};

export const createOrLoadStateLeaf = (
  stateIndex: BigInt,
  event: ethereum.Event,
  account: string,
  voiceCreditBalance: BigInt = BigInt.zero(),
): StateLeaf => {
  const id = stateIndex.toString();
  let leaf = StateLeaf.load(id);

  if (!leaf) {
    leaf = new StateLeaf(id);
    leaf.voiceCreditBalance = voiceCreditBalance;
    leaf.timestamp = event.block.timestamp;
    leaf.blockNumber = event.block.number;
    leaf.txHash = event.transaction.hash;
    leaf.account = account;
    leaf.save();
  }

  return leaf;
};
