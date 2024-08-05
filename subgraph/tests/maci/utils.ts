import { BigInt as GraphBN, ethereum } from "@graphprotocol/graph-ts";
// eslint-disable-next-line import/no-extraneous-dependencies
import { newMockEvent } from "matchstick-as";

import { SignUp, DeployPoll } from "../../generated/MACI/MACI";

export function createSignUpEvent(
  stateIndex: GraphBN,
  userPubKeyX: GraphBN,
  userPubKeyY: GraphBN,
  voiceCreditBalance: GraphBN,
  timestamp: GraphBN,
): SignUp {
  const event = changetype<SignUp>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_stateIndex", ethereum.Value.fromUnsignedBigInt(stateIndex)));
  event.parameters.push(new ethereum.EventParam("_userPubKeyX", ethereum.Value.fromUnsignedBigInt(userPubKeyX)));
  event.parameters.push(new ethereum.EventParam("_userPubKeyY", ethereum.Value.fromUnsignedBigInt(userPubKeyY)));
  event.parameters.push(
    new ethereum.EventParam("_voiceCreditBalance", ethereum.Value.fromUnsignedBigInt(voiceCreditBalance)),
  );
  event.parameters.push(new ethereum.EventParam("_timestamp", ethereum.Value.fromUnsignedBigInt(timestamp)));

  return event;
}

export function createDeployPollEvent(
  pollId: GraphBN,
  coordinatorPubKeyX: GraphBN,
  coordinatorPubKeyY: GraphBN,
  mode: GraphBN,
): DeployPoll {
  const event = changetype<DeployPoll>(newMockEvent());

  event.parameters.push(new ethereum.EventParam("_pollId", ethereum.Value.fromUnsignedBigInt(pollId)));
  event.parameters.push(
    new ethereum.EventParam("_coordinatorPubKeyX", ethereum.Value.fromUnsignedBigInt(coordinatorPubKeyX)),
  );
  event.parameters.push(
    new ethereum.EventParam("_coordinatorPubKeyY", ethereum.Value.fromUnsignedBigInt(coordinatorPubKeyY)),
  );
  event.parameters.push(new ethereum.EventParam("mode", ethereum.Value.fromUnsignedBigInt(mode)));

  return event;
}
