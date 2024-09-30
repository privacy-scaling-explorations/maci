---
title: MACI Workflow
description: Overview of the MACI workflow
sidebar_label: Workflow
sidebar_position: 4
---

<!-- TODO: create flowcharts, similar to Kyle's (but make light/dark mode compatible) -->

# MACI Workflow

This article covers the high-level MACI workflow, which borrows heavily from our [Technical Introduction to MACI](/blog/maci-1-0-technical-introduction#system-overview).

## Roles

There are two key roles that participate in MACI:

1. Users, who vote on polls
2. A trusted coordinator, who configures and launches polls, tallies up votes, and publishes the final results

### User (voter)

A "User" is any voter in a MACI poll.

In order to participate in a MACI poll, a user will perform at least 2 on-chain transactions:

1. Sign up with MACI
2. Vote on a poll

<!-- TODO: add flowchart that demonstrates this (but show happy path, not key switching) -->
<!-- https://miro.medium.com/v2/resize:fit:1400/format:webp/0*whHfC8-xxAwSyaaO -->

### Coordinator

The "Coordinator" helps set up and execute MACI polls. They are responsible for deploying the MACI smart contracts, initiating polls, tallying the final results of a vote, and finalizing polls by publishing the final results on-chain.

:::info
Note: it's possible for the contract deployer and the coordinator to be two separate accounts/entities, but for simplicity we'll start by assuming these functions are the same role.
:::

Once a voting poll has completed (i.e. the voting deadline has elapsed), the coordinator has the sole ability to decrypt all user votes and tally up the total results. The coordinator then publishes commitments and proofs of these results on chain to finalize a poll. The coordinators must use zk-SNARKs proofs to guarantee that their final tally result is valid, and this is accomplished without releasing the vote of every individual.

<!-- In order to execute a MACI poll, a coordinator will perform at least 3 types of on-chain transactions:

1. deploy contracts
2. -->

#### Trust assumptions

We say the coordinator is a "trusted" coordinator, because there are areas where a corrupt (or inept) coordinator could disrupt the "happy path" of the MACI workflow.

For instance, a coordinator can:

- Decrypt votes (in order to publish them, or to bribe individual voters)
- Halt a round (by never tallying results or never submitting the final proofs)

A coordinator cannot:

- Publish incorrect results (either by censoring valid votes or creating fraudulent votes)
- Change the parameters of a poll (e.g. by extending its voting deadline once it's been deployed)

Therefore, even if a coordinator is corrupt, they are unable to change a user’s vote or add extra votes themselves. A corrupt coordinator can stop a vote by never publishing the results, but they can’t publish false results.

## Contracts

To explain the MACI workflow, let's give a quick overview of the key smart contracts.

See our [smart contract docs](/docs/category/smart-contracts) or our [contract source code](https://github.com/privacy-scaling-explorations/maci/tree/dev/contracts/contracts) for a more in-depth explanation of all smart contracts.

### MACI.sol

The MACI contract is responsible for registering user signups by recording the initial public key for each user (via the [`signUp` function](/docs/developers-references/smart-contracts/solidity-docs/MACI#signup-1)). To conduct a voting round, the coordinator can deploy a Poll via MACI (with the [`deployPoll` function](/docs/developers-references/smart-contracts/solidity-docs/MACI#deploypoll)).

### Poll.sol

The Poll contract is where users submit their votes (via the [`publishMessage` function](/docs/developers-references/smart-contracts/solidity-docs/Poll#publishmessage)). One MACI contract can be used for multiple Poll contracts. In other words, a user that signed up to the MACI contract can vote on multiple issues, with each issue represented by a distinct Poll contract.

### MessageProcessor.sol and Tally.sol

The MessageProcessor and Tally contracts are used by the coordinator to process all user votes and to prove on-chain that they correctly tallied each vote.

## Poll lifecycle

As described above, a core contract of MACI is a Poll. Coordinators can deploy polls and add vote options to polls, which users can then vote on. Although each instance of MACI can deploy multiple Polls, only one Poll can be active at a time.

In essence, each MACI Poll is a state machine which has 3 stages:

1. Open
2. Closed
3. Finalized

### 1) Open

When a Poll is deployed, its voting period starts immediately. As part of its deployment, the `duration` of the Poll is set, which determines how long the Poll is open for voting. A Poll is "open" until the duration of the Poll has elapsed.

During this stage, users can sign up and vote.

#### Sign up

Before a user can cast a vote, they must sign up by generating a MACI keypair and then sending the public key they wish to use to cast their vote to the MACI smart contract. This MACI public key (distinct from their Ethereum account public key) acts as their identity when voting. Users can vote from any Ethereum address, but their message must contain a signature from that MACI public key.

This registration process is necessary to fortify MACI against Sybil attacks. The particular criteria used to allow user signups is customizable, and can be configured using any [SignUpGatekeeper contract](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/gatekeepers/SignUpGatekeeper.sol). This contract dictates the criteria a user must pass in order to participate in a poll. For example, a user might need to prove ownership of a certain NFT, or that they've received some attestation on EAS, or prove that they have passed some sort of proof-of-personhood verification. Note that MACI presumes an identity system where each legitimate member
controls a unique private key - MACI does not specifically solve for this, but allows for customization on how this is configured.

#### Vote

Once a user has signed up with MACI, they are eligible to vote on open polls.

To cast a vote, a user will bundle a few variables — including a public key, their vote option, their vote amount, and a few others — into what is called a "command". Then, the user signs the command with the private key they originally used to sign up. After that, the user encrypts the signature and command together so that it is now considered a "message". If the command is properly signed by the user’s MACI public key, then the message is considered valid will be counted in the final tally. Therefore, the MACI public key can be thought of as the user’s voting username, and the signature is the voting password. If they provide the correct signature, they can submit a vote.

Before sending their vote on-chain, users encrypt their vote using a shared key that only the user and coordinator can know. This key scheme is designed so that every individual user shares a distinct key with the coordinator. This prevents any bribers from simply reading the transaction data to see which option a user voted for. It also allows the coordinator to decrypt user votes (so that they can tally the results).

### 2) Closed

A Poll is "closed", when the voting period ends. At this point, no users may submit any more votes. The Poll remains closed until the coordinator tallies the final results.

At this point, the coordinator must process all the messages, tally the results, and publish the proofs on-chain.

#### Process Messages

Once the voting period has completed for a specific poll, the coordinator will use the `MessageProcessor` contract to first prove that they have correctly decrypted each message and applied them to correctly create an updated state tree. This state tree keeps an account of all the valid votes that should be counted. So, when processing the messages, the coordinator will not keep messages that are later overridden by a newer message inside the state tree. For example, if a user votes for option A, but then later sends a new message to vote for option B, the coordinator will only count the vote for option B.

The coordinator must process messages in batches so that proving on chain does not exceed the data limit. The coordinator then creates a zk-SNARK proving their state tree correctly contains only the valid messages. Once the proof is ready, the coordinator calls [`MessageProcessor.processMessages()`](/docs/developers-references/smart-contracts/solidity-docs/MessageProcessor#processmessages), providing a hash of the state tree and the zk-SNARK proof as an input parameters.

The `MessageProcessor` contract will send the proof to a separate verifier contract. The verifier contract is specifically built to read MACI zk-SNARK proofs and tell if they are valid or not. So, if the verifier contract returns true, then everyone can see on-chain that the coordinator correctly processed that batch of messages. The coordinator repeats this process until all messages have been processed.

#### Tally Results

Finally, once all messages have been processed, the coordinator tallies the votes of the valid messages (off-chain). The coordinator creates a zk-SNARK proving that the valid messages in the state tree (proved in Process Messages step) contain votes that sum to the given tally result. Then, they call [`Tally.tallyVotes()`](/docs/developers-references/smart-contracts/solidity-docs/Tally#tallyvotes) with a hash of the correct tally results and the zk-SNARK proof. Similarly to the processMessages function, the `tallyVotes` function will send the proof to a verifier contract to ensure that it is valid.

<!-- "hash of the correct tally results" - so are the final results actually put on chain? or just a hash?? -->

The `tallyVotes` function is only successful if the verifier contract returns that the proof is valid. Therefore, once the `tallyVotes` function succeeds, users can trust that the coordinator has correctly tallied all of the valid votes. After this step, anyone can see the final tally results and the proof that these results are a correct result of the messages sent to the Poll contract. The users won’t be able to see how any individual voted, but will be able to trust that these votes were properly processed and counted.

<!-- "After this step, anyone can see the final tally results" - how if only hash of results are published? -->
<!-- https://miro.medium.com/v2/resize:fit:1400/format:webp/0*7Le2odbX7e2etpxR -->

### 3) Finalized

A poll is "finalized" after the coordinator processes all the messages, tallies the results, and publishes the on-chain proofs.

At this point, the final results of a poll can be announced, and anyone can verify that the results have been processed and calculated correctly by the coordinator.
