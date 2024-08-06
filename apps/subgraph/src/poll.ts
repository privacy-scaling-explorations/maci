/* eslint-disable no-underscore-dangle */

import { Poll, Vote, MACI } from "../generated/schema";
import {
  MergeMaciState as MergeMaciStateEvent,
  MergeMessageAq as MergeMessageAqEvent,
  MergeMessageAqSubRoots as MergeMessageAqSubRootsEvent,
  PublishMessage as PublishMessageEvent,
} from "../generated/templates/Poll/Poll";

import { ONE_BIG_INT } from "./utils/constants";

export function handleMergeMaciState(event: MergeMaciStateEvent): void {
  const poll = Poll.load(event.address);

  if (poll) {
    poll.stateRoot = event.params._stateRoot;
    poll.numSignups = event.params._numSignups;
    poll.updatedAt = event.block.timestamp;
    poll.save();

    const maci = MACI.load(poll.maci);

    if (maci) {
      maci.numSignUps = event.params._numSignups;
      maci.updatedAt = event.block.timestamp;
      maci.save();
    }
  }
}

export function handleMergeMessageAq(event: MergeMessageAqEvent): void {
  const poll = Poll.load(event.address);

  if (poll) {
    poll.messageRoot = event.params._messageRoot;
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}

export function handleMergeMessageAqSubRoots(event: MergeMessageAqSubRootsEvent): void {
  const poll = Poll.load(event.address);

  if (poll) {
    poll.numSrQueueOps = event.params._numSrQueueOps;
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}

export function handlePublishMessage(event: PublishMessageEvent): void {
  const vote = new Vote(event.transaction.hash.concatI32(event.logIndex.toI32()));
  vote.data = event.params._message.data;
  vote.poll = event.address;
  vote.timestamp = event.block.timestamp;
  vote.save();

  const poll = Poll.load(event.address);

  if (poll) {
    poll.numMessages = poll.numMessages.plus(ONE_BIG_INT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}
