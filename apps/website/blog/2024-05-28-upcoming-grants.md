---
slug: upcoming-grants-2024
title: Upcoming grants for MACI protocol improvements
description: Dive into the next MACI protocol changes and improvements.
authors:
  name: ctrlc03
  title: MACI dev
  url: https://x.com/ctrlc03
  image_url: https://avatars.githubusercontent.com/u/93448202?v=4
tags: [voting, security, anonymity, roadmap, grants]
excerpt: "Minimal Anti-Collusion Infrastructure (MACI), is making waves in the world of private, digital voting. But where did this technology originate? Vitalik Buterin is the mind that thought of MACI. In this post, we’ll dive into his vision for a more secure and private digital voting system."
---

Minimal Anti Collusion Infrastructure ([MACI](https://github.com/privacy-scaling-explorations/maci)) is a public good that allows one to run secure, private, on-chain voting polls.

Given MACI's open source nature, it's common for our core team to develop new features or to fix issues based on community feedback. However, it's been less common for external contributors to make significant changes to the core protocol.

Well, this soon will be a reality thanks to a MACI improvement proposal sent by the [3327](https://3327.io/) team. 3327 is collective of 10+ people working on improving blockchain technologies, with a focus on research and engineering. Their engineering team previously worked on implementing the [ElGamal flow](https://github.com/0x3327/maci/blob/feat/elgamal/docs/elgamal-flow.md) into MACI ([here's a nice presentation on it from Marija Mikić at EthCC [6]](https://www.youtube.com/live/X54LaXfJTn4)). The work described in this post aims to be its direct replacement due to its simplified nature and several additional benefits.

This proposal can be divided into two parts:

1. bring unconditional privacy to MACI's voters
2. optimise inefficient merkle tree structure holding messages, by replacing it with a hash chain

## 1) Enable unconditional voter privacy

Currently with MACI, if a voter performs a [key change](/docs/core-concepts/key-change), the voter's new key would not be anonymous to the coordinator. The coordinator could collude with a bad actor to inform the latter of the key change, as the coordinator would have access to all decrypted messages.

The key focus of this improvement is to enable users to be completely anonymous by removing the link between the original signup key and the key used for voting. How would this work? Well, users sign up to vote via the [MACI contract](/docs/developers-references/smart-contracts/MACI), and depending on the [gatekeeper](/docs/developers-references/smart-contracts/Gatekeepers) in use, they'd have to prove that they've passed the entry condition. Now, given knowledge of this key, they can signup with a new key to polls deployed by this same MACI contract.

Thus, voters can prove anonymously that they know the preimage of a [`StateLeaf`](/docs/developers-references/typescript-code/typedoc/domainobjs/classes/StateLeaf), by passing this information to a zk-SNARK circuit, and validating this proof within the poll contract when joining with the new key. You might be thinking that everyone knows the preimage of a state leaf, as it's public information that can be taken from the contracts' logs. However, the circuit will not accept the public key directly but would instead take the private key and use it to generate the public key. This way, only users with knowledge of a specific private key can generate a valid inclusion proof.

Now after signing up to the Poll with this new key, there will not be any link to the original key, and users will effectively be anonymous. Of course users should ensure that they are using different wallets where possible.

Finally, with the use of a nullifier, it will not be possible for the same original key to be used to signup more than once for each new poll.

Are there any drawbacks? Well, yes. There will be an extra step for users to register to individual Polls. We aim to offset this cost and additional step soon either with gasless transactions or by moving some logic off-chain.

## 2) Message structure optimisation

On top of the improvements to anonymity, the [3327 team](https://3327.io/) aims to also replace the Merkle tree used for storing messages with a [hash chain](https://csrc.nist.gov/glossary/term/hash_chain). Some of the benefits of this approach are:

- unlimited number of messages
- removal of expensive merge operations from the coordinator
- cheaper to send messages as only one hash is required to update the hash chain
- less constraints on the circuits due to simplified logic

**Unlimited messages**

Merkle trees are usually bound by a depth property. Together with the number of leaves per node, we can calculate the max capacity of a tree. For instance, for a binary tree with a depth of 10, we can host up to **2^10** (1024) leaves. On the other hand, hash chains do not have a limit, unless if we wanted to set one, so we technically can support an unlimited number of messages.

**Cheaper operations**

Hashing the previous hash chain with the message is cheaper than inserting into a Merkle tree. Additionally, removing the need for the coordinator to perform merge operations on the accumulator queues that were used on chain will greatly reduce costs and processing time.

**Smaller circuits**

As cited in their proposal, processing message inclusion proofs for **k** messages in a tree with height **h** requires **k \* h** hashing operations within the circuit with **2 \* k \* h** signal values for inclusion proofs. Processing messages with chain hashes removes the unnecessary inclusion proofs and requires only **k** hashes to be computed for **k** messages without any extra signals, as the requirement is to prove that the order and inclusion of all messages are correct.

## A call for MACI grant proposals

So what does this mean for you, Anon?

As an open-source project of [PSE](https://pse.dev) with support from the Ethereum Foundation, MACI is fortunate to have the resources to invest in the maintenance and improvement of the protocol. This means we're able to fund full-time developers as well as allocate grants for various research and development initiatives.

We encourage all community members to contribute to the improvement and ongoing development of MACI! After all, our goal is to build the most secure e-voting system, and this cannot be accomplished without all of your support.

As a team, we are incredibly excited about this proposal and will continue to work hard to help the [3327 team](https://3327.io/) get this upgrade production-ready over the next 3 months.

To contribute to MACI, submit issues, or learn more about it, you can reach out to us either via [Discord](https://discord.com/invite/sF5CT5rzrR) or [GitHub issues](https://github.com/privacy-scaling-explorations/maci/issues/new/choose).

If you have an ambitious idea you'd like to work on, reach out to us and we could create a proposal to build together! If you don't yet have a specific idea but are still keen to work on MACI, we have some research ideas which might inspire you and we could collaborate on a grant together. Feel free to explore these ideas below and get in touch:

- [MACI coordinator in a TEE](https://github.com/privacy-scaling-explorations/maci/discussions/1385)
- [Group wise matching](https://github.com/privacy-scaling-explorations/maci/issues/905)
- [Folding schemes for MACI's circuits](https://github.com/privacy-scaling-explorations/maci/issues/904)

## References

- [3327 team](https://3327.io/)
- [3327 ElGamal flow](https://github.com/0x3327/maci/blob/feat/elgamal/docs/elgamal-flow.md)
- [3327 ElGamal API](https://github.com/0x3327/maci/blob/feat/elgamal/docs/elgamal-api.md)
- [Marija Mikić - Anonymity in MACI - EthCC [6]](https://www.youtube.com/live/X54LaXfJTn4)
- [MACI Original idea](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)
- [MACI Anonymization](https://ethresear.ch/t/maci-anonymization-using-rerandomizable-encryption/7054)
