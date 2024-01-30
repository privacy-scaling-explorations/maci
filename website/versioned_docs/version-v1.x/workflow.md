---
title: MACI Workflow
description: Overview of the MACI workflow
sidebar_label: Workflow
sidebar_position: 3
---

<!-- TODO: Better name for this than "Workflow"? Lifecycle? -->
<!-- "Overview" - change overview.md to codebase.md or "architecture"??? -->

<!-- Overview should be an overview of the system... it's a state machine for voting (polls) -->
<!-- TODO: explain state machine. Deploy Polls. "Voting" period. "Closed" period. "Finalized" period. -->
<!-- Ultimately it's just the lifecycle of a Poll... -->
<!-- MACI contract just maintains  -->

<!-- "roles" as an independent page? Or "workflow" may be fine -->

<!-- https://medium.com/privacy-scaling-explorations/a-technical-introduction-to-maci-1-0-db95c3a9439a -->
<!-- TODO: create flowcharts, similar to to Kyle's (but make light/dark mode compatible) -->

# MACI Workflow

This article covers the general workflow, which borrows heavily from our [Technical Introduction to MACI](/blog/maci-1-0-technical-introduction#system-overview).

## Roles

In the MACI workflow, there are two key roles:

1. Users, who vote on Polls
2. A trusted coordinator, who tallies up the votes and releases the final results

### User (voter)

A "User" is any voter in a MACI poll.

In order to participate in a MACI poll, a user will perform at least 2 on-chain transactions:

1. Sign up with MACI
2. Submit a vote to a Poll

Before a user can cast a vote, they must sign up by generating a MACI keypair and then sending the public key they wish to use to vote to the MACI smart contract. This MACI public key (distinct from their Ethereum public key) acts as their identity when voting. Users can vote from any Ethereum address, but their message must contain a signature from that MACI public key.

To cast a vote after signing up, a user will bundle a few variables — including a public key, their vote option, their vote amount, and a few others — into what is called a "command". Then, the user signs the command with the public key they originally used to sign up. After that, the user encrypts the signature and command together so that it is now considered a "message". If the command is properly signed by the user’s MACI public key, then the message is considered valid will be counted in the final tally. Therefore, the MACI public key can be thought of as the user’s voting username, and the signature is the voting password. If they provide the correct signature, they can submit a vote.

Before sending their vote on the blockchain, users encrypt their vote using a shared key that only the user and coordinator can know. This key scheme is designed so that every individual user shares a distinct key with the coordinator. This prevents any bribers from simply reading the transaction data to see which option a user voted for. It also allows the coordinator to decrypt user votes (so that they can tally the results).

<!-- TODO: add chart that highlights this -->
<!-- https://miro.medium.com/v2/resize:fit:1400/format:webp/0*whHfC8-xxAwSyaaO -->

### Coordinator

The "Coordinator" helps execute MACI polls. They are responsible for deploying the MACI smart contracts, initiating polls, tallying the final results of a vote, and finalizing polls by publishing the final results on-chain.

:::info
Note: it's possible for the contract deployer and the coordinator to be two separate accounts/entities, but for simplicity we'll start by assuming these functions are the same role.
:::

Once a voting poll has completed, the coordinator has the sole ability to decrypt all user votes and tally up the total results. The coordinator then publishes commitments and proofs of these results on chain to finalize a poll.

The coordinators must use zk-SNARKs proofs to guarantee that their final tally result is valid, and this is accomplished without releasing the vote of every individual.

We say the coordinator is a "trusted" coordinator, because there's areas where a corrupt (or inept) coordinator could disrupt the happy path of the MACI workflow. \

For instance, a coordinator can:

- decrypt votes to publish them, or to bribe individual voters
- halt a round, by never tallying results or submitting the final proofs

A coordinator cannot:

- Publish incorrect results (either by censoring valid votes or creating fraudulent votes)
- Change the parameters of a Poll (e.g. extend its voting duration) once it's been deployed

Therefore, even if a coordinator is corrupt, they are unable to change a user’s vote or add extra votes themselves. A corrupt coordinator can stop a vote by never publishing the results, but they can’t publish false results.

### MACI creator/owner

The "owner" of the MACI smart contract. By default, this is the deployer, but could be set to anyone.

## Contracts

To explain the MACI workflow, let's give a quick overview of the key smart contracts.

### MACI

The MACI contract is responsible for keeping track of user signups by recording the initial public key for each user. To conduct a voting round, the coordinator can deploy a Poll via MACI (with the [`deployPoll` function](/docs/solidity-docs/MACI#deploypoll)).

### Poll

The Poll contract is where users submit their votes. One MACI contract can be used for multiple polls. In other words, a user that signed up to the MACI contract can vote on multiple issues, with each issue represented by a distinct Poll contract.

### MessageProcessor and Tally

The MessageProcessor and Tally contracts are used by the coordinator to process all user votes and to prove on-chain that they correctly tallied each vote.

See our [smart contract docs](/docs/contracts) for a more in-depth explanation of all smart contracts.

## Poll lifecycle

As described above, a key contract of MACI is a Poll. Coordinators can deploy polls and add vote options to polls, which users can then vote on. Although each instance of MACI can deploy multiple Polls, only one Poll can be active at a time.

Each MACI Poll has essentially 3 stages:

1. Open
2. Closed
3. Finalized

### 1) Open

When a Poll is deployed, its voting period starts immediately. As part of its deployment, the `duration` of the Poll is set, which determines how long the Poll is open for voting.

### 2) Closed

A Poll is "closed", when the voting period ends. At this point, no users may submit any more votes. The Poll remains closed until the coordinator tallies the final results.

### 3) Finalized

In order to finalize a Poll, the coordinator must process all the messages, tally the results, and publish the on-chain proofs.

# Workflow

The general workflow process can be broken down into 4 different phases:

1. Sign Up
2. Publish Message
3. Process Messages
4. Tally Results

## 1. Sign Up

The sign up process for MACI is handled via the MACI.sol smart contract. Users need to send three pieces of information when calling MACI.signUp():

Public Key
Sign Up Gatekeeper Data
Initial Voice Credit Proxy Data
The public key is the original public key mentioned in above sections that the user will need to vote.

MACI allows the contract creator/owner to set a “signUpGateKeeper”. The sign up gatekeeper is meant to be the address of another smart contract that determines the rules to sign up. So, when a user calls MACI.signUp(), the function will call the sign up gatekeeper to check if this user is valid to sign up.

This “signUpGateKeeper” contract could use any custom logic it wants - it could be a whitelist of addresses, it allow only holders of a specific NFT, or some other anti-sybil / verification mechanism.

Once MACI has checked that the user is valid and retrieved how many voice credits they have, MACI stores the following user info into the Sign Up Merkle Tree:

Public Key
Voice Credits
Timestamp

https://miro.medium.com/v2/resize:fit:1400/format:webp/0*h6otS_gfiZ2Wjvoq

## 2. Publish Message

Once it is time to vote, the MACI creator/owner will deploy a Poll smart contract. Then, users will call Poll.publishMessage() and send the following data:

1. Message
2. Encryption Key

As explained in sections above, the coordinator will need to use the encryption key in order to derive a shared key. The coordinator can then use the shared key to decrypt the message into a command, which contains the vote.

Once a user publishes their message, the Poll contract will store the message and encryption key into the Message Merkle Tree.

## 3. Process Messages

Once the voting is done for a specific poll, the coordinator will use the PollProcessAndTallyer contract to first prove that they have correctly decrypted each message and applied them to correctly create an updated state tree. This state tree keeps an account of all the valid votes that should be counted. So, when processing the messages, the coordinator will not keep messages that are later overridden by a newer message inside the state tree. For example, if a user votes for option A, but then later sends a new message to vote for option B, the coordinator will only count the vote for option B.

The coordinator must process messages in groups so that proving on chain does not exceed the data limit. The coordinator then creates a zk-SNARK proving their state tree correctly contains only the valid messages. Once the proof is ready, the coordinator calls PollProcessorAndTallyer.processMessages(), providing a hash of the state tree and the zk-SNARK proof as an input parameters.

The PollProcessorAndTallyer contract will send the proof to a separate verifier contract. The verifier contract is specifically built to read MACI zk-SNARK proofs and tell if they are valid or not. So, if the verifier contract returns true, then everyone can see on-chain that the coordinator correctly processed that batch of messages. The coordinator repeats this process until all messages have been processed.

## 4. Tally Results

Finally, once all messages have been processed, the coordinator tallies the votes of the valid messages (off-chain). The coordinator creates a zk-SNARK proving that the valid messages in the state tree (proved in Process Messages step) contain votes that sum to the given tally result. Then, they call PollProcessorAndTallyer.tallyVotes() with a hash of the correct tally results and the zk-SNARK proof. Similarly to the processMessages function, the tallyVotes function will send the proof to a verifier contract to ensure that it is valid.

<!-- "hash of the correct tally results" - so are the final results actually put on chain? or just a hash?? -->

The tallyVotes function is only successful if the verifier contract returns that the proof is valid. Therefore, once the tallyVotes function succeeds, users can trust that the coordinator has correctly tallied all of the valid votes. After this step, anyone can see the final tally results and the proof that these results are a correct result of the messages sent to the Poll contract. The users won’t be able to see how any individual voted, but will be able to trust that these votes were properly processed and counted.

<!-- "After this step, anyone can see the final tally results" - how if only hash of results are published? -->

https://miro.medium.com/v2/resize:fit:1400/format:webp/0*7Le2odbX7e2etpxR

## Simple flow

<!-- TODO: outline the simple happy path flow of MACI -->
<!-- Simple voting flow, with no key switching -->

High level
On-chain transations

- (Coordinator) Deploy MACI smart contracts
- (Coordinator) Deploy poll via MACI (e.g. voting poll, QF round)
  - Specify duration of poll?
- (Users) Register / sign up with MACI (& generate MACI key)
- (Users) Vote for a poll (with a message)
- (Users) optionally over-ride votes and/or switch public keys
- (Coordinator) Process messages
- (Coordinator) Tally results (off-chain??)
- (Coordinator) Publish results on chain with zk-SNARK proof

### (Coordinator) Deploy MACI smart contracts

### (Coordinator) Deploy poll via MACI (e.g. voting poll, QF round)

### (Users) Register / sign up with MACI (& generate MACI key)

### (Users) Vote for a poll (with a message)

### (Users) optionally over-ride votes and/or switch public keys

Users are able to override their previous vote as long as they sign their command with the previous public key. If the command is properly signed by the user’s previous public key, then the message is considered valid and the coordinator will count this as the correct vote. So, when a user provides a public key in their vote that is different than their previous public key, they may now submit a new vote signed by this new public key to override their previous vote. If the signature is not from the previous public key, the message will be marked as invalid and not counted toward the tally.

### (Coordinator) Process messages

### (Coordinator) Tally results (off-chain??)

### (Coordinator) Publish results on chain with zk-SNARK proof

Here, everyone is able to see the messages on the blockchain and the total tally result. Only the coordinator knows what the individual commands/votes are by decrypting the messages. So, the coordinator uses a zk-SNARK to prove they know all of the votes that:

1. Encrypt to the messages present on the blockchain
2. Sum to the tally result

Users can then use the SNARK to prove that the tally result is correct, but cannot use it to prove any individual’s vote choices.

<!-- QUESTION: why would they need to use the SNARK to prove the results are correct? Won't the tx fail if the proof is not valid? Is this for the case they don't trust the smart contract to verify the proof? -->
