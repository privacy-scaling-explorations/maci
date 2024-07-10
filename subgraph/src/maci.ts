/* eslint-disable no-underscore-dangle */
import { Address, BigInt as GraphBN } from "@graphprotocol/graph-ts";

import { DeployPoll as DeployPollEvent, SignUp as SignUpEvent } from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { ONE_BIG_INT } from "./utils/constants";
import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount } from "./utils/entity";

export function handleDeployPoll(event: DeployPollEvent): void {
  const maci = createOrLoadMACI(event);

  const poll = new Poll(event.params.pollAddr.poll);
  const contract = PollContract.bind(event.params.pollAddr.poll);
  const maxVoteOptions = contract.maxVoteOptions();
  const treeDepths = contract.treeDepths();
  const durations = contract.getDeployTimeAndDuration();

  poll.pollId = event.params._pollId;
  poll.messageProcessor = event.params.pollAddr.messageProcessor;
  poll.tally = event.params.pollAddr.tally;
  poll.maxVoteOption = maxVoteOptions;
  poll.treeDepth = GraphBN.fromI32(treeDepths.value0);
  poll.duration = durations.value1;
  poll.mode = GraphBN.fromI32(event.params._mode);

  poll.createdAt = event.block.timestamp;
  poll.updatedAt = event.block.timestamp;
  poll.owner = event.transaction.from;

  poll.numSignups = maci.numSignUps;
  poll.numMessages = GraphBN.zero();
  poll.maci = maci.id;
  poll.save();

  maci.numPoll = maci.numPoll.plus(ONE_BIG_INT);
  maci.latestPoll = poll.id;
  maci.updatedAt = event.block.timestamp;
  maci.save();

  // Start indexing the poll; `event.params.pollAddr.poll` is the
  // address of the new poll contract
  PollTemplate.create(Address.fromBytes(poll.id));
}

export function handleSignUp(event: SignUpEvent): void {
  const user = createOrLoadUser(event.params._userPubKeyX, event.params._userPubKeyY, event);
  createOrLoadAccount(event.params._stateIndex, event, user.id, event.params._voiceCreditBalance);

  const maci = createOrLoadMACI(event);
  maci.numSignUps = maci.numSignUps.plus(ONE_BIG_INT);
  maci.updatedAt = event.block.timestamp;
  maci.save();

  const poll = Poll.load(maci.latestPoll);

  if (poll) {
    poll.numSignups = poll.numSignups.plus(ONE_BIG_INT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}
