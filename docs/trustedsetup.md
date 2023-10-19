# Trusted setup

MACI currently uses Groth16 zk-SNARKs written in `circom`. Teams who wish to
build on MACI may choose to perform a multi-party trusted setup. This allows
observers to have a higher degree of confidence that the coordinator cannot
generate fake proofs. Some teams, however, may forgo the trusted setup.

There are two possible reasons for doing so: if a team does not intend
to manage a large amount of value, and if their users accept that the risk of
coordinator misbehaviour is insufficient to justify doing the work nof a
trusted setup. After all, MACI's security model presumes a trusted coordinator.

The PSE team is making available a trusted set of zKeys for MACI's circuits,
which will be available as soon as the first ceremony is completed and
will be visible on
[p0tion's website](https://ceremony.pse.dev/projects/Maci%20v1%20Trusted%20Setup%20Ceremony).

In any case, MACI can be relatively easily modified to support PLONK, which
does not require a circuit-specific trusted setup. Its circuits, written in
[`circom`](https://github.com/iden3/circom), are compatible with Fluidex's
[`plonkit`](https://github.com/Fluidex/plonkit) tool. The downside to using
PLONK is that proof generation is not as optimised as it is for Groth16.

## How to run your own trusted setup

To run your own trusted setup, you may use 
[p0tion](https://github.com/privacy-scaling-explorations/p0tion). This is a
framework which allows to easily setup, manage, and contribute to 
Groth16 phase2 trusted setup ceremonies, both from a CLI and a web interface.
To request PSE to run a ceremony for you, please submit a PR on the 
p0tion web and CI 
[repository](https://github.com/privacy-scaling-explorations/DefinitelySetup/).
Finally, visit the [p0tion web interface](https://p0tion.pse.dev/) to see which
ceremonies are available and help secure various zk projects. 