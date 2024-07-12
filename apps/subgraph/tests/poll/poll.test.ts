/* eslint-disable no-underscore-dangle, @typescript-eslint/no-unnecessary-type-assertion */
import { BigInt } from "@graphprotocol/graph-ts";
import { test, describe, afterEach, clearStore, assert, beforeEach } from "matchstick-as";

import { MACI, Poll } from "../../generated/schema";
import { handleDeployPoll } from "../../src/maci";
import { handleMergeMaciState, handlePublishMessage } from "../../src/poll";
import { DEFAULT_POLL_ADDRESS, mockPollContract } from "../common";
import { createDeployPollEvent } from "../maci/utils";

import { createMergeMaciStateEvent, createPublishMessageEvent } from "./utils";

export { handleMergeMaciState, handlePublishMessage };

describe("Poll", () => {
  beforeEach(() => {
    mockPollContract();

    // mock the deploy poll event with non qv mode set
    const event = createDeployPollEvent(BigInt.fromI32(1), BigInt.fromI32(1), BigInt.fromI32(1), BigInt.fromI32(1));

    handleDeployPoll(event);
  });

  afterEach(() => {
    clearStore();
  });

  test("should handle merge maci state properly", () => {
    const event = createMergeMaciStateEvent(DEFAULT_POLL_ADDRESS, BigInt.fromI32(1), BigInt.fromI32(3));

    handleMergeMaciState(event);

    const poll = Poll.load(event.address)!;
    const maci = MACI.load(poll.maci)!;

    assert.fieldEquals("Poll", poll.id.toHex(), "stateRoot", "1");
    assert.fieldEquals("Poll", poll.id.toHex(), "numSignups", "3");
    assert.fieldEquals("MACI", maci.id.toHexString(), "numPoll", "1");
    assert.fieldEquals("MACI", maci.id.toHexString(), "numSignUps", "3");
    assert.fieldEquals("MACI", maci.id.toHexString(), "latestPoll", poll.id.toHex());
    assert.assertTrue(maci.polls.load().length === 1);
  });

  test("should handle publish message properly", () => {
    const event = createPublishMessageEvent(
      DEFAULT_POLL_ADDRESS,
      [
        BigInt.fromI32(0),
        BigInt.fromI32(1),
        BigInt.fromI32(2),
        BigInt.fromI32(3),
        BigInt.fromI32(4),
        BigInt.fromI32(5),
        BigInt.fromI32(6),
        BigInt.fromI32(7),
        BigInt.fromI32(8),
        BigInt.fromI32(9),
      ],
      BigInt.fromI32(2),
      BigInt.fromI32(3),
    );

    handlePublishMessage(event);

    const poll = Poll.load(event.address)!;

    assert.entityCount("Vote", 1);
    assert.fieldEquals("Poll", poll.id.toHex(), "numMessages", "1");
  });
});
