/* eslint-disable no-underscore-dangle */
// eslint-disable-next-line @typescript-eslint/no-shadow
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  DeployPoll as DeployPollEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SignUp as SignUpEvent,
} from "../generated/MACI/MACI";
import { Poll } from "../generated/schema";
import { Poll as PollTemplate } from "../generated/templates";

import { ONE_BIGINT } from "./utils/constants";
import { createOrLoadMACI, createOrLoadUser, createOrLoadAccount, createOrLoadStateLeaf } from "./utils/helper";

export function handleDeployPoll(event: DeployPollEvent): void {
  const maci = createOrLoadMACI(event);
  const entity = new Poll(event.params.pollAddr.poll);
  entity.pollId = event.params._pollId;
  entity.messageProcessor = event.params.pollAddr.messageProcessor;
  entity.tally = event.params.pollAddr.tally;
  entity.subsidy = event.params.pollAddr.subsidy;

  // override data
  entity.duration = BigInt.zero();
  entity.maxVoteOptions = BigInt.zero();
  entity.treeDepth = 0;

  entity.blockNumber = event.block.number;
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  // dummy data
  entity.numSignups = BigInt.zero();

  const owner = createOrLoadUser(event.transaction.from, event);
  const coordinator = createOrLoadAccount(event.params._pubKey.x, event.params._pubKey.y, event, owner.id);
  entity.coordinator = coordinator.id;
  entity.owner = owner.id;
  entity.save();

  maci.numPoll = maci.numPoll.plus(ONE_BIGINT);
  maci.save();

  // Start indexing the poll; `event.params.pollAddr.poll` is the
  // address of the new poll contract
  PollTemplate.create(Address.fromBytes(entity.id));
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  const entity = createOrLoadMACI(event);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  entity.owner = changetype<Bytes>(event.params.newOwner);
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
  maci.numRegistrar = maci.numRegistrar.plus(ONE_BIGINT);
  maci.save();
}
