import { Address, Bytes, BigInt as GraphBN, ethereum } from "@graphprotocol/graph-ts";
// eslint-disable-next-line import/no-extraneous-dependencies
import { newMockEvent } from "matchstick-as";

import { MergeState, PublishMessage, ChainHashUpdated, IpfsHashAdded } from "../../generated/templates/Poll/Poll";

export function createMergeStateEvent(address: Address, stateRoot: GraphBN, totalSignups: GraphBN): MergeState {
  const event = changetype<MergeState>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_stateRoot", ethereum.Value.fromUnsignedBigInt(stateRoot)));
  event.parameters.push(new ethereum.EventParam("_totalSignups", ethereum.Value.fromUnsignedBigInt(totalSignups)));
  event.address = address;

  return event;
}

export function createPublishMessageEvent(
  address: Address,
  data: GraphBN[],
  encryptionPublicKeyX: GraphBN,
  encryptionPublicKeyY: GraphBN,
): PublishMessage {
  const event = changetype<PublishMessage>(newMockEvent());

  const encryptionPublicKey = [
    ethereum.Value.fromUnsignedBigInt(encryptionPublicKeyX),
    ethereum.Value.fromUnsignedBigInt(encryptionPublicKeyY),
  ];

  event.parameters.push(
    new ethereum.EventParam(
      "_message",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>([ethereum.Value.fromUnsignedBigIntArray(data)])),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "_encryptionPublicKey",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>(encryptionPublicKey)),
    ),
  );
  event.address = address;

  return event;
}

export function createChainHashUpdatedEvent(address: Address, chainHash: GraphBN): ChainHashUpdated {
  const event = changetype<ChainHashUpdated>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_chainHash", ethereum.Value.fromUnsignedBigInt(chainHash)));
  event.address = address;

  return event;
}

export function createIpfsHashAddedEvent(address: Address, ipfsHash: Bytes): IpfsHashAdded {
  const event = changetype<IpfsHashAdded>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_ipfsHash", ethereum.Value.fromBytes(ipfsHash)));
  event.address = address;

  return event;
}
