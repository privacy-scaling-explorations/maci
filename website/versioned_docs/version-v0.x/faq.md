---
title: MACI v0.x FAQ
sidebar_label: FAQ
sidebar_position: 6
---

# FAQ

## I: Attacks and mitigations

### If the coordinator censors messages

If the coordinator censors a message `N` by excluding it from the final vote tally, the logic in `processMessage()` will prevent them from processing message `N+1` or any future message until they do so.

### If a user submits a message with an invalid signature

The coordinator should verify the message's signature off-chain and if it is invalid, set the no-op flag to true and pass it into the state transition proof circuit. If the coordinator does not do this, they will fail to generate a valid proof anyway.

### If an adversarial miner bribes a user and controls the `randomLeaf` value passed into the state transition snark

This adversary does not know the value of the other leaves of the state tree, so even if the coordinator updates leaf 0 with the adversary's entropy, the adversary cannot tell if the processed command is invalid.

### User creates a command that the snark cannot process

The system must be designed and built in a way such that this cannot happen.

### If a briber locks the user's key in trusted hardware

Assuming that the locked key is not the user's initial public key, the briber has no way to tell if the user has not already changed their key. This scenario is therefore the same as that in which the user gives a public key to a briber without trusted hardware.

> [name=kobi]
> I don't think the reasoning works, for example for a user with trusted hardware:
>
> 1. User has trusted hardware that allows a single key change. The user has initial public key $pk$ and public key $pk2$
> 2. User registers with $pk$
> 3. User changes to $pk2$, with the trusted hardware attesting this is the second public key and no further key changes are allowed
> 4. Briber gets $sk2$ and the attestation and then uses $pk2$

> [name=barry] I think that the attack is where you lock the initial key in trusted hardware. The solution is to use https://www.vitalik.ca/general/2019/10/01/story.html

### Deposit my public key and I will pay you

> [name=barry] This is the most serious attack IMO. The deposit stake is weak prevention for this.

### If an attacker fills up the message tree with such a large number of commands that the coordinator cannot afford to generate enough proofs to process them all

Each user should be allowed to publish at no cost as many messages as there are vote options, plus a small number (e.g. 2). Each subsequent message should cost the user an increasing amount of ETH. When the coordinator processes the message, the contract should return the ETH to the user. As such, the majority of non-malicious users will not have to pay any more than the gas costs to vote, and spammers must put up capital to attack the coordinator.

> [barry] there is no way to enforce this limit without allowing for bribary.
> [name=wei jie] how does this have to do with bribery? i understand this to only be an anti-spam mechanism.

## II: Claims / required invariants

1. It is impossible for a coordinator to find a collision in message decryptions. i.e. they cannot decrypt a message to a different command.
2. It is impossible for a user to create a message that the coordinator is not able to process.
3. It is impossible for a user to create a message such that the coordinator is unable to create a zk-SNARK proof of a state root transition.
4. No-one but the coordinator can trustlessly bribe someone.

## III: Desired features not described in this specification

- A perpetual sign-up process
- Reuse the MACI contract for a new vote. This requires the operator to zero out each user's vote option tree.
- Mitigations for some of the attacks described above

## IV: Quadratic and sybil-resistant million-dollar-homepages

Another use case for MACI is a [million-dollar-homepage](http://www.milliondollarhomepage.com/) style bulletin board where users can post and quadratically vote on images. A user who owns a [POAP](https://www.poap.xyz/) token from a real-life event can sign up and receive 2 ^ 32 voting tokens per week. To add a picture to the board, they have to burn 1 ETH, which disincentivises spam. The visual prominence of size of each picture scales with the sum of square roots of the votes that it receives.
