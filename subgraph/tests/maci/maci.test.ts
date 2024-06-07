/* eslint-disable no-underscore-dangle, @typescript-eslint/no-unnecessary-type-assertion */
import { BigInt } from "@graphprotocol/graph-ts";
import { test, describe, afterEach, clearStore, assert, beforeAll } from "matchstick-as";

import { Account, MACI, Poll, User } from "../../generated/schema";
import { handleSignUp, handleDeployPoll } from "../../src/maci";
import { DEFAULT_MACI_ID } from "../../src/utils/constants";
import {
  DEFAULT_MESSAGE_PROCESSOR_ADDRESS,
  DEFAULT_POLL_ADDRESS,
  DEFAULT_TALLY_ADDRESS,
  mockPollContract,
} from "../common";

import { createSignUpEvent, createDeployPollEvent } from "./utils";

export { handleSignUp, handleDeployPoll };

describe("MACI", () => {
  beforeAll(() => {
    mockPollContract();
  });

  afterEach(() => {
    clearStore();
  });

  test("should handle signup properly", () => {
    const event = createSignUpEvent(
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
    );

    handleSignUp(event);

    const userId = `${event.params._userPubKeyX.toString()} ${event.params._userPubKeyY.toString()}`;
    const user = User.load(userId)!;
    const account = Account.load(event.params._stateIndex.toString())!;
    const maci = MACI.load(DEFAULT_MACI_ID)!;
    const poll = Poll.load(maci.latestPoll);

    assert.fieldEquals("User", user.id, "id", userId);
    assert.fieldEquals("Account", account.id, "id", event.params._stateIndex.toString());
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numPoll", "0");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numSignUps", "1");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "latestPoll", "0x00000000");
    assert.assertNull(poll);
  });

  test("should handle deploy poll properly", () => {
    const event = createDeployPollEvent(
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      DEFAULT_POLL_ADDRESS,
      DEFAULT_MESSAGE_PROCESSOR_ADDRESS,
      DEFAULT_TALLY_ADDRESS,
    );

    handleDeployPoll(event);

    const maci = MACI.load(DEFAULT_MACI_ID)!;
    const poll = Poll.load(maci.latestPoll)!;

    assert.fieldEquals("Poll", poll.id.toHex(), "id", DEFAULT_POLL_ADDRESS.toHexString());
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numPoll", "1");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numSignUps", "0");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "latestPoll", poll.id.toHex());
  });

  test("should handle signup with deployed poll properly", () => {
    const deployPollEvent = createDeployPollEvent(
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      DEFAULT_POLL_ADDRESS,
      DEFAULT_MESSAGE_PROCESSOR_ADDRESS,
      DEFAULT_TALLY_ADDRESS,
    );

    const signUpEvent = createSignUpEvent(
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      BigInt.fromI32(1),
    );

    handleDeployPoll(deployPollEvent);
    handleSignUp(signUpEvent);

    const userId = `${signUpEvent.params._userPubKeyX.toString()} ${signUpEvent.params._userPubKeyY.toString()}`;
    const user = User.load(userId)!;
    const account = Account.load(signUpEvent.params._stateIndex.toString())!;
    const maci = MACI.load(DEFAULT_MACI_ID)!;
    const poll = Poll.load(maci.latestPoll)!;

    assert.fieldEquals("User", user.id, "id", userId);
    assert.fieldEquals("Account", account.id, "id", signUpEvent.params._stateIndex.toString());
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numPoll", "1");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "numSignUps", "1");
    assert.fieldEquals("MACI", DEFAULT_MACI_ID, "latestPoll", poll.id.toHex());
    assert.assertNotNull(poll);
  });
});
