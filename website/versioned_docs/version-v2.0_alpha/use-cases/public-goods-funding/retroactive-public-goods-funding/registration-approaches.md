---
title: Retroactive public goods funding - Registration approaches
description: Overview of public goods funding works.
sidebar_label: Registration approaches
sidebar_position: 4
---

# Registration approaches

💡 When running a RPGF round, a primary consideration is how you want to control who can participate in the round & how you want to onboard users onto the application. This guide walks through a few of the potential approaches a RPGF round operator can take.

Each approach has tradeoffs to consider, such as ease of onboarding for contributors, operational complexity for the organizer, or whether the event can be held in-person or virtually. We try to outline those considerations below.

## Background

In order for any potential contributor to participate in a RPGF round (by voting or donating) they must be registered into the round. For a user to “register”, they must fulfil certain criteria set by the round organizers. This provides a layer of verification that helps us prevent sybil attacks.

_But why limit who can participate?_

A "sybil attack" is when one person pretends to be many people in order to subvert a system's rules. The more a system depends on each participant being a single, unique person, the more potentially vulnerable it is to sybil attacks. Social media is somewhat vulnerable: bots creating fake follows or likes are examples of relatively toothless sybil attacks. Digital voting systems are more vulnerable: if an attacker can create enough fake users to swing a vote, there can be significant and concrete consequences. Since quadratic funding is essentially a voting system, sybil attacks are a serious threat which we must defend from (by enforcing user registration).

## Contributor registration approaches

### Ethereum Attestation Service (EAS)

Currently, we are experimenting with using [EAS](https://attest.org/) to gatekeep access to MACI rpgf rounds. Round organizers are tasked to select a trusted community of voters to which they will issue attestations. These attestations are then used to verify the identity of voters during the registration phase and allow to participate in the funding round.
