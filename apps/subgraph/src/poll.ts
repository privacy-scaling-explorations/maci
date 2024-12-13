/* eslint-disable no-underscore-dangle */

import { Bytes, ipfs, log, Value, BigInt as GraphBN, JSONValue } from "@graphprotocol/graph-ts";

import { Poll, Vote, MACI, ChainHash } from "../generated/schema";
import {
  MergeState as MergeStateEvent,
  PublishMessage as PublishMessageEvent,
  ChainHashUpdated as ChainHashUpdatedEvent,
  IpfsHashAdded as IpfsHashAddedEvent,
} from "../generated/templates/Poll/Poll";

import { ONE_BIG_INT } from "./utils/constants";

export function handleMergeState(event: MergeStateEvent): void {
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

export function handleChainHashUpdate(event: ChainHashUpdatedEvent): void {
  const chainHash = new ChainHash(event.params._chainHash.toString());
  chainHash.poll = event.address;
  chainHash.timestamp = event.block.timestamp;
  chainHash.save();

  const poll = Poll.load(event.address);

  if (poll) {
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}

export function handleIpfsHashAdded(event: IpfsHashAddedEvent): void {
  const CID_VERSION = "0x1220";
  const cid = Bytes.fromHexString(CID_VERSION).concat(event.params._ipfsHash).toBase58();
  const timestamp = event.block.timestamp.toString();
  const voteId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString();

  ipfs.mapJSON(cid, "processIpfsVotes", Value.fromStringArray([cid, voteId, timestamp, event.address.toHexString()]));
}

export function processIpfsVotes(data: JSONValue, userData: Value): void {
  const params = userData.toArray();
  const cid = params[0].toString();
  const voteId = params[1].toString();
  const timestamp = params[2].toString();
  const pollAddress = Bytes.fromHexString(params[3].toString());

  const jsonData = data.toObject();
  const jsonMessages = jsonData.get("messages");

  if (!jsonMessages) {
    log.warning("Message batch file {} has invalid format", [cid]);
    return;
  }

  const messages = jsonMessages.toArray();

  for (let index = 0; index < messages.length; index += 1) {
    const vote = new Vote(Bytes.fromHexString(voteId).concatI32(index));

    vote.data = castToBigIntArray(messages[index].toArray());
    vote.poll = pollAddress;
    vote.cid = cid;
    vote.timestamp = GraphBN.fromString(timestamp);
    vote.save();
  }

  const poll = Poll.load(pollAddress);

  if (poll) {
    poll.numMessages = poll.numMessages.plus(GraphBN.fromI32(messages.length));
    poll.updatedAt = GraphBN.fromString(timestamp);
    poll.save();
  }
}

function castToBigIntArray(array: JSONValue[]): GraphBN[] {
  const result: GraphBN[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let index = 0; index < array.length; index += 1) {
    const value = array[index];
    result.push(GraphBN.fromString(value.toString()));
  }

  return result;
}
