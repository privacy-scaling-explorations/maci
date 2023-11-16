---
title: MACI Trusted Setup
description: Introduction to the MACI multi-party trusted setup
sidebar_label: Trusted Setup
sidebar_position: 7
---


# Trusted setup

MACI currently uses Groth16 zk-SNARKs written in `circom`. Teams who wish to
build on MACI may choose to perform a multi-party trusted setup. This allows
observers to have a higher degree of confidence that the coordinator cannot
generate fake proofs. Some teams, however, may forgo the trusted setup.

There are two possible reasons for doing so: if a team does not intend
to manage a large amount of value, and if their users accept that the risk of
coordinator misbehaviour is insufficient to justify doing the work nof a
trusted setup. After all, MACI's security model presumes a trusted coordinator.

In any case, MACI can be relatively easily modified to support PLONK, which
does not require a circuit-specific trusted setup. Its circuits, written in
[`circom`](https://github.com/iden3/circom), are compatible with Fluidex's
[`plonkit`](https://github.com/Fluidex/plonkit) tool. The downside to using
PLONK is that proof generation is not as optimised as it is for Groth16.

## How to run the trusted setup

First, follow the instructions in the [Installation](./installation)
section to install dependencies for MACI.

Next, configure and compile circuits following instructions in
[Circuits](./circuits).

Finally, use the [`multisetups`](https://github.com/privacy-scaling-explorations/multisetups)
tool to do this.

You should perform at least one contribution to each circuit, even if you
choose not to perform a multi-party trusted setup.

We don't recommend a browser-based trusted setup (which [Tornado
Cash](https://ceremony.tornado.cash/) and [Zkopru](https://mpc.zkopru.network/)
used) for the MACI circuits as they are too large to be feasibly processed in
the browser.
