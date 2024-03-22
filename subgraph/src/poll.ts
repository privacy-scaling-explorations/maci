/* eslint-disable no-underscore-dangle */
import { Poll, Account, Vote, TopupCredit } from "../generated/schema";
import {
  MergeMaciStateAq as MergeMaciStateAqEvent,
  MergeMaciStateAqSubRoots as MergeMaciStateAqSubRootsEvent,
  MergeMessageAq as MergeMessageAqEvent,
  MergeMessageAqSubRoots as MergeMessageAqSubRootsEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PublishMessage as PublishMessageEvent,
  TopupMessage as TopupMessageEvent,
} from "../generated/templates/Poll/Poll";

import { ONE_BIGINT } from "./utils/constants";
import { createOrLoadMACI } from "./utils/helper";

export function handleMergeMaciStateAq(event: MergeMaciStateAqEvent): void {
  const entity = Poll.load(event.address);

  if (entity) {
    entity.stateRoot = event.params._stateRoot;
    entity.numSignups = event.params._numSignups;

    entity.blockNumber = event.block.number;
    entity.updatedAt = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.save();
  }

  const maci = createOrLoadMACI(event);
  maci.numSignUps = event.params._numSignups;
  maci.updatedAt = event.block.timestamp;
  maci.save();
}

export function handleMergeMaciStateAqSubRoots(event: MergeMaciStateAqSubRootsEvent): void {
  const entity = Poll.load(event.address);

  if (entity) {
    entity.numSrQueueOps = event.params._numSrQueueOps;

    entity.blockNumber = event.block.number;
    entity.updatedAt = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.save();
  }
}

export function handleMergeMessageAq(event: MergeMessageAqEvent): void {
  const entity = Poll.load(event.address);

  if (entity) {
    entity.messageRoot = event.params._messageRoot;

    entity.blockNumber = event.block.number;
    entity.updatedAt = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.save();
  }
}

export function handleMergeMessageAqSubRoots(event: MergeMessageAqSubRootsEvent): void {
  const entity = Poll.load(event.address);

  if (entity) {
    entity.numSrQueueOps = event.params._numSrQueueOps;

    entity.blockNumber = event.block.number;
    entity.updatedAt = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.save();
  }
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  const entity = Poll.load(event.address);

  if (entity) {
    entity.owner = event.params.newOwner;

    entity.blockNumber = event.block.number;
    entity.updatedAt = event.block.timestamp;
    entity.txHash = event.transaction.hash;
    entity.save();
  }
}

export function handlePublishMessage(event: PublishMessageEvent): void {
  const entity = new Vote(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.msgType = event.params._message.msgType;
  entity.data = event.params._message.data;
  entity.poll = event.address;

  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();

  const poll = Poll.load(event.address);
  if (poll) {
    poll.numMessages = poll.numMessages.plus(ONE_BIGINT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}

export function handleTopupMessage(event: TopupMessageEvent): void {
  const stateIndex = event.params._message.data[0].toString();
  const credits = event.params._message.data[1];
  const account = Account.load(stateIndex);

  if (account) {
    account.voiceCreditBalance = account.voiceCreditBalance.plus(credits);
    account.save();
  }

  const entity = new TopupCredit(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.msgType = event.params._message.msgType;
  entity.data = event.params._message.data;
  entity.poll = event.address;
  entity.account = stateIndex;

  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();

  const poll = Poll.load(event.address);

  if (poll) {
    poll.numMessages = poll.numMessages.plus(ONE_BIGINT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}
