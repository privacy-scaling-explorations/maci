---
title: StateLeaf
description: A short introduction of the main primitives used by MACI
sidebar_label: StateLeaf
sidebar_position: 6
---

A state leaf represents a user's participation declared through an identity (their public key) and information relevant to their ability or right to cast votes in a poll (their voice credit balance and the block timestamp at which they signed up).

We define a state leaf $sl$ as the $poseidon_4$ hash of the following:

| Symbol     | Name                      | Comments                                    |
| ---------- | ------------------------- | ------------------------------------------- |
| $sl_{P_x}$ | Public key's x-coordinate |                                             |
| $sl_{P_y}$ | Public key's y-coordinate |                                             |
| $sl_{v}$   | Voice credit balance      |                                             |
| $sl_{t}$   | Block timestamp           | In Unix time (seconds since Jan 1 1970 UTC) |

The hash $sl$ is computed as such:

$sl = poseidon_4([sl_{A_x}, sl_{A_y}, sl_{v}, sl_{t}])$

## Blank state leaf

A blank state leaf $sl_B$ has the following value:

$6769006970205099520508948723718471724660867171122235270773600567925038008762$

This value is computed as such:

$A_{b_x} = 10457101036533406547632367118273992217979173478358440826365724437999023779287$
$A_{b_y} = 19824078218392094440610104313265183977899662750282163392862422243483260492317$
$sl_B = poseidon_4([A_{b0}, A_{b1}, 0, 0])$

The code to derive $A_{b_x}$ and $A_{b_y}$ is [here](https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js). The function call required is `pedersenHash.getBasePoint('blake', 0)`

1. Hash the string `PedersenGenerator_00000000000000000000000000000000_00000000000000000000000000000000` with $blake_{256}$. In big-endian hexadecimal format, the hash should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697160`.
2. Set the 255th bit to 0. The result should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697120`.
3. Use the method to convert a buffer to a point on the BabyJub curve described in [2.3.2].
4. Multiply the point by 8. The result is the point with x-value $A_{b_x}$ and y-value $A_{b_y}$

Given the [elliptic curve discrete logarithm problem](https://wstein.org/edu/2007/spring/ent/ent-html/node89.html), we assume that no one knows the private key $s \in {F}_p$ and by using the public key generation procedure in [1.4], we can derive $A_{b_x}$ and $A_{b_y}$. Furthermore, the string above (`PedersenGenerator...`) acts as a nothing-up-my-sleeve value.
