---
title: MACI Product Roadmap
description: An outline of the 2024 MACI team & product roadmap
---

# MACI Product Roadmap

This document aims to outline the 2024 MACI team & product roadmap.

_This public roadmap is part of our core team's efforts to make our work more accessible and to foster more collaboration from our open source community. We plan to re-assess & iterate on our roadmap over time, and will update this document when we do._

:::info
Our roadmap is still under active discussion - please join the conversation in our [GitHub discussion](https://github.com/privacy-scaling-explorations/maci/discussions/859) if you have feedback!
:::

## Team description

The MACI core team is a small collaborative engineering team building various projects within [Privacy & Scaling Explorations (PSE)](https://pse.dev/). Our sustained focus is on MACI: an on-chain voting protocol that provides greatly increased collusion resistance & privacy. We also allocate a significant portion of our time to support the practical adoption of this technology by supporting community leaders to run democratic governance and public funding initiatives, like Quadratic Voting (QV) & Quadratic Funding (QF) grant rounds.

## MACI mission & vision

MACI (Minimal Anti-Collusion Infrastructure) is a public good & a potential core piece of infrastructure for many Ethereum-based applications to support privacy-protecting on-chain governance. Using MACI, individual votes are private but final results are public, so no voter can reveal how they voted yet voting results are verifiable with cryptographic proofs to prevent censorship, bribery, collusion, and other forms of manipulation common in public polling processes.

**Long term, the MACI team’s vision is to build the most secure e-voting solution in the world.**

Short term, our vision is to empower developers to build with MACI to create collusion resistant & privacy-protecting voting applications, like quadratic funding platforms & DAO governance tools. Our goal is to provide an out-of-the-box solution for developers to quickly integrate into their applications & deploy. MACI aims to handle the voting infrastructure so you can focus on building the logic specific to your application.

### High-level MACI ecosystem goals

1. ~~2021: MACI integrated by an ecosystem project~~ (✅, [clr.fund](https://github.com/clrfund/monorepo/))
2. ~~2023: MACI integrated by a PSE project~~ (✅, [QF](https://github.com/privacy-scaling-explorations/qf))
3. 2024: MACI integrated by an additional external project
4. 2025: MACI used by multiple DAOs for governance applications & QF integrations
5. 2028: MACI used in smaller municipal elections (counties, provinces, etc)
6. 2030: MACI used in national elections

### High-level MACI development goals

1. ~~2021: release MACI v1.0~~ (✅)
2. ~~2023: build technical feasibility for 10K concurrent voters on the platform~~ (✅)
3. 2024 Q1: release MACI v1.2, with revamped documentation & educational resource
4. 2026: build technical feasibility for 100K concurrent voters on the platform
5. 2028: build technical feasibility for 1M concurrent voters on the platform

# 2024 workstreams

_To achieve our mission, we’re focused on 4 major workstreams that comprise our roadmap._

## 1) MACI Developer Experience (DX)

~_50% of team’s total bandwidth_

We believe that MACI is only useful to the extent that people use MACI & build on MACI.

Despite the power of MACI, not a single project has yet integrated MACI v1.x in a production environment. We view this as a failure, and we want to fix this. **The goal of this workstream is to make MACI as easy to understand and easy to integrate as possible.**

### Initiatives within this workstream:

- Implement & release a MACI v1.2 ([#856](https://github.com/privacy-scaling-explorations/maci/issues/856))
  - Refactor the codebase for improved quality, readability & modularity
  - Add code comments (with [TypeDoc](https://typedoc.org/) & [NatSpec](https://docs.soliditylang.org/en/latest/natspec-format.html)) to improve productivity
  - Improve tooling (e.g. cross-platform support) for ease of integration & performance
- Improve/create documentation for developer onboarding & education
  - Revamp documentation stack (via Docusaurus) with versioning & additional resources
  - Voter & coordinator guides to understand full poll lifecycle
- Build app templates & tutorials that can serve as reference implementations

**References**

- [MACI v1.2 Refactoring Plan](https://github.com/privacy-scaling-explorations/maci/issues/856)
- [MACI development team sprint board](https://github.com/orgs/privacy-scaling-explorations/projects/40)
- [MACI v1.1.1 refactor milestone](https://github.com/privacy-scaling-explorations/maci/milestone/5)

## 2) MACI Community Engagement

_~15% of team’s total bandwidth_

We want to proactively support adoption of MACI. **We’ll create an open source community where integrations & contributions are actively encouraged!**

This workstream relates closely to improving DX but focuses on areas that will require active maintenance, support & engagement from our team vs. improving code, documentation & educational resources that will be available online 24/7/365.

The hope here is that close interactions with integration developers & Ethereum community members will help us gather insightful user feedback so that we iterate faster to improve MACI as a product. We’ll be rolling out an agile scrum development workflow that should allow us to rapidly respond to input from the community to guide our roadmap & product direction.

### Initiatives within this workstream:

- Allocate team bandwidth to be available to respond to the community
  - Support MACI integrations (starting with [clr.fund](http://clr.fund/) v1.x integration)
  - Revamp GitHub repo maintenance ([MACI GH processes](https://github.com/privacy-scaling-explorations/maci/issues/757))
  - Establish & respond to public channels ([Discord](https://discord.com/invite/sF5CT5rzrR), [Twitter](https://twitter.com/zkMACI))
- Proactively engage with the ecosystem to identify collaboration opportunities (conference talks, hackathon bounties, social media)
- Update our development processes to quickly react to user needs & input

## 3) Quadratic Funding Experiments

_~30% of team’s total bandwidth_

We’re building technical infrastructure, operational expertise & a network of communities to create a scalable way to enable community organizers to run QF rounds. The mission of our QF project has been to serve as a reference implementation on how to integrate MACI as well as support the practical adoption of this community-funding technology.

[Read more about our QF initiatives here](https://qf.pse.dev/about).

### 2024 goal

- Help run 12 QF/QV rounds

### Initiatives within this workstream:

- Build an evaluation framework of QF rounds, to increase our sophistication around how we measure success
- Landscape analysis of QF & capital-allocation projects to better understand how our efforts fit in within the broader ecosystem
- Update & expand our [QF website](https://qf.pse.dev/), with public launch to generate inbound interest
- Explore community collaboration opportunities (running QF rounds)
- Exploring project collaboration opportunities (supporting MACI/QF integrations)

**References**

- [GitHub](https://github.com/privacy-scaling-explorations/qf)
- [Website](https://qf.pse.dev/)

## Future R&D

While not prioritized as an upcoming workstream, we think it’s worth calling out important areas of research & development that we’re excited to work on in the future:

### MACI Coordinator Service

- The primary responsibility of the Coordinator Service will be to:
  - offload and automate the tasks performed by the human coordinator
  - minimize proving time by parallelizing SNARK proof generation and making MACI easier to adopt
- [GitHub repo](https://github.com/privacy-scaling-explorations/maci-coordinator)

### QF stack

- To serve as a reference implementation on how to integrate MACI as well as support the practical adoption of this community-funding technology.
- Improvements
  - Support QF (as of now only supports QV functionality)
  - Make it easier for operators to run rounds
  - Make it easier for end users to use
- [GitHub repo](https://github.com/privacy-scaling-explorations/qf)

### MACI improvements

- Unconditional Voter Privacy (e.g. [ElGamal Key Change Mechanism](https://github.com/privacy-scaling-explorations/maci/issues/796))
- Scaling explorations, like SNARK Folding Schemes (e.g. [Nova integration](https://github.com/privacy-scaling-explorations/maci/issues/904))
- Different matching mechanisms (e.g. [Group Wise Matching in Quadratic Funding](https://github.com/privacy-scaling-explorations/maci/issues/905))
- Gas-less MACI for voters
- Gas efficiency

## Feedback

Questions? Concerns? Ideas? We’d love to hear from you!

Feel free to [create an issue on our GitHub](https://github.com/privacy-scaling-explorations/maci/issues) or reach out to our team in the [PSE Discord](https://discord.com/invite/sF5CT5rzrR) (`#maci` channel).
