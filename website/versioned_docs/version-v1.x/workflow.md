--
title: MACI Workflow
description: Overview of the workflow/lifecycle of MACI
sidebar_label: Workflow
sidebar_position: ?
--

<!-- TODO: Better name for this than "Workflow"? Lifecycle? -->

<!-- https://medium.com/privacy-scaling-explorations/a-technical-introduction-to-maci-1-0-db95c3a9439a -->
<!-- TODO: create flowcharts, similar to to Kyle's (but make light/dark mode compatible) -->

# MACI Workflow

This article will go over the general workflow of MACI
This document borrows heavily from Kyle's great article:
https://medium.com/privacy-scaling-explorations/a-technical-introduction-to-maci-1-0-db95c3a9439a

Thanks Kyle!

# System overview

<!-- TODO break up "system overview" & "workflow" into separate pages? -->
<!-- 1. system overview gives high-level user roles & architecture  -->
<!-- 2. workflow explains the flow of a poll  -->

## Roles

In the MACI workflow, there are two different roles: users (voters) and a single trusted coordinator. The users vote on the blockchain via MACI smart contracts, and the coordinator tallies up the votes and releases the final results.

<!-- TODO: should we differentiate the "deployer" as someone potentially separate from the coordinator -->

### User (voter)

A "User" is any voter in a MACI poll.

In order to participate in a MACI poll, a user will:

1.  Sign up with MACI (via an on-chain transation)
2.  Submit a vote to the MACI smart contracts (via an on-chain transation)

Before a user can cast a vote, they must sign up by generating a MACI keypair and then sending the public key they wish to use to vote to a MACI smart contract. This public key acts as their identity when voting.

Users can vote from any Ethereum address, but their message must contain a signature from that public key.

When casting an actual vote after signing up, a user will bundle a few variables — including a public key, their vote option, their vote amount, and a few others — into what is called a “command”. Then, the user signs the command with the public key they originally used to sign up. After that, the user encrypts the signature and command together so that it is now considered a message.

If the command is properly signed by the user’s previous MACI public key, then the message is considered valid and the coordinator will count this as the correct vote.
Therefore, the MACI public key can be thought of as the user’s voting username, and the signature is the voting password. If they provide the correct signature, they can submit a vote or change their public key — or both.

<!-- TODO: add chart that highlights this -->
<!-- https://miro.medium.com/v2/resize:fit:1400/format:webp/0*whHfC8-xxAwSyaaO -->

Before sending their vote on the blockchain, users encrypt their vote using a shared key that only the user and coordinator can know. This key scheme is designed so that every individual user shares a distinct key with the coordinator. This prevents any bribers from simply reading the transaction data to see which option a user voted for, as well as allows the coordinator to decrypt user votes (so that they can tally the results).

<!-- TODO: get into vote overriding? Prob not yet -->

### Coordinator

The "Coordinator" helps execute MACI polls. They are responsible for deploying the MACI smart contracts, initiating polls, tallying the final results of a vote, and finalizing polls by publishing the final results on-chain.

<!-- TODO break out MACI owner? -->

Note: it's possible for the contract deployer and the coordinator to be two separate accounts/entities, but for simplicity we'll start by assuming those are the same.

Once a voting round has completed, the coordinator uses their key to decrypt all user votes and tally up the results. The coordinator publishes these results on chain to finalize a poll.

The coordinators must use zk-SNARKs to prove that their final tally result is valid without releasing the vote of every individual. Therefore, even if a coordinator is corrupt, they are unable to change a user’s vote or add extra votes themselves. A corrupt coordinator can stop a vote by never publishing the results, but they can’t publish false results.

### MACI creator/owner

The "owner" of the MACI smart contract. By default, this is the deployer, but could be set to anyone.

## Contracts

<!-- Should this be in the contract page? Or brief overview is helpful? -->
<!-- Explain merkle trees? Signup & Message? -->

MACI, Poll and ​​PollProcessorAndTallyer
https://miro.medium.com/v2/resize:fit:1400/format:webp/0*NA8cwQvAhZoX7Pia

### MACI

The MACI contract is responsible for keeping track of all the user sign ups by recording the initial public key for each user. When a vote is going to take place, users can deploy a Poll smart contract via MACI.deployPoll().

### Poll

The Poll smart contract is where users submit their messages. One MACI contract can be used for multiple polls. In other words, the users that signed up to the MACI contract can vote on multiple issues, with each issue represented by a distinct Poll contract.

### ​​PollProcessorAndTallyer

Finally, the PollProcessorAndTallyer contract is used by the coordinator to prove on-chain that they are correctly tallying each vote. This process is explained in more detail in the Process Messages and Tally Results sections below.

## Public key switching?

## zk-SNARKs

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

## Public key switching

<!-- TODO: outline a more complex potential flow of MACI -->
<!-- User key switches when voting to override a vote -->

Users are able to override their previous vote as long as they sign their command with the previous public key. If the command is properly signed by the user’s previous public key, then the message is considered valid and the coordinator will count this as the correct vote. So, when a user provides a public key in their vote that is different than their previous public key, they may now submit a new vote signed by this new public key to override their previous vote. If the signature is not from the previous public key, the message will be marked as invalid and not counted toward the tally. Therefore, the public key can be thought of as the user’s voting username, and the signature is the voting password. If they provide the correct signature, they can submit a vote or change their public key — or both.

This feature, which I refer to as public key switching, is designed to counter the bribery attack where a user simply shows the briber their message, and then decrypts it for the briber to see which way the user voted. Public key switching allows users to change their public key and create invalid messages in favor of the bribers. The bribers have no way of telling if the user switched their public keys before sending in the vote shown to the bribers.

This can be quite confusing so here is an example:

Bob signs up with public key 1
Bob then creates a command that contains — a vote for option A and public key 2
Bob signs this command with public key 1, the key he used to sign up
Bob encrypts this command into a message and submits it to the MACI smart contracts
The coordinator decrypts this message, and checks to ensure that the command is signed by Bob’s previous key — public key 1. This message is valid.
The coordinator then records Bob’s vote for option A and updates his public key to public key 2

https://miro.medium.com/v2/resize:fit:1400/format:webp/0*t3CAiLfDniv2fkYI
