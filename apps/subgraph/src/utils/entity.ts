/* eslint-disable no-underscore-dangle */
import { BigInt as GraphBN, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Account, MACI, User } from "../../generated/schema";

export const createOrLoadMACI = (event: ethereum.Event, stateTreeDepth: GraphBN = GraphBN.fromI32(10)): MACI => {
  let maci = MACI.load(event.address);

  if (!maci) {
    maci = new MACI(event.address);
    maci.stateTreeDepth = stateTreeDepth;
    maci.updatedAt = event.block.timestamp;
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
    user.createdAt = event.block.timestamp;
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
    account.createdAt = event.block.timestamp;
    account.save();
  }

  return account;
};
