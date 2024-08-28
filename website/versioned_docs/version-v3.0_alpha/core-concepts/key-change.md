---
title: Key change
description: How key change messages work
sidebar_label: Key change
sidebar_position: 8
---

MACI's voters are globally identified by their MACI public key. Together with their private key, they can join live Polls. For each live Poll, the user wants to join, the user generates a new key pair. With the help of ZK proofs, this schema prevents the coordinator from creating a link between the user's public MACI key and the Poll-specific keys. With the Poll keys, the user can sign and submit messages to live Polls.

As MACI's main property is to provide collusion resistance in digital voting applications, it is important to have a mechanism for a user to change their Poll voting key, should this become compromised, or they wish to revoke past actions.

## How MACI messages are processed

In order to understand how key changing currently works in MACI, we need to understand how messages are processed.

After a poll ends, the coordinator processes messages off chain in reverse order. To improve efficiency, messages are processed in batches, and correctness is proved for each batch using a zk-SNARK circuit.

Due to messages being processed in reverse order, key change messages would work a bit differently than if they were processed in the same order as they were submitted.

## Why are messages processed in reverse order?

Reverse processing was introduced to prevent a type of attack where a briber would collude with a voter to sign up, and then submit a message to change their key to a key that the briber controls. This way the briber would have assurance that they could submit the vote they want.

Let's take as an example the following:

1. Alice signs up with pub key $pub1$ and joins $Poll$ with pub key $pollPub1$
2. Bob (Briber) bribes Alice and asks her to submit a Poll key change message to $pollPub2$ (owned by Bob)
3. Bob submits a vote with $pollPub2$
4. Alice submits a vote with $pollPub1$

If messages were processed in the same order as they were submitted, Alice's vote would not be valid, due to it being signed with a private key $pollPriv1$ - which now would not be valid.

On the other hand, due to messages being processed in reverse order, Alice's last message would be counted as valid as the key change would have not been processed yet. Then, Bob's vote would not be counted as valid as the current key for Alice would be $pollPub1$.

> Note that a key change message should have the nonce set to 1 in order for it to be valid. We'll see a code example in the next sections.

## Then how can a voter change their key and submit a new vote?

A user can submit a key change message by simply sending a new message signed with their signup key, and setting the nonce to 1. This is because the code checks that the first message to be processed has the nonce set to 1.

Let's take a look into a code example:

> We have two users, and five keypairs

- Create five keypairs

```ts
// Two MACI keypairs
const user1Keypair = new Keypair();
const user2Keypair = new Keypair();

// Two Poll keypairs for each user respectively
const pollUser1Keypair = new Keypair();
const pollUser2Keypair = new Keypair();

// Second Poll keypair
const secondPollKeypair = new Keypair();
```

- Votes will be

```ts
// user1 votes for project 0
const user1VoteOptionIndex = BigInt(0);
// user2 votes for project 1
const user2VoteOptionIndex = BigInt(1);
// user1 votes 9 for the first vote
const user1VoteWeight = BigInt(9);
// user2 votes 3
const user2VoteWeight = BigInt(3);
// user1 will change their vote to 5
const user1NewVoteWeight = BigInt(5);
```

- What do we expect as result

```
project 0 = 5 * 5 -> 25
project 1 = 3 * 3 -> 9
```

As seen above, we expect the first vote weight 9 to not be counted, but instead the second vote weight 5 to be counted.

- Deploy a MaciState locally, sign up, and join the poll

```ts
const maciState: MaciState = new MaciState(STATE_TREE_DEPTH);
const maciState: MaciState = new MaciState(STATE_TREE_DEPTH);
// Sign up
user1StateIndex = maciState.signUp(user1Keypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
user2StateIndex = maciState.signUp(user2Keypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
// deploy a poll
pollId = maciState.deployPoll(
  duration,
  BigInt(Math.floor(Date.now() / 1000) + duration),
  maxValues,
  treeDepths,
  messageBatchSize,
  coordinatorKeypair,
);
```

- User1 and user2 join the poll and submit their first votes

```ts
const poll = maciState.polls[pollId];

// Join poll
const nullifier1 = poseidon([user1Keypair.privKey.asCircuitInputs()]);
const nullifier2 = poseidon([user2Keypair.privKey.asCircuitInputs()]);

poll.joinPoll(nullifier1, pollUser1Keypair.pubKey, newVoiceCreditBalance, Date.now());
poll.joinPoll(nullifier2, pollUser2Keypair.pubKey, newVoiceCreditBalance, Date.now());

// Prepare and cast votes
const command1 = new PCommand(
  BigInt(user1PollStateIndex),
  pollUser1Keypair.pubKey,
  user1VoteOptionIndex,
  user1VoteWeight,
  BigInt(1),
  BigInt(pollId),
);

const signature1 = command1.sign(pollUser1Keypair.privKey);

const ecdhKeypair1 = new Keypair();
const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);

const message1 = command1.encrypt(signature1, sharedKey1);
poll.publishMessage(message1, ecdhKeypair1.pubKey);

const command2 = new PCommand(
  BigInt(user2StateIndex),
  pollUser2Keypair.pubKey,
  user2VoteOptionIndex,
  user2VoteWeight,
  BigInt(1),
  BigInt(pollId),
);

const signature2 = command2.sign(pollUser2Keypair.privKey);

const ecdhKeypair2 = new Keypair();
const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);

const message2 = command2.encrypt(signature2, sharedKey2);
poll.publishMessage(message2, ecdhKeypair2.pubKey);
```

- User1 submits a key change message with the new vote

```ts
const poll = maciState.polls[pollId];
const command = new PCommand(
  BigInt(user1PollStateIndex),
  secondPollKeypair.pubKey,
  user1VoteOptionIndex,
  user1NewVoteWeight,
  BigInt(1),
  BigInt(pollId),
);

const signature = command.sign(pollUser1Keypair.privKey);

const ecdhKeypair = new Keypair();
const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

const message = command.encrypt(signature, sharedKey);
poll.publishMessage(message, ecdhKeypair.pubKey);
```

- We process the votes and check that the result is as expected (`user1NewVoteWeight` was 5 and `user2VoteWeight` 3)

```ts
const poll = maciState.polls[pollId];
poll.processMessages(pollId);
poll.tallyVotes();
expect(poll.perVOSpentVoiceCredits[0].toString()).to.eq((user1NewVoteWeight * user1NewVoteWeight).toString());
expect(poll.perVOSpentVoiceCredits[1].toString()).to.eq((user2VoteWeight * user2VoteWeight).toString());
```

- Finally confirm that the keypair was changed for the user1

```ts
const poll = maciState.polls[pollId];
const pollStateLeaf1 = poll.stateLeaves[user1PollStateIndex];
const pollStateLeaf2 = poll.stateLeaves[user2PollStateIndex];
expect(pollStateLeaf1.pubKey.equals(secondPollKeypair.pubKey)).to.eq(true);
expect(pollStateLeaf2.pubKey.equals(pollUser2Keypair.pubKey)).to.eq(true);
```

We see that is important that we set the final message (the one with the new vote) with nonce 1, as this vote would be counted as the first vote.

:::info
Tests related to key changes have been added to the [core package](https://github.com/privacy-scaling-explorations/maci/blob/dev/core/ts/__tests__/) and to the [cli package](https://github.com/privacy-scaling-explorations/maci/blob/dev/cli/tests/).
:::
