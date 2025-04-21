import { BigInt as GraphBN, ethereum } from "@graphprotocol/graph-ts";
// eslint-disable-next-line import/no-extraneous-dependencies
import { newMockEvent } from "matchstick-as";

import { SignUp, DeployPoll } from "../../generated/MACI/MACI";

export function createSignUpEvent(
  stateIndex: GraphBN,
  userPublicKeyX: GraphBN,
  userPublicKeyY: GraphBN,
  voiceCreditBalance: GraphBN,
  timestamp: GraphBN,
): SignUp {
  const event = changetype<SignUp>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_stateIndex", ethereum.Value.fromUnsignedBigInt(stateIndex)));
  event.parameters.push(new ethereum.EventParam("_userPublicKeyX", ethereum.Value.fromUnsignedBigInt(userPublicKeyX)));
  event.parameters.push(new ethereum.EventParam("_userPublicKeyY", ethereum.Value.fromUnsignedBigInt(userPublicKeyY)));
  event.parameters.push(
    new ethereum.EventParam("_voiceCreditBalance", ethereum.Value.fromUnsignedBigInt(voiceCreditBalance)),
  );
  event.parameters.push(new ethereum.EventParam("_timestamp", ethereum.Value.fromUnsignedBigInt(timestamp)));

  return event;
}

export function createDeployPollEvent(
  pollId: GraphBN,
  coordinatorPublicKeyX: GraphBN,
  coordinatorPublicKeyY: GraphBN,
  mode: GraphBN,
): DeployPoll {
  const event = changetype<DeployPoll>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_pollId", ethereum.Value.fromUnsignedBigInt(pollId)));
  event.parameters.push(
    new ethereum.EventParam("_coordinatorPublicKeyX", ethereum.Value.fromUnsignedBigInt(coordinatorPublicKeyX)),
  );
  event.parameters.push(
    new ethereum.EventParam("_coordinatorPublicKeyY", ethereum.Value.fromUnsignedBigInt(coordinatorPublicKeyY)),
  );
  event.parameters.push(new ethereum.EventParam("mode", ethereum.Value.fromUnsignedBigInt(mode)));

  return event;
}
