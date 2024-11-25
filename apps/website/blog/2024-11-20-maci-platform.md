---
slug: MACI Platform
title: The birth of MACI Platform
description: Introducing MACI Platform
authors:
  name: ctrlc03, Doris, Hodlon
  title: MACI team members
  url: https://maci.pse.dev
  image_url: /img/pse-logo-round.png
tags: [voting, security, anonymity, roadmap, community, public goods]
excerpt: "We are pleased to introduce MACI Platform"
---

## MACI Platform - an exciting evolution for MACI

Hey folks, welcome to another update from the MACI team! Today we are excited to officially announce [MACI Platform](https://pse.dev/en/projects/maci-platform), a comprehensive platform that enables secure voting for all kinds of use cases and communities.

MACI Platform began as a fork of [easy-retro-rpgf](https://github.com/gitcoinco/easy-retro-pgf) with the MACI protocol integrated. We called it “MACI-RPGF”, and it provided a base product that could run retroactive public goods funding with privacy and anti-collusion properties.

Moving forward, the plan is to add even more features over time to fulfill a vision of the ultimate platform for super secure voting and funding that communities can easily deploy.

### Overview

The platform is composed of three components:

- A [web interface](https://github.com/privacy-scaling-explorations/maci-platform/tree/main/packages/interface) for both voters and round organizers to interact with the contracts.
- The MACI Platform [smart contracts](https://github.com/privacy-scaling-explorations/maci-platform/tree/main/packages/contracts), an extended set of the MACI smart contracts that include registries for projects and fund disbursement features.
- The [Coordinator service](https://github.com/privacy-scaling-explorations/maci-platform/issues/278) allows for the complete automation of MACI.

### MACI Platform Audience

MACI Platform is designed for a wide range of use cases: public goods funding, hackathon judging, grant making, community governance, and even state elections, to name a few. At its core, the product consists of three types of users: the **Round Operator** (the host of a voting round), the **Applicant** (those wishing to submit an application for inclusion in the round), and a subset of members that are allowed to participate in that voting round, or the **Voters**.

Having worked with the MACI protocol for years, we understand the ins-and-outs of its implementation and usage, and believe it is a powerful tool for creating a more democratic approach to building consensus within groups of people. However, we also understand that the user experience of MACI in its current implementation is far from accessible to many people. For this reason, MACI Platform is being built to be as easy and intuitive as possible for anyone to use.

### The Vision

The vision for MACI Platform is to provide a clean and simple interface for communities to run different types of secure, anti-collusion voting and funding rounds.

While the current implementation of the platform is only built for the public goods funding use case, there are plans to focus on governance and local elections in the coming year.

From the operator’s perspective, our goal is to allow the creation of a round in less than 10 minutes. This includes setting up MACI contracts and creating a voting or funding round. All the information required to customize the round will be input through the frontend, and by passing it to the backend (the MACI [coordinator service](https://github.com/privacy-scaling-explorations/maci-platform/issues/278)), all the necessary contracts will be deployed.

Projects applying to be part of a round can submit the required information via a form, which will be customizable by the round operator to include all required and relevant information for that specific round. Approvals of those projects will be at the discretion of the operators.

Finally, users/voters will be able to access the voting rounds only if they pass the gatekeeping requirements. Currently, it is possible to gate voting rounds using different strategies:

- allowing anyone to participate
- accepting only users with a certain [EAS](https://docs.attest.sh/docs/) attestation
- accepting only users part of a [Semaphore](https://semaphore.pse.dev/) group
- accepting only users with a certain [Hat](https://docs.hatsprotocol.xyz/)
- accepting only users with a certain [Zupass](https://github.com/proofcarryingdata/zupass) credential

...and many more to come. Please refer to [MACI’s gatekeeper page](https://maci.pse.dev/docs/technical-references/smart-contracts/Gatekeepers)

### Roadmap

What have we built so far? As of now, we have just released a [version 1](https://github.com/privacy-scaling-explorations/maci-platform/releases/tag/v1). This release focuses on voter and applicant project experience, enabling them to interact smoothly with the platform by signing up, submitting applications, and voting. Finally, users can also see results once the votes have been tallied by the coordinator.

V2 on the other hand, will focus on the round organizer experience. At a high level, the core devs are focusing on implementing the following features:

- Dashboard for contract deployment and round configuration
- Allowing multiple rounds to live within one MACI Platform instance
- Payout disbursement via the interface by either the voters, applicants, or operators
- Full integration with [MACI’s coordinator service](https://github.com/privacy-scaling-explorations/maci-platform/issues/278) to allow finalization of rounds within the interface
- Continued integration with different gatekeepers like [Gitcoin Passport](https://docs.passport.xyz/)

Furthermore, we plan to experiment with AA (account abstraction) to enable smooth experiences for both users and organisers. For users, we have implemented an end-to-end flow using an embedded wallet and paymaster as part of PSE’s internal [hackathon](https://github.com/privacy-scaling-explorations/hacking-pse/tree/main/packages/interface), as well as for the [Devcon round](https://vote.devcon.org/). For organizers we will be using a smart account and [session keys](https://docs.zerodev.app/sdk/advanced/session-keys) to safely interact with the coordinator service and interact with MACI contracts.

### Ecosystem Harmony

Projects like Gitcoin, Dorahacks, Snapshot, Devfolio, and Jokerace all seem to offer very similar voting, polling, and quadratic funding solutions. So what makes MACI different?

At MACI, our goal isn’t to compete, but to help push the ecosystem toward using safer, more private, and collusion-resistant voting mechanisms. We're actively working with many of the above projects to integrate the MACI protocol, ensuring that the benefits of secure voting can be used where they’re needed most. MACI Platform presents itself as just one more quadratic funding platform for communities to choose from.

It's important to note that while the anti-collusion properties of MACI provide higher security guarantees, they do come with tradeoffs— particularly in terms of user experience (UX), cost, and simplicity. The MACI team is continuously working to address these tradeoffs, but for certain use cases, these tradeoffs may not be worthwhile. For example, the encryption of votes at the end of a round may not actually be desirable or aligned with the spirit or values of any specific community. MACI Platform aims to provide privacy solutions where they’re needed the most, and to augment and support existing voting platforms.

### How to get involved

If you are a community event organizer and want to run a voting or funding round using MACI Platform, please reach out to us using this [form](https://esp.ethereum.foundation/pse-sponsorships/apply). If you are a developer and want to contribute to the code then head over to our [GitHub repo](https://github.com/privacy-scaling-explorations/maci-platform/issues) and take a look at the “good first issues” tags, or open a new one that you think it’s beneficial and you would like to work on.

Also, stay tuned for recurring voting rounds on [demo.maci.vote](https://demo.maci.vote) and our participation in hackathon as sponsors.

### References

- [easy-retro-rpgf](https://github.com/gitcoinco/easy-retro-pgf)
- [clr.fund](https://clr.fund)
- [maci](https://maci.pse.dev)
- [maci-platform](https://github.com/privacy-scaling-explorations/maci-platform)
- [EAS](https://docs.attest.sh/docs/)
- [Semaphore](https://semaphore.pse.dev/)
- [Hats Protocol](https://docs.hatsprotocol.xyz/)
- [Zupass](https://github.com/proofcarryingdata/zupass)
