/* eslint-disable no-underscore-dangle */
import { BigInt as GraphBN, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Account, MACI, User } from "../../generated/schema";

import { DEFAULT_MACI_ID } from "./constants";

export const createOrLoadMACI = (event: ethereum.Event, stateTreeDepth: GraphBN = GraphBN.fromI32(10)): MACI => {
  let maci = MACI.load(DEFAULT_MACI_ID);

  if (!maci) {
    maci = new MACI(DEFAULT_MACI_ID);
    maci.stateTreeDepth = stateTreeDepth;
    maci.updatedAt = event.block.timestamp;
    maci.blockNumber = event.block.number;
    maci.txHash = event.transaction.hash;

    maci.numPoll = GraphBN.zero();
    maci.numSignUps = GraphBN.zero();
    maci.latestPoll = Bytes.empty();
    maci.save();
  }

  return maci;
};

export const createOrLoadUser = (publicKeyX: GraphBN, publicKeyY: GraphBN, event: ethereum.Event): User => {
  const publicKey = `${publicKeyX.toString()} ${publicKeyY.toString()}`;
  let user = User.load(publicKey);

  if (!user) {
    user = new User(publicKey);
    user.timestamp = event.block.timestamp;
    user.blockNumber = event.block.number;
    user.txHash = event.transaction.hash;
    user.save();
  }

  return user;
};

export const createOrLoadAccount = (
  stateIndex: GraphBN,
  event: ethereum.Event,
  owner: string,
  voiceCreditBalance: GraphBN = GraphBN.zero(),
): Account => {
  const id = stateIndex.toString();
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.owner = owner;
    account.voiceCreditBalance = voiceCreditBalance;
    account.timestamp = event.block.timestamp;
    account.blockNumber = event.block.number;
    account.txHash = event.transaction.hash;
    account.save();
  }

  return account;
};
