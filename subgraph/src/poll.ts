/* eslint-disable no-underscore-dangle */
import { Poll, Vote } from "../generated/schema";
import {
  MergeMaciState as MergeMaciStateEvent,
  MergeMessageAq as MergeMessageAqEvent,
  MergeMessageAqSubRoots as MergeMessageAqSubRootsEvent,
  PublishMessage as PublishMessageEvent,
} from "../generated/templates/Poll/Poll";

import { ONE_BIGINT } from "./utils/constants";
import { createOrLoadMACI } from "./utils/helper";

export function handleMergeMaciState(event: MergeMaciStateEvent): void {
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

export function handlePublishMessage(event: PublishMessageEvent): void {
  const entity = new Vote(event.transaction.hash.concatI32(event.logIndex.toI32()));
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
