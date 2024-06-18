---
title: Public Goods Funding - How it works
description: Overview of public goods funding works.
sidebar_label: How it works
sidebar_position: 2
---

Are you interested in running a funding round in your community? 🧐

You’re on the right page! 🥳 We aim to provide guidance and an overview of the process involved.

Besides a few technical & operational requirements, we are very open to new ideas of running rounds. If you have a new idea, feel free to share it with us!

## What is Quadratic Funding?

Quadratic Funding (QF) empowers communities to allocate resources towards funding Public Goods. For those who don't know much about Quadratic Funding, [start here](what-is-quadratic-funding.md).

# Process overview

Here’s an overview of setting up & running a funding round:

1. Apply
2. Prepare
3. Run the round
4. Retrospective

## Timelines

Timelines of running a QF round varies widely depending on the structure of the round, as well as your team’s bandwidth to organise, promote, deploy & operate the round.

We typically recommend **8-10 weeks** of lead time to prepare to run a QF round.

## Time commitment

Requirements here vary widely depending on the structure of the round & team size.

This includes technical & operational work:

- **Technical work** -
  Eg. Configuring wallets, deploying contracts & deploying the website
  We’d recommend allocating approximately 200 hours of developer time to prepare for a round.
- **Operational work** -
  Marketing, communications, curating & reviewing project applications & community support

## 1. Apply

### Application

- First step is to submit a proposal outlining your QF plans & how you plan to use the funds from the grant application: [Apply here](apply.md)

### Application review

As part of the application review, you will have a series of calls with the QF team to review your proposal. We will brainstorm QF structure, logistics of the round & answer questions together

After we land on a general structure, we’ll establish specifics, such as:

- Which community would be organising this round?
- What is the legal entity that will receive the grant?
- What would be the funding amount?

To receive a grant from the Ethereum Foundation, the legal entity would need to complete the KYC and pass KYC/AML requirements. Here are the document requirements:

- For individuals
  1. Scanned copy of passport
  2. Proof of address from within the last 3 months, such as bank statement, utility bill or telecom subscription
- For organisations
  1. Certificate of Incorporation
  2. Proof of address from within the last 3 months, such as bank statement, utility bill or telecom subscription
  3. Shareholders' and Directors' registers / Members' register (for organization without shareholdings)
  4. For each director, officer and individual shareholder (more than 10%), please provide (i) scan copy of passport, and (ii) copy of proof of address
  5. If the shareholder is an organization and holds more than 10%, please provide 1 through 4

## 2. Prepare

### Establish roles & responsibilities

Prior to running the round, it’s important to define operational & technical responsibilities.

**Operational responsibilities:**

- Marketing & communications
- Project onboarding support
- Review project applications

**Technical responsibilities:**

- Fund holder - Set up wallet to receive funds
- Website deployer
- Smart contract deployer
- MACI key generator
- Round coordinator
- Technical workshop with QF team team to:
  - Learn about tech stack (e.g. ZKPs)
  - Learn smart contract & website deployment details
- Choose a public Ethereum chain
  - Considerations
    - Security properties of the chain (e.g. if an L2, what stage?)
    - Chain adoption within the community this round is targeting
    - Onboarding UX for end users (e.g. bridge & wallet support)
    - Gas costs for end users
- Launch website
  - Event brand guidelines/design assets
  - Prepare website copy, including documentation for users
  - Determine/create project submission form
  - Deploy & host website

### Sort out round logistics

- More on this here: [Contributor registration approaches for QF rounds](registration-approaches.md)

## 3. Run the round

Generally, QF rounds follow these steps:

### 1. Launch

Configure the on-chain parameters of the round, then deploy the smart contracts & website.

### 2. Register projects & voters

Projects and voters will need to register in order to participate in the round.

This phase is when projects can apply to join the round. Depending on the round structure, this application process can be completed entirely or partially on-chain.

During this phase, projects apply & you screen projects for eligibility, based on the chosen round criteria. Projects are submitted to the round via an on-chain registry once they clear KYC requirements. When projects are in the on-chain registry, they will appear on the website.

**Please note that QF round organisers must not have projects that they’re directly related to and/or benefiting from, apply to receive funding from the round. QF round organisers should also not nominate their own community to be a part of the QF round to receive funding.**

Examples of criteria for projects:

✅ Project focused on, and benefits (region/country/community’s) Public Goods

⛔ Not taking in projects with tokens or with prior funding of $xx

⛔ No scams or clones

### 3. Vote

The launch of the voting phase marks the official start of the funding round. The round opens to contributors, who can vote/contribute to projects.

Contributors can be your community members or event participants.

The duration of this phase is up to you. We generally recommend a 1 week voting period.

### 4. Finalise votes

During this phase, if you've voted, you will have time to change your votes. You can edit your contribution amounts or add/remove projects.

This phase is a special feature of MACI & exists to help users avoid bribery. Voters can edit their votes without anyone having visibility into which project they’ve voted for.

### 5. Tally votes

At this point, all votes are final, and can now be counted. The round coordinator (you!) calculates how much of the matching pool each project will receive.

### 6. Allocate funds

Once votes are tallied, the results are finalised! Project owners know how much funding they received, and can claim the funds.

## 4. Retrospective

This is when community leaders get the opportunity to reflect on the impact of rounds within their communities. Examples of case studies can be found [here](case-studies.md).

# Example rounds

The specific approach you take to structure the QF round can vary. Here are 2 examples:

### Example **1: Participants donate cryptocurrency to vote**

With this approach, voters can donate tokens (any ERC-20 token, typically DAI) to projects, which represent their votes, where the amount of tokens weights their votes.

This approach facilitates more fundraising for each project, given voters are donating directly in addition to the matching pool.

However, this can create additional onboarding friction for users, who need to acquire tokens on the chain the round is running on.

For an example, check out what we did during [Devcon 2022](case-studies.md).

### Example **2: Participants are credited tokens to vote**

With this approach, we generate “voice credits” for each voter, which they can spend by voting on projects.

This approach works well because it’s simple for users - they don’t need to have funds in their wallet to participate.

For an example, check out what was done during [**ETH Argentina’ 2023**](case-studies.md)!

# Apply to run a QF round!

Still interested in working with us? [Apply now](apply.md)!

# FAQs

[Find commons questions and answers about QF here](faq.md)

## Additional resources

- [Contributor registration approaches for QF rounds](registration-approaches.md)
- [MACI](https://maci.pse.dev)
- [FAQ](faq.md)

<aside>
🤔 Have a question not answered here? Please let us know! We’re happy to help.

Join [our Discord](https://discord.gg/sF5CT5rzrR) & ask in the `🔧-collaborate` channel.

</aside>
