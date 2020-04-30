# MACI Circuits

## About Poseidon Hash Functions

We use the [Poseidon hash function](https://eprint.iacr.org/2019/458.pdf) to reduce the number of constraints in the circuits.

Poseidon hash functions need to be parameterized for the number of inputs.
If the input has `n` field elements, the parameter `t` would be `n + 1`, for security reasons.

We have these hash functions defined:

| Poseidon t | number of elements | Use cases                              |
| ---------- | -----------------: | -------------------------------------- |
| t = 3      |                  2 | Build Merkle tree with HashLeftRight   |
| t = 6      |                  5 | Hash stateLeaf                         |
| t = 12     |                 11 | Get message hash                       |
| t = 18     |                 17 | Hash 16 vote options and a result salt |
