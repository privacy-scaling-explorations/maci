/* eslint-disable no-underscore-dangle */
import { Address, BigInt as GraphBN } from "@graphprotocol/graph-ts";

import { DeployPoll as DeployPollEvent, SignUp as SignUpEvent, MACI as MaciContract } from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { ONE_BIG_INT, MESSAGE_TREE_ARITY } from "./utils/constants";
import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount } from "./utils/entity";

export function handleDeployPoll(event: DeployPollEvent): void {
  const maci = createOrLoadMACI(event);

  const id = event.params._pollId;

  const maciContract = MaciContract.bind(Address.fromBytes(maci.id));
  const contracts = maciContract.getPoll(id);
  const poll = new Poll(contracts.poll);
  const contract = PollContract.bind(contracts.poll);
  const treeDepths = contract.treeDepths();
  const durations = contract.getDeployTimeAndDuration();

  poll.pollId = id;
  poll.messageProcessor = contracts.messageProcessor;
  poll.tally = contracts.tally;
  poll.maxMessages = GraphBN.fromI32(MESSAGE_TREE_ARITY ** treeDepths.getMessageTreeDepth());
  poll.maxVoteOption = GraphBN.fromI32(MESSAGE_TREE_ARITY ** treeDepths.getVoteOptionTreeDepth());
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
