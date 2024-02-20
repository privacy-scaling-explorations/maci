import { Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Account, MACI, StateLeaf, User } from "../../generated/schema";

import { DEFAULT_MACI_ID } from "./constants";

export const packPubkey = (pubkeyX: bigint, pubkeyY: bigint): string => `${pubkeyX}-${pubkeyY}`;

export const createOrLoadMACI = (event: ethereum.Event, owner: Bytes | null = null, stateTreeDepth = 10): MACI => {
  let maci = MACI.load(DEFAULT_MACI_ID);

  if (!maci) {
    maci = new MACI(DEFAULT_MACI_ID);
    maci.owner = owner !== null ? owner : (event.transaction.from as Bytes);
    maci.stateTreeDepth = stateTreeDepth as i32;
    maci.updatedAt = event.block.timestamp;
    maci.blockNumber = event.block.number;
    maci.txHash = event.transaction.hash;

    maci.numPoll = 0n;
    maci.numSignUps = 0n;
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
  pubkeyX: bigint,
  pubkeyY: bigint,
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
  stateIndex: bigint,
  event: ethereum.Event,
  account: string,
  voiceCreditBalance = 0n,
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
