import { Poll, Vote, TopupCredit } from "../generated/schema";
import {
  MergeMaciStateAq as MergeMaciStateAqEvent,
  MergeMaciStateAqSubRoots as MergeMaciStateAqSubRootsEvent,
  MergeMessageAq as MergeMessageAqEvent,
  MergeMessageAqSubRoots as MergeMessageAqSubRootsEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PublishMessage as PublishMessageEvent,
  TopupMessage as TopupMessageEvent,
} from "../generated/templates/Poll/Poll";

import { packPubkey } from "./utils/helper";

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
  const entity = new Vote(packPubkey(event.params._encPubKey.x, event.params._encPubKey.y));
  entity.msgType = event.params._message.msgType;
  entity.data = event.params._message.data;
  entity.poll = event.address;

  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}

export function handleTopupMessage(event: TopupMessageEvent): void {
  const entity = new TopupCredit(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.msgType = event.params._message.msgType;
  entity.data = event.params._message.data;
  entity.poll = event.address;

  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}
