/* eslint-disable no-underscore-dangle */
import { Address, BigInt as GraphBN } from "@graphprotocol/graph-ts";

import {
  DeployPoll as DeployPollEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SignUp as SignUpEvent,
} from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";
import { Poll as PollContract } from "../generated/templates/Poll/Poll";

import { ONE_BIGINT } from "./utils/constants";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  entity.treeDepth = treeDepths.value0;
  entity.duration = durations.value1;

  entity.blockNumber = event.block.number;
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.numSignups = GraphBN.zero();

  const owner = createOrLoadUser(event.transaction.from, event);
  const coordinator = createOrLoadAccount(
    event.params._coordinatorPubKeyX,
    event.params._coordinatorPubKeyY,
    event,
    owner.id,
  );
  entity.coordinator = coordinator.id;
  entity.owner = owner.id;
  entity.save();

  const maci = createOrLoadMACI(event);
  maci.numPoll = maci.numPoll.plus(ONE_BIGINT);
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
  const account = createOrLoadAccount(event.params._userPubKeyX, event.params._userPubKeyY, event, entity.id);
  createOrLoadStateLeaf(event.params._stateIndex, event, account.id, event.params._voiceCreditBalance);

  const maci = createOrLoadMACI(event);
  maci.numSignUps = maci.numSignUps.plus(ONE_BIGINT);
  maci.save();
}
