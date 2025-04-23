---
title: MACI Product Roadmap
description: An outline of the 2024 MACI team & product roadmap
---

# MACI Product Roadmap

_This public roadmap is part of our core team's efforts to make our work more accessible and to foster more collaboration from our open source community. We plan to re-assess & iterate on our roadmap over time, and will update this document when we do._

:::info
This document aims to outline the 2025 MACI roadmap. Our roadmap is under constant discussion and evolution (e.g. see our [high level 2025 roadmap](/blog/2025-roadmap) updates) but we try our best to maintain this page to provide a high-level overview. Please join the conversation in our [discord server](https://discord.com/invite/sF5CT5rzrR) if you have feedback!

**Last updated: 2025-04-23**
:::

## Team description

The MACI core team is a small collaborative engineering team building various projects within [Privacy & Scaling Explorations (PSE)](https://pse.dev/). Our sustained focus is on MACI: an on-chain voting protocol that provides greatly increased collusion resistance & privacy. We also allocate a portion of our time to support the practical adoption of this technology by supporting community leaders to run democratic governance and public funding initiatives, like Quadratic Voting (QV), Quadratic Funding (QF), and Retroactive Public Goods Funding (RPGF) grant rounds.

## MACI mission & vision

MACI (Minimal Anti-Collusion Infrastructure) is a public good & a potential core piece of infrastructure for many Ethereum-based applications to support privacy-protecting on-chain governance. Using MACI, individual votes are private but final results are public, so no voter can reveal how they voted yet voting results are verifiable with cryptographic proofs to prevent censorship, bribery, collusion, and other forms of manipulation common in public polling processes.

**Long term, the MACI team’s vision is to build the most secure e-voting solution in the world.**

Short term, our vision is to empower developers to build with MACI to create collusion resistant & privacy-protecting voting applications, like quadratic funding platforms & DAO governance tools. Our goal is to provide an out-of-the-box solution for developers to quickly integrate into their applications & deploy. MACI aims to handle the voting infrastructure so you can focus on building the logic specific to your application.

### High-level MACI ecosystem goals

1. ~~2021: MACI integrated by an ecosystem project~~ (✅, [clr.fund](https://github.com/clrfund/monorepo/))
2. ~~2023: MACI integrated by a PSE project~~ (✅, [QF](https://github.com/privacy-scaling-explorations/qf))
3. ~~2024: MACI integrated by an additional external project~~ (✅, [PriVote](https://github.com/PriVote-Project), [Gitcoin](https://github.com/gitcoinco/MACI_QF))
4. 2025: MACI used by multiple DAOs for governance applications
5. 2028: MACI used in smaller municipal elections (counties, provinces, etc)
6. 2030: MACI used in national elections

### High-level MACI development goals

1. ~~2021: release MACI v1.0~~ (✅)
2. ~~2023: build technical feasibility for 10K concurrent voters on the platform~~ (✅)
3. 2024:

- ~~Q1: release MACI v1.2, with revamped documentation & educational resource~~ (✅)
- ~~Q3: release MACI v2.0, with cleaner code and improved UX~~ (✅)

4. 2025: release MACI v3.0, with new features for a more scalable and flexible platform
5. 2026: build technical feasibility for 100K concurrent voters on the platform
6. 2028: build technical feasibility for 1M concurrent voters on the platform

# 2025 workstreams

In 2025, we are focusing on several initiatives to support the practical adoption of MACI.

## 1) MACI v3.0

This new version comes with features that have been requested in the past, such as polls being more customisable, in terms of voice credits assigned to voters, and gatekeeping mechanisms.

At a high level, the new features/improvements are:

- Custom voice credits per poll
- Custom gatekeeping per poll
- Replacement of vote merkle trees for more efficient hash-chains
- Offchain voting via MACI's relayer service

## 2) Coordinator Service

The coordinator service is a service to automate MACI coordinator functionality. This includes:

- Contract deployment
- Subgraph deploying
- Proof generation
- Proof and results submission

This service exposes a REST API, as well as some Websocket endpoints (for proof generation only). Our goal is to release an efficient and easy to use service that can be used by any application that builds atop of MACI.

## 3) Integration with DAO's tooling provider

As an effort to support DAO governance, and help solve their issues with bribery and collusion, MACI is focusing on integrating with DAO's tooling providers.

To start with, MACI is integrating with [Aragon](https://aragon.org/) by building a voting [plugin](https://github.com/privacy-scaling-explorations/maci-voting-plugin).

In the future, we plan to continue working with other partners such as [Agora](https://www.agora.xyz/), and help them offer DAOs secure and private voting.

## 4) Coordinator decentralisation

It's no secret that one of MACI long standing issues has having a centralised coordinator. They are able to see all of the votes in cleartext, which allows them to collude with bribers themselves, as well as voters. As we look to tackle use cases such as DAO governance where large quantities of money are involved in proposals, we need to ensure that collusion between the coordinator and voters/bribers is reduced. This can be accomplished in several ways:

- Use Multi Party Computation (MPC)
- Use Homomorphic Encryption (HE)
- Use a Trusted Execution Environment (TEE)

We plan to research the best approach and start the implementation within the year.

## Future R&D

While not prioritized as an upcoming workstream, we think it’s worth calling out important areas of research & development that we’re excited to work on in the future:

### MACI improvements

- Scaling explorations, like SNARK Folding Schemes (e.g. [Nova integration](https://github.com/privacy-scaling-explorations/maci/issues/904))
- Different matching mechanisms (e.g. [Group Wise Matching in Quadratic Funding](https://github.com/privacy-scaling-explorations/maci/issues/905))
- Re-implementation of previously removed features such as [Topup](https://github.com/privacy-scaling-explorations/maci/issues/1384) and [Subsidy](https://github.com/privacy-scaling-explorations/maci/issues/1348)
- [Benchmarks](https://github.com/privacy-scaling-explorations/maci/issues/1197) for the whole stack

## Feedback

Questions? Concerns? Ideas? We’d love to hear from you!

Feel free to [create an issue on our GitHub](https://github.com/privacy-scaling-explorations/maci/issues) or reach out to our team in the [PSE Discord](https://discord.com/invite/sF5CT5rzrR) (`#maci` channel).
