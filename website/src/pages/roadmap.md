---
title: 2024 MACI Product Roadmap
description: An outline of the 2024 MACI team & product roadmap
---

# 2024 MACI Product Roadmap

**This document aims to outline the 2024 MACI team & product roadmap.**

_As part of our core team's efforts to make our work more accessible and to foster more collaboration from our open source community, we're publicly publishing our roadmap. We plan to re-assess & iterate on our roadmap over time, and will update this document when we do._

## Team description

The MACI core team is a small collaborative team building various projects within [Privacy & Scaling Explorations (PSE)](https://pse.dev/). Our sustained focus is on MACI: a protocol that allows users to have an on-chain voting process with greatly increased collusion resistance & privacy. Additionally, we allocate a significant portion of our time to support the practical adoption of this technology by grassroots community leaders around the world using it to secure Quadratic Voting (QV) & Quadratic Funding (QF) events.

## MACI mission & vision

MACI (Minimal Anti-Collusion Infrastructure) is a public good & a potential core piece of infrastructure for many Ethereum-based applications to support privacy-protecting on-chain governance. Using MACI, no voter can reveal how they voted yet voting results are published publicly and verified with cryptographic proofs to prevent censorship, bribery, collusion, and other nefarious acts common in public polling processes. With MACI, you get the transparency you want as well as the privacy you need.

**Long term, the MACI team’s vision is to build the most secure e-voting solution in the world.**

Short term, our vision is to empower developers to build on MACI to create privacy-protecting voting applications, including quadratic funding platforms & DAO governance tools. Our goal is to provide an out-of-the-box solution for developers to quickly deploy & plug their applications into. MACI enables you to focus less time worrying about voting infrastructure & more time building the logic specific to your application.

### High-level MACI ecosystem goals

1. ~~2023: MACI integrated by 1 PSE project~~ (✅, [QFI](https://github.com/privacy-scaling-explorations/qf))
2. 2024: MACI integrated by 1 external project
3. 2025: MACI used by several DAOs for governance & multiple QF integrations
4. 2028: MACI used in smaller municipal elections (counties, provinces, etc)
5. 2030: MACI used in national elections

### High-level MACI development goals

1. ~~2023: build technical feasibility for 10K concurrent voters on the platform.~~ (✅)
2. 2024 Q1: release MACI v1.2, with revamped documentation & educational resources
3. 2026: build technical feasibility for 100K concurrent voters on the platform.
4. 2028: build technical feasibility for 1M concurrent voters on the platform.

## QF mission & vision

We’re building technical infrastructure, operational expertise & a network of communities to create a scalable way to enable community organizers to run QF rounds. The mission of our QF project has been to serve as a reference implementation on how to integrate MACI as well as support the practical adoption of this community-funding technology.

**Long term, our vision is to build the most widely adopted QF solution in the world, powered by MACI.**

Our vision to eventually enable QF rounds, running e.g. every quarter, at the local, municipal, national and global scale. We want QF rounds to become the “default” place where projects are contributing funds to public goods

### High-level QF ecosystem goals

1. ~~2023: facilitate 15 QF/QV rounds~~ (❌, 6 rounds)
2. 2024: facilitate 12 QF/QV rounds
3. 2025 & beyond: TBD

### High-level QF development goals

1. ~~2023: build QFI as a QV reference implementation for MACI v1.x~~ (✅❓)
2. 2024: build out reference implementation with complete QF functionality (vs. only QV)
3. 2024/5: implement additional functionality (key-switching, gas-less voting)
4. 2025: support additional QF mechanisms
5. 2025 & beyond: TBD

# Where are we now?

Despite the MACI project existing in some form for 4+ years now, we still see MACI & QF largely at the “research & development” stage. We’ve built an MVP and have shipped a production product to market (starting with [MACI v1.0](https://mirror.xyz/privacy-scaling-explorations.eth/V0QkCAtsYUd5y7RO7L5OAwmawhY9LTJ7jlOZ4KW1J7M)) but we’re still very much in the stage of testing, iterating & refining. We’re looking to gain adoption from projects, whether experimental or in production, in order to gain product feedback & quickly iterate on improvements. We still have lots of potential research areas to explore in order to make MACI usable from the mass market.

## 2023 year in review

Overall, 2023 has been a turbulent year on the MACI team with up & downs.

A few major initiatives & themes worth calling out, which influence our 2024 roadmap strategy.

## Successes in 2023

### P0tion v1.0 release & early traction

Originally planned as tooling to support MACI’s trusted setup ceremony, eventually we generalized this project & codebase to provide infrastructure that supports any Groth16 Phase 2 Trusted Setup ceremony.

The project was publicly launched in August & has already seen early traction in the community. 4 ceremonies have already been run, including the **[MACI v1 Setup Ceremony](https://ceremony.pse.dev/projects/Maci%20v1%20Trusted%20Setup%20Ceremony)**! More projects continue to indicate interest, both by running ceremonies on our hosted infrastructure ([ceremony.pse.dev](https://ceremony.pse.dev/)) as well as forking the project to run their own ceremonies, which has attracted ~260s of contributions.

**References**

- [Github](https://github.com/privacy-scaling-explorations/p0tion)
- [Website](https://ceremony.pse.dev/)
- [Wiki](https://p0tion.super.site/)
- [v1.0 release post](https://mirror.xyz/privacy-scaling-explorations.eth/TuLZRdgCQsydC8JJgCNH4F7GzifRBQ6fr31DHGLFVWM)

### Community QF rounds

The goal of our QF project has been to serve as a reference implementation on how to integrate MACI as well as support the practical adoption of this community-funding technology.

This year we continued to build out our [fork-able QF stack](https://github.com/privacy-scaling-explorations/qf) & partnered with a variety of Ethereum community organizers to run 6 successful QF/QV rounds, with a total of $58,000 of matching pool funds disbursed to community projects:

1. [ETH Porto](https://eth.movimentotransformers.org/#/): $10,000
2. [ETH Dam](https://qf.super.site/case-studies/ethdam): $15,000
3. [ETH Honduras](https://qf.super.site/case-studies/eth-honduras-23): $10,000
4. [ETH Argentina](https://qf.super.site/case-studies/eth-argentina-23): $20,000
5. [EthCon Korea](https://qf.ethcon.kr/): $0 (completely community-run!)
6. [ETH Taiwan](https://www.zkpvoting.tw/#/): $3,000

[Learn more about some of community QF rounds in our case studies](https://qf.super.site/case-studies).

We also connected with tens of other grassroots Ethereum communities. Although other rounds “failed” to launch in 2023, we established relationships & opened doors to potential future rounds. We learned valuable insights about what makes a successful community partner, what level of skill & participation is required to make a round work. Other orgs we explored rounds with included ETH Rome, ETH Mexico, ETH Brasil, ETH Colombia & ETH Gunu.

**References**

- [GitHub](https://github.com/privacy-scaling-explorations/qf)
- [Website](https://qf.super.site/)

## Challenges in 2023

### Lack of MACI adoption

Despite publishing the [MACI v1.0 release](https://medium.com/privacy-scaling-explorations/release-announcement-maci-1-0-c032bddd2157) over 2 years ago, not a single project has integrated MACI v1.x in a production environment (aside from [QFI](https://github.com/privacy-scaling-explorations/qf), the internal PSE project).

While attempts have not been well documented, we’re aware of a handful of anecdotal accounts of developer teams demonstrating interest in MACI, attempting to integrate it, but eventually giving up after weeks of effort due to a variety of issues (steep learning curve, poor documentation, lack of code commenting or readability, limited support from the MACI team).

### MACI repo & community neglect

Although our core team has been working hard on various initiatives, our communication, priorities & activities have not been visible to the community. Most communication has been in private TG groups & collaboration on core team development has primarily been in closed GH project boards. This creates a lack of certainty around the investment in & maintenance of the project.

The [MACI repo](https://github.com/privacy-scaling-explorations/maci) has been largely neglected in 2023. As of early October, there were >90 open issues & >30 opens PRs, many of which are months or years old, and most of which had no response from our core team. This does not inspire confidence from the community that this project is actively maintained, or that the core team is open to community contributions.

While we’ve had a public TG group (with >250 people), there’s not much activity from the core team there & we haven't reliably responded to questions or inquiries from the community.

### Half-baked research & development

The team took on several ambitious areas of research & development (particularly research). While we made progress in areas, most of these projects have not come to fruition in terms of being published or integrated into the MACI product:

- We had grantees working on [ElGamal research & development](https://github.com/privacy-scaling-explorations/maci/issues/796) but they were not closely supervised & their work is largely WIP that hasn’t been integrated into the project
- We kicked off work on the [MACI coordinator service](https://github.com/privacy-scaling-explorations/maci-coordinator). We implemented an API to assist with coordinator proof generation. Work began on a frontend React app but progress stalled & the work has not been completed:
- Research on [Group Wise Matching in Quadratic Funding](https://hackmd.io/@daodesigner/Hy23WkCY2#Progress-Update-Group-Wise-Matching-in-Quadratic-Funding)
- Reasearch on [Nova Integration with MACI](https://hackmd.io/@daodesigner/Hy23WkCY2#Progress-Update-Nova-Integration-with-MACI)

It seems team members were mostly assigned to their own independent initiatives, which led to these isolated workstreams. Individuals found it hard to gain feedback & support from the team. Moving forward, we want to align individual goals with larger team goals in order to encourage closer collaboration on the projects we push forward.

### Team turnover

In 2023 we lost some core team members which contributed to resource constraints, stalled projects, & general confusion within team around priorities. This also led to morale issues with productivity, frustrations & uncertainty of the future direction. Yet ultimately the team & project perseveres! We’re hopeful with the new structure & growth opportunities, we can achieve an impactful 2024.

# 2024 workstreams

_To achieve our mission, we’re focused on 4 major workstreams that comprise our roadmap._

## 1) MACI Developer Experience (DX)

~_50% of team’s total bandwidth_

We believe that MACI is only useful to the extent that people use MACI & build on MACI.

As mentioned above in “challenges”, not a single project has yet integrated MACI v1.x in a production environment We view this as a failure, and we want to fix this. **The goal of this workstream is to make MACI as easy to understand and easy to integrate as possible.**

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

Along with poor DX, we believe one of the core reasons there hasn’t been ecosystem adoption of MACI is the lack of community engagement (which we touched on in “challenges”). **We’ll create an open source community where integrations & contributions are actively encouraged!**

This workstream relates closely to improving DX but focuses on areas that will require active maintenance, support & engagement from our team vs. improving code, documentation & educational resources that will be available online 24/7/365.

The hope here is that close interactions with integration developers & Ethereum community members will help us gather insightful user feedback that will help us iterate faster to improve MACI as a product. We’ll be rolling out an agile scrum development workflow that should allow us to rapidly respond to input from the community to guide our roadmap & product direction.

### Initiatives within this workstream:

- Allocate team bandwidth to be available to respond to the community
  - Support MACI integrations (starting with [clr.fund](http://clr.fund/) v1.x integration)
  - Revamp GitHub repo maintenance ([MACI GH processes](https://github.com/privacy-scaling-explorations/maci/issues/757))
  - Establish & respond to public channels ([Discord](https://discord.com/invite/sF5CT5rzrR), [Twitter](https://twitter.com/zkMACI))
- Proactively generate engagement
  - Publish public roadmaps, release blog posts, Twitter updates
  - Conference talks/presentations
  - Hackathon bounties & support
  - Actively identify collaboration opportunities with projects in the space
- Update our development processes to quickly react to user needs & input
  - Adopt agile/scrum methodologies

## 3) Quadratic Funding Experiments

_~30% of team’s total bandwidth_

[Read context on on our QF initiative here](https://qf.super.site/about).

### 2024 goal

- Help run 12 QF/QV rounds

### Initiatives within this workstream:

- Build an evaluation framework of QF rounds, to increase our sophistication around how we measure success
- Landscape analysis of QF & capital-allocation projects to better understand how our efforts fit in within the broader ecosystem
- Update & expand our [QF website](https://qf.super.site/), with public launch to generate inbound interest
- Explore community collaboration opportunities (running QF rounds)
- Exploring project collaboration opportunities (supporting MACI/QF integrations)

**References**

- [GitHub](https://github.com/privacy-scaling-explorations/qf)
- [Website](https://qf.super.site/)

## 4) P0tion support & handoff

_~5% of team’s total bandwidth_

A big team accomplishment in 2023 was building & launching p0tion. We’ve seen exciting early traction, with multiple development teams requesting ceremonies using our infrastructure.

For the rest of this year & early into 2024, we plan to hand off this project to the Trusted Setup team for them to maintain. Our developers will continue to support the codebase & ceremonies as we train up that team on this project. For the foreseeable future, we expect to collaborate with that team to align on the vision of the project & direct a product roadmap.

**References**

- [Github](https://github.com/privacy-scaling-explorations/p0tion)
- [Website](https://ceremony.pse.dev/)
- [Wiki](https://p0tion.super.site/)

# Future areas of research & development

While not prioritized as an upcoming workstream, we think it’s worth calling out important areas of research & development that we’re excited to work on in the future:

### [MACI Coordinator Service](https://github.com/privacy-scaling-explorations/maci-coordinator)

- The primary responsibility of the Coordinator Service will be to:
  - offload and automate the tasks performed by the human coordinator
  - minimize proving time by parallelizing SNARK proof generation and making MACI and QFI easier to adopt

### [QF stack](https://github.com/privacy-scaling-explorations/qf)

- To serve as a reference implementation on how to integrate MACI as well as support the practical adoption of this community-funding technology.
- Improvements
  - Support QF (as of now only supports QV functionality)
  - Make it easier for operators to run rounds
  - Make it easier for end users to use

### MACI improvements

- Unconditional Voter Privacy ([#796](https://github.com/privacy-scaling-explorations/maci/issues/796))
- Gas-less MACI
  - Explore ways to support cost-free voting for users
  - e.g. via a message aggregation service?
    - Instead of users submitting vote transactions on-chain, they could sign their vote messages using their MACI key, then post messages to an aggregator server. Later on, the operator can batch votes into a single Ethereum transaction, and periodically insert them a subtree at a time into the MACI message tree.
- Improving gas efficiency
  - Explore SNARK Proof Aggregation:
    - The only major way to reduce gas costs is to decrease call data size, we can do this via proof aggregation.
    - POC with Maze and other solutions to benchmark on MACI V1 circuits
    - aggregate many proofs together and make a solidity verifier for the aggregation circuit, this could offset the need for direct circom optimization
- Different matching mechanisms
  - e.g. [Group Wise Matching in Quadratic Funding](https://hackmd.io/@daodesigner/Hy23WkCY2#Progress-Update-Group-Wise-Matching-in-Quadratic-Funding)
- Scaling explorations
  - e.g SNARK Folding Schemes ([Nova integration](https://hackmd.io/@daodesigner/Hy23WkCY2#Progress-Update-Nova-Integration-with-MACI))

# Resource requirements

### Hiring

- **ASAP**

  - 2 engineers to drive MACI development
    - JavaScript/TypeScript is a must, Solidity & Circom knowledge nice-to-have
    - Could be full-stack devs, or specialists (e.g. 1 frontend dev, 1 backend / smart contract dev)

- **Soon™ (2nd half of 2024?)**
  - As we begin to tackle “future areas of research & development”… additional roles we’d potentially like to hire for:
    - Full-stack engineer (QF stack: frontend & smart contract development)
    - Cryptography/circuit engineer (ElGamal work, Nova integration)
    - Researcher (MACI scalability, mechanism design, QF research)

### Audit

- Given we plan to release a v1.2 in Q1 2024 (& potentially another version later in the year!), we’ll want auditing resources for this (via either internal or external security team)

### Design

- MACI identity & branding workshop to assist with user personas & messaging
- Nice-to-have: website design help & logo design

### QF matching funds

- If we hit our goal of 12 QF rounds, we expect matching pool amounts totaling ~$350,000

### Event budget

- ~$25,000 budget to run hackathon bounties & workshops

# Major decision points

_Initiatives & potential events in 2024 that will influence our priorities & progress_

### 1) QF landscape analysis

The results from this upcoming research initiative will influence our strategic direction in terms of

- A) exploring MACI integrations with other projects
- B) building the user-facing application(s) ourselves

### 2) Ability to grow our team

Our success with recruiting & hiring will obviously influence our bandwidth & ability to execute

Our ambitious goals require the need for certain expert knowledge & skillsets

# Major risks

_Potential hurdles or challenges that would prevent our team from completing our priorities_

### 1) Integration risks

While projects have already expressed interest (e.g. Gitcoin, Gnosis Guild), we have limited control over the ultimate decisions on community integrations. Projects may re-prioritize or determine they don’t have the internal engineering resources to push these initiatives forward.

### 2) QF event risk

Ultimately there’s macro events beyond our control that could cancel IRL events & QF rounds. As we continue to subtract ourselves in terms of the influence & control we exercise over QF rounds, we naturally will have less decision-making power over the outcomes of these rounds.

### 3) Technical complexity

MACI is a complex codebase that was originally built by expert cryptographers, most of which who are no longer with the project. Some of the research & development improvements we intend to make have some unknown technical complexity. Not all problem spaces are completely understood, which pose a risk of delaying or obstructing progress as we learn more.

# Feedback

Questions? Concerns? Ideas? We’d love to hear from you!

Feel free to [create an issue on our GitHub](https://github.com/privacy-scaling-explorations/maci/issues) or reach out to our team in the [PSE Discord](https://discord.com/invite/sF5CT5rzrR) (`#maci` channel).
