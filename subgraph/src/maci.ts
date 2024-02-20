import { Address } from "@graphprotocol/graph-ts";

import {
  DeployPoll as DeployPollEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SignUp as SignUpEvent,
} from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount, createOrLoadStateLeaf } from "./utils/helper";

export function handleDeployPoll(event: DeployPollEvent): void {
  const entity = new Poll(event.params.pollAddr.poll);
  const contract = PollContract.bind(event.params.pollAddr.poll);
  const maxValues = contract.maxValues();
  const treeDepths = contract.treeDepths();
  const durations = contract.getDeployTimeAndDuration();

  entity.pollId = event.params._pollId;
  entity.messageProcessor = event.params.pollAddr.messageProcessor;
  entity.tally = event.params.pollAddr.tally;
  entity.subsidy = event.params.pollAddr.subsidy;
  entity.maxMessages = maxValues.value0;
  entity.maxVoteOption = maxValues.value1;

  entity.treeDepth = treeDepths.value0;
  entity.duration = durations.value1;

  entity.blockNumber = event.block.number;
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.numSignups = 0n;

  const owner = createOrLoadUser(event.transaction.from, event);
  const coordinator = createOrLoadAccount(event.params._pubKey.x, event.params._pubKey.y, event, owner.id);
  entity.coordinator = coordinator.id;
  entity.owner = owner.id;
  entity.save();

  const maci = createOrLoadMACI(event);
  maci.numPoll += 1n;
  maci.save();

  // Start indexing the poll; `event.params.pollAddr.poll` is the
  // address of the new poll contract
  PollTemplate.create(Address.fromBytes(entity.id));
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  const entity = createOrLoadMACI(event);
  entity.owner = event.params.newOwner;
  entity.blockNumber = event.block.number;
  entity.updatedAt = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.save();
}

export function handleSignUp(event: SignUpEvent): void {
  const entity = createOrLoadUser(event.transaction.from, event);
  const account = createOrLoadAccount(event.params._userPubKey.x, event.params._userPubKey.y, event, entity.id);
  createOrLoadStateLeaf(event.params._stateIndex, event, account.id, event.params._voiceCreditBalance);

  const maci = createOrLoadMACI(event);
  maci.numSignUps += 1n;
  maci.save();
}
