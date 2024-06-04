/* eslint-disable no-underscore-dangle */
import { Address, BigInt as GraphBN } from "@graphprotocol/graph-ts";

import { DeployPoll as DeployPollEvent, SignUp as SignUpEvent } from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { ONE_BIGINT } from "./utils/constants";
import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount } from "./utils/helper";

export function handleDeployPoll(event: DeployPollEvent): void {
  const maci = createOrLoadMACI(event);

  const entity = new Poll(event.params.pollAddr.poll);
  const contract = PollContract.bind(event.params.pollAddr.poll);
  const maxValues = contract.maxValues();
  const treeDepths = contract.treeDepths();
  const durations = contract.getDeployTimeAndDuration();

  entity.pollId = event.params._pollId;
  entity.messageProcessor = event.params.pollAddr.messageProcessor;
  entity.tally = event.params.pollAddr.tally;
  entity.maxMessages = maxValues.value0;
  entity.maxVoteOption = maxValues.value1;
  entity.treeDepth = GraphBN.fromI32(treeDepths.value0);
  entity.duration = durations.value1;

  entity.blockNumber = event.block.number;
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.owner = event.transaction.from;

  entity.numSignups = maci.numSignUps;
  entity.numMessages = GraphBN.zero();

  const coordinator = createOrLoadUser(event.params._coordinatorPubKeyX, event.params._coordinatorPubKeyY, event);
  entity.coordinator = coordinator.id;
  entity.save();

  maci.numPoll = maci.numPoll.plus(ONE_BIGINT);
  maci.latestPoll = entity.id;
  maci.updatedAt = event.block.timestamp;
  maci.save();

  // Start indexing the poll; `event.params.pollAddr.poll` is the
  // address of the new poll contract
  PollTemplate.create(Address.fromBytes(entity.id));
}

export function handleSignUp(event: SignUpEvent): void {
  const user = createOrLoadUser(event.params._userPubKeyX, event.params._userPubKeyY, event);
  createOrLoadAccount(event.params._stateIndex, event, user.id, event.params._voiceCreditBalance);

  const maci = createOrLoadMACI(event);
  maci.numSignUps = maci.numSignUps.plus(ONE_BIGINT);
  maci.updatedAt = event.block.timestamp;
  maci.save();

  const poll = Poll.load(maci.latestPoll);

  if (poll) {
    poll.numSignups = poll.numSignups.plus(ONE_BIGINT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}
