---
title: Quadratic funding - Registration approaches
description: Overview of public goods funding works.
sidebar_label: Registration approaches
sidebar_position: 5
---

# Registration approaches

💡 When running a QF round, a primary consideration is how you want to control who can participate in the round & how you want to onboard users onto the application. This guide walks through a few of the potential approaches a QF round operator can take.

Each approach has tradeoffs to consider, such as ease of onboarding for contributors, operational complexity for the organizer, or whether the event can be held in-person or virtually. We try to outline those considerations below.

## Background

In order for any potential contributor to participate in a QF round (by voting or donating) they must be registered into the round. For a user to “register”, they must be added to an on-chain registry contract (a whitelist). This provides a layer of verification that helps us prevent sybil attacks.

_But why limit who can participate?_

A "sybil attack" is when one person pretends to be many people in order to subvert a system's rules. The more a system depends on each participant being a single, unique person, the more potentially vulnerable it is to sybil attacks. Social media is somewhat vulnerable: bots creating fake follows or likes are examples of relatively toothless sybil attacks. Digital voting systems are more vulnerable: if an attacker can create enough fake users to swing a vote, there can be significant and concrete consequences. Since quadratic funding is essentially a voting system, sybil attacks are a serious threat which we must defend from (by enforcing user registration).

## Contributor registration approaches

### Approach 1) NFT-gated registry

_Virtual or in-person_

A popular approach to preventing sybil attacks in a QF round is to create an NFT-gated registry. This works by issuing NFTs to individual participants.

For any user to join the QF round, they would connect their Ethereum wallet, then submit an on-chain transaction to join the round. This registry could check (& require) that any Ethereum address attempting to register must be a holder of the given NFT. In this way, only account holders of the NFT will be able to register for the QF round.

**Example QF round with NFTs: ETHBarcelona**

The ETHBarcelona organizers issued NFTs that served as tickets to their event: [ETHBarcelona NFTicket](https://doingud.com/creation/0xe570d586fbeb0dc23c46bfcf047ec3e46e88e5a700000000001c)

With their QF round, they enabled voting for only ethereum accounts who held that NFT. Anyone with the [](https://doingud.com/creation/0xe570d586fbeb0dc23c46bfcf047ec3e46e88e5a700000000001c)NFT could vote on projects. No one else could.

**When we recommend this approach:**

This can be a great option for exclusive events, such as conferences or hackathons, where there’s a limited set of attendees & you only want certain set of people to be able to participate in your QF round.

This approach can make things particularly easy if you’re already issuing an NFT to attendees, such as a POAP. That enhances the utility of your NFT & helps avoid sybil attacks.

**Potential hurdles to consider:**

If users purchased these NFTs from a “known” Ethereum address to purchase an event ticket, they may not also want to link their address to the QF round, so this might be something to communicate to participants beforehand.

### Approach 2) BrightID registry

_Virtual or in-person_

[BrightID](https://www.brightid.org/) is a platform we can use to increase our confidence that each human participant is only contributing once. BrightID is one of a new class of digital identity solutions for use cases like QF that require digital sybil resistance.

BrightID works using a web-of-trust model: users connect their BrightID accounts with people they trust to be unique humans (generally because they know them personally) and form groups. These connections are public, but users' personal data aren't. If you connect your BrightID to an app, the app can analyze your connections and decide whether or not to allow you access based on how likely you are to be a unique person. The graph of BrightID connections can be analyzed with any method, but generally, the more connections an ID has with other trustworthy-looking IDs, the more trustworthy it is.

To contribute to projects in a round, users connect a verified BrightID with their Ethereum address, then submit an on-chain transaction to register that Ethereum address. This prevents users from creating 1000s of Ethereum accounts and distorting the contributions.

**Example QF round with BrightID: EthStaker and EthColombia**

- https://qf.ethstaker.cc/#/

- https://ethcolombia.clr.fund/#/

**When we recommend this approach:**

Solutions like BrightID work well when you want to open up participation to as many people as possible, given that (in theory) anyone with a phone & an internet connection can get registered with BrightID.

**Potential hurdles to consider:**

Getting verified in BrightID requires users to make multiple connections with other BrightID users, often by joining a BrightID connection party, which involved jumping on a Zoom call. Participants who wish to remain anonymous may be hesitant to use this type of platform.

Both projects & voters have to be verified. As BrightID verification involves a few steps, folks without a technical background may consider it too intimidating and thus avoid going through the hassle of verification and thus participation in the round.

Zoom calls with BrightID staff are biased towards the Americas’ time zone, and hence it might be challenging for people from other regions to join the call at a time that’s suitable for them.

BrightID is very much in its nascent stage and thus it sometimes has bugs and as a result, downtime. During downtime, participants can’t be verified and hence cannot vote.

### Approach 3) physical “burner” wallets

_In-person_

For IRL events, this can be a fun & novel way to engage participants. It provides simple onboarding & protects user privacy while helping you prevent sybil attacks.

The steps of this process generally looks like:

1. generate an Ethereum account for every event participant
2. add those accounts to the on-chain QF registry
3. send the accounts a bit of ETH (for gas/transaction fees)
4. print out physical cards/wallets with the private keys to the accounts
5. distribute wallets to participants at the event

When participants attend the event, they can pick up one of these physical wallets. All they need to do in order to participate is import their keys into a software wallet (e.g. by scanning a QR code on their phone). This makes defending against sybil attacks simple & easy, since someone must physically acquire a wallet from the event in order to participate. By spinning up a new “burner” wallet for users, it also helps protect their privacy, since they don’t have to link their identity or any existing Ethereum account into the QF round. It’s also a fun way to provide your attendees with a physical moment of the experience!

**Example QF round with physical wallets: ETHPrague**

- https://qf.ethprague.com/

**When we recommend this approach:**

If you’re running an in-person event & have the lead time to prepare, this can be a great solution.

**Potential hurdles to consider:**

Printing physical wallets costs money & takes time, so prepare accordingly 🙂
