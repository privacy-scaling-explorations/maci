import { Address, BigInt as GraphBN, ethereum } from "@graphprotocol/graph-ts";
// eslint-disable-next-line import/no-extraneous-dependencies
import { newMockEvent } from "matchstick-as";

import {
  MergeMaciState,
  MergeMessageAq,
  MergeMessageAqSubRoots,
  PublishMessage,
} from "../../generated/templates/Poll/Poll";

export function createMergeMaciStateEvent(address: Address, stateRoot: GraphBN, numSignups: GraphBN): MergeMaciState {
  const event = changetype<MergeMaciState>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_stateRoot", ethereum.Value.fromUnsignedBigInt(stateRoot)));
  event.parameters.push(new ethereum.EventParam("_numSignups", ethereum.Value.fromUnsignedBigInt(numSignups)));
  event.address = address;

  return event;
}

export function createMergeMessageAqEvent(address: Address, messageRoot: GraphBN): MergeMessageAq {
  const event = changetype<MergeMessageAq>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_messageRoot", ethereum.Value.fromUnsignedBigInt(messageRoot)));
  event.address = address;

  return event;
}

export function createMergeMessageAqSubRootsEvent(address: Address, numSrQueueOps: GraphBN): MergeMessageAqSubRoots {
  const event = changetype<MergeMessageAqSubRoots>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_numSrQueueOps", ethereum.Value.fromUnsignedBigInt(numSrQueueOps)));
  event.address = address;

  return event;
}

export function createPublishMessageEvent(
  address: Address,
  data: GraphBN[],
  encPubKeyX: GraphBN,
  encPubKeyY: GraphBN,
): PublishMessage {
  const event = changetype<PublishMessage>(newMockEvent());

  event.parameters.push(
    new ethereum.EventParam(
      "_message",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>([ethereum.Value.fromUnsignedBigIntArray(data)])),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_encPubKey",
      ethereum.Value.fromTuple(
        changetype<ethereum.Tuple>(ethereum.Value.fromUnsignedBigIntArray([encPubKeyX, encPubKeyY])),
      ),
    ),
  );
  event.address = address;

  return event;
}
