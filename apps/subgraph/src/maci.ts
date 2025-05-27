/* eslint-disable no-underscore-dangle */
import { Address, BigInt as GraphBN } from "@graphprotocol/graph-ts";

import { DeployPoll as DeployPollEvent, SignUp as SignUpEvent, MACI as MaciContract } from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { ONE_BIG_INT } from "./utils/constants";
import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount } from "./utils/entity";

export function handleDeployPoll(event: DeployPollEvent): void {
  const maci = createOrLoadMACI(event);

  const id = event.params._pollId;

  const maciContract = MaciContract.bind(Address.fromBytes(maci.id));
  const contracts = maciContract.getPoll(id);
  const poll = new Poll(contracts.poll);
  const pollContract = PollContract.bind(contracts.poll);
  const voteOptions = pollContract.voteOptions();
  const treeDepths = pollContract.treeDepths();
  const durations = pollContract.getStartAndEndDate();
  const duration = durations.value1.minus(durations.value0);

  poll.pollId = event.params._pollId;
  poll.messageProcessor = contracts.messageProcessor;
  poll.tally = contracts.tally;
  poll.voteOptions = voteOptions;
  poll.treeDepth = GraphBN.fromI32(treeDepths.value0);
  poll.duration = duration;
  poll.startDate = durations.value0;
  poll.endDate = durations.value1;
  poll.mode = GraphBN.fromI32(event.params._mode);

  poll.createdAt = event.block.timestamp;
  poll.updatedAt = event.block.timestamp;
  poll.owner = event.transaction.from;

  // No users would have joined the poll yet
  poll.totalSignups = GraphBN.zero();
  poll.numMessages = GraphBN.zero();
  poll.maci = maci.id;
  poll.save();

  maci.numPoll = maci.numPoll.plus(ONE_BIG_INT);
  maci.latestPoll = poll.id;
  maci.updatedAt = event.block.timestamp;
  maci.save();

  // Start indexing the poll; `event.params.pollAddresses.poll` is the
  // address of the new poll contract
  PollTemplate.create(Address.fromBytes(poll.id));
}

export function handleSignUp(event: SignUpEvent): void {
  const user = createOrLoadUser(event.params._userPublicKeyX, event.params._userPublicKeyY, event);
  createOrLoadAccount(event.params._stateIndex, event, user.id);

  const maci = createOrLoadMACI(event);
  maci.totalSignups = maci.totalSignups.plus(ONE_BIG_INT);
  maci.updatedAt = event.block.timestamp;
  maci.save();

  const poll = Poll.load(maci.latestPoll);

  if (poll) {
    poll.totalSignups = poll.totalSignups.plus(ONE_BIG_INT);
    poll.updatedAt = event.block.timestamp;
    poll.save();
  }
}
