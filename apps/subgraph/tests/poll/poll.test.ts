/* eslint-disable no-underscore-dangle, @typescript-eslint/no-unnecessary-type-assertion */
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { test, describe, afterEach, clearStore, assert, beforeEach, mockIpfsFile, beforeAll } from "matchstick-as";

import { ChainHash, MACI, Poll } from "../../generated/schema";
import { handleDeployPoll } from "../../src/maci";
import {
  handleMergeState,
  handlePublishMessage,
  handleChainHashUpdate,
  handleIpfsHashAdded,
  processIpfsVotes,
} from "../../src/poll";
import { DEFAULT_POLL_ADDRESS, mockMaciContract, mockPollContract } from "../common";
import { createDeployPollEvent } from "../maci/utils";

import {
  createChainHashUpdatedEvent,
  createIpfsHashAddedEvent,
  createMergeStateEvent,
  createPublishMessageEvent,
} from "./utils";

export { handleMergeState, handlePublishMessage, handleChainHashUpdate, handleIpfsHashAdded, processIpfsVotes };

describe("Poll", () => {
  beforeAll(() => {
    mockIpfsFile("TspRr", "tests/ipfs/batch-0.json");
    mockIpfsFile("Tsn1k", "tests/ipfs/batch-1.json");

    mockMaciContract();
    mockPollContract();
  });

  beforeEach(() => {
    // mock the deploy poll event with non qv mode set
    const event = createDeployPollEvent(BigInt.fromI32(1), BigInt.fromI32(1), BigInt.fromI32(1), BigInt.fromI32(1));

    handleDeployPoll(event);
  });

  afterEach(() => {
    clearStore();
  });

  test("should handle merge maci state properly", () => {
    const event = createMergeStateEvent(DEFAULT_POLL_ADDRESS, BigInt.fromI32(1), BigInt.fromI32(3));

    handleMergeState(event);

    const poll = Poll.load(event.address)!;
    const maci = MACI.load(poll.maci)!;

    assert.fieldEquals("Poll", poll.id.toHex(), "stateRoot", "1");
    assert.fieldEquals("Poll", poll.id.toHex(), "totalSignups", "3");
    assert.fieldEquals("MACI", maci.id.toHexString(), "numPoll", "1");
    assert.fieldEquals("MACI", maci.id.toHexString(), "totalSignups", "3");
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

  test("should handle chain hash update properly", () => {
    const event = createChainHashUpdatedEvent(DEFAULT_POLL_ADDRESS, BigInt.fromI32(123443221));

    handleChainHashUpdate(event);

    const chainHash = ChainHash.load(event.params._chainHash.toString())!;

    assert.entityCount("ChainHash", 1);
    assert.fieldEquals("ChainHash", chainHash.id, "id", event.params._chainHash.toString());
  });

  test("should handle ipfs message processing properly", () => {
    const expectedTotalMessages = 3;

    const event = createIpfsHashAddedEvent(DEFAULT_POLL_ADDRESS, Bytes.fromHexString("0xdead"));

    handleIpfsHashAdded(event);

    const poll = Poll.load(event.address)!;

    assert.fieldEquals("Poll", poll.id.toHex(), "numMessages", expectedTotalMessages.toString());
    assert.entityCount("Vote", expectedTotalMessages);
  });

  test("should not add votes if there is no ipfs file", () => {
    const event = createIpfsHashAddedEvent(DEFAULT_POLL_ADDRESS, Bytes.fromHexString("0xbeef"));

    handleIpfsHashAdded(event);

    const poll = Poll.load(event.address)!;

    assert.fieldEquals("Poll", poll.id.toHex(), "numMessages", "0");
    assert.entityCount("Vote", 0);
  });
});
