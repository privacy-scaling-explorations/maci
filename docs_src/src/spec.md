# Specification

## User flow

Whitelisted voters named Alice and Bob register to vote by sending their public
key to the MACI smart contract. Additionally, there is a central coordinator
Charlie, whose public key is known to all.

When Alice casts her vote, she signs her vote with her private key, encrypts
her signature with Charlie's public key, and submits the result to the smart
contract.

Each voter may change her keypair at any time. To do this, she creates and
signs a key-change command, encrypts it, and sends it to the smart contract.
This makes it impossible for a briber to ever be sure that their bribe has any
effect on the bribee's vote.

If Bob, for instance, bribes Alice to vote a certain way, she can simply use
the first public key she had registered ⁠— which is now void ⁠— to cast a vote.
Since said vote is encrypted, as was the key-changing message which Alice had
previously sent to Charlie, Bob has no way to tell if Alice had indeed voted
the way he wanted her to.

Even if Alice reveals the plaintext of her vote to Bob, she just needs to not
show him the updated key command that she previously used to invalidate that
key. In short, as long as she had submitted a single encrypted command before
her vote, there is no way to tell if said vote is valid or not.

## Polls and Ballots

A **Poll** is the process by which users cast their votes on a single set of
vote options. It is akin to a referendum or election.

A **Ballot** represents a particular user's votes in a Poll, as well as their
next valid nonce. It is akin to a voting slip, which belongs to only one voter
and contains a list of their choices.

A MACI instance can have multiple Polls and multiple users. Each Poll may have
multiple Ballots, but each user may only have one Ballot per poll.

For example, a user Alice may participate in two Polls. In Poll A, she can cast
a vote for Party A, and in Poll B, she can cast a vote for Party B. Alice's
Ballot for Poll A should only reflect her vote for Party A (as well as her
nonce), and her Ballot for Poll B should only reflect her vote for Party B (and
    her nonce).

Sign-ups are perpetual — that is, there is no deadline. The only limit is the
capacity of the state tree, which is hardcoded to `5 ^ 10` (9.7 million).

When a user signs up to MACI, they can only vote in Polls whose voting period
has not expired, as well as all future Polls. For instance, if Bob signs up on
1 December 2020, and only Poll C is currently accepting votes, he can vote for
Poll C. Bob, however, cannot vote for Poll A or Poll B. Nevertheless, when Poll
D and future polls are created, he can vote for them.

## Technical process

### MACI deployment

#### Signup gatekeeper deployment

The signup gatekeeper is a way for the coordinator to define their own logic to
allowing or disallow a particular Ethereum address be used to sign up. The
signup gatekeeper contract inherits from the abstract contract
`SignUpGatekeeper` which defines a virtual function `register(address, bytes
memory)` that must be implemented. The bytes `data` can be anything, such as an
ABI-encoded ERC-721 token ID or address of an ERC20 governence token.

There are two sample signup gatekeepers that MACI provides by default. Clients
should implement their own.

##### `FreeForAllGatekeeper`

This signup gatekeeper allows anyone to sign up without restriction.

##### `SignUpTokenGatekeeper`

This signup gatekeeper restricts signups to addresses which own a certain
ERC-721 token.

To deploy this contract on a testnet, a user needs to create an instance of
`SignUpToken` and pass that into the gatekeeper contract constructor. 

Be sure to mint a token and send it to the user that will sign up by calling
`giveToken` prior to registration. They will need Keccak256 hash of their token
ID which they will use in the MACI contract's `signUp()` method that will
forward these bytes to the gatekeeper contract.

#### Voice credit proxy deployment

The voice credit proxy that defines the total number of voice credits available
to each user. Clients should implement and deploy their own voice credit proxy
for their use case. An example of a voice credit proxy is a contract that reads
an address's ERC20 token balance.

Currently, the MACI contract only supports `2 ^ 32` voice credits as this is
hardcoded in the state tree update circuit.

The voice credit proxy should inherit from the abstract
`InitialVoiceCreditProxy` contract and override the function
`getVoiceCredits(address, bytes memory)`, which returns a `uint256` which must
be less than `2 ^ 32`.

An example of a voice credit proxy is `ConstantInitialVoiceCreditProxy`. It
allows the deployer to set the voice credit balance to a constant value.

However, if a coordinator chooses to allow varying max voice credits for
particular users they can implement `InitialVoiceCreditProxy` using an override
of `getVoiceCredits`. Once again, the bytes field gives the option to get
creative with other contracts that may track or help in the calculation of this
information.

### Poll creation

Each MACI contract can theoretically support up to `2 ^ 50` polls.

![](https://hackmd.io/_uploads/B1s-NlShw.png)

The MACI contract itself wraps this process in the `deployPoll` method where
one would specify the max batch size. 

Coordinator creates a new poll by deploying the contract using a `PollFactory`
which will allow said address to be the owner which will give them access to
the `deploy()` method.

**Note:** the coordinator will need to instantiate the verification key
registry `VkRegistry`, and `AccQueue` which handles the logic for processing
the merkle tree of states.

This function will deploy an instance of the `AccQueueQuinaryMaci` for the
messages merkle tree using the specified the `messageTreeSubDepth` in the
`TreeDepths` domain object. The poll contract will be the owner of the message
queue. 

Aside from setting the empty ballot tree root and transfering ownership,
certain criteria for the parameters must be satisfied to successfully deploy
the `Poll` contract.

Namely, the max number of users must not exceed `5 ^ maxTreeDepth` (all Merkle
trees in MACI have an arity of five) to ensure there is a valid Merkle root for
each public key provided by a potential voter. This includes both the state,
message, and vote option tree. Furthermore the maximum number of messages must
be greater than the max batch size as will as be a factor, so that there is a
guarentee that all of the leaves can be queued for processing. 

Given all this information the process verifying key and the tallying verfiying
key will be generated and set inside the `VkRegistry`. 

#### Sign-ups

**Note:** The following sections assume the coordinator has deployed an
instance of MACI with the contracts outlined above, including the `VkRegistry`,
and has called `init` successfully. 


Given a user's public key as well as necessary bytes data for the respective
gateway whitelist procedure and voice credit balance, the contract attempts to
queue a state leaf for a voter.

To perform a successful signature for proofs the contract must enforce that
both points in the public key be less than the `SNARK_SCALAR_FIELD` used to
generate the circuit. 

In the current implementation, no voter is allowed to exceed `2 ^ 32` voice
credits, this may be increased in later versions. The section describing
command hashing will go into this in more detail.

When these operations complete sucessfully an event `SignUp` is emitted
containing the current state index, the submitted public key, and the
intialized voice credit balance.

#### Voting

User publishes a message to a specific `Poll` contract. The method
`publishMessage` receives both the message to publish as well as the voters
ephemeral public key which peforms the scalar checks described in the previous
section. Once the message is hashed it is then added to the message queue and
an event is emitted containing the original message as well as the public key.
This method will not succeed if called after the voting deadline, so the time
passed from deployment is less than the maximum duration set. 

### Merge queues

Coordinator merges the state and message queus by interacting with the `Poll`
contract which interfaces with `MessageProcessor`. The following methods can
only be called on the successful resolution of the `isAfterVotingDeadline`
modifier which checks to see if enough time has passed from the specified
voting `duration`.

As specified previously, when a message is published the message leaf is queued
for processing. The method `mergeSubRoots` is responsible for forming the
shortest possible state tree. If `numSrQueueOps` is zero then it will try to
merge all the subtrees in a single transaction. It does this by queuing as many
subtree roots for processing. However, the coordinator can specify a value
greater than zero, then this function can be called however many times as
necessary to reduce the tree state. This is useful when there are too many
subtrees that need to merged where a single transaction may run out of gas.

Once this step is completed, the `Poll` contract can finally reconcile the main
tree with the max tree depth specified by calling `merge(uint256 _depth)`  

### Message processing

TODO

### Vote tallying

TODO


### Result verification

TODO

## Cryptographic operations

### Key generation

Each user owns an EdDSA keypair, as does the coordinator. Every user should
have a copy of the coordinator's public key, which is stored and available from
the smart contract. Likewise, the coordinator should have a copy of each user's
public key, which they publish on-chain to sign up.

We define an EdDSA private key as a random value (initially 256 bits large)
modulo the snark field size as described in
[EIP197](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-197.md). This
results in a key size of roughly 253 bits and no more than 254 bits.
Additionally, we use [this efficient
algorithm](http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c)
to prevent modulo bias.


### Hashing

MACI uses [iden3's implementation](https://github.com/iden3/circomlib) of the
[Poseidon hash function](https://github.com/iden3/circomlib) to build the state
and message AccQueues and Merkle trees. Poseidon is a snark-friendly hash
function as it requires a small number of circuit constraints, as opposed to
CPU-friendly hash functions such as SHA256. The tradeoff is that Poseidon
consumes a lot of gas in the EVM (which is why MACI uses AccQueues instead of
incremental Merkle trees, as described in a different section of this
document).

MACI has more than one Poseidon hash function — one for a different number of
inputs (from 2 to 5). It uses `circomlib`'s `poseidon_gencontract.js` script to
generate EVM bytecode for each function. Additionally, the `maci-crypto` module
provides corresponding wrapper functions, and the `maci-domainobjs` module
abstracts the actual use of Poseidon from developers (for instance, the
`Command` class contains a `hash()` function which invokes a Poseidon hash
function that accepts 4 inputs, but the developer does not need to be concerned
about the number of inputs).

### Command signing

We use the EdDSA scheme to allow users to sign their commands. We [modified
iden3's EdDSA
implementation](https://github.com/iden3/circomlib/blob/master/src/eddsa.js) to
use Poseidon (t=2) instead of Blake512 to hash the user's private key and
convert the message to an elliptic curve point.

More information about iden3's EdDSA scheme can be found in [this
paper](https://iden3-docs.readthedocs.io/en/latest/_downloads/a04267077fb3fdbf2b608e014706e004/Ed-DSA.pdf).

### Command encryption

To encrypt a command, we first use
[ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman) in
the BabyJub elliptic curve to generate a shared key.

Each command should be encrypted with a unique shared key. When the user
publishes a message (i.e. casts a vote), they generate an ephemeral keypair
with private key \\(eSk\\) and public key \\(ePk\\).

The shared key \\(k\\) is generated using the coordinator's public key \\(cPk\\) and
the user's ephemeral private key \\(eSk\\).

Next we use MiMC7 to encrypt the command and signature with \\(k\\).

The user sends their ephemeral public key \\(ePk\\) along with the ciphertext.
The coordinator can recover the same shared key using their private key
\\(cSk\\) and the given ephemeral public key \\(ePk\\).

In summary:

- Coordinator has \\(cPk\\), \\(cSk\\).
- User generates a unique \\(ePk\\), \\(eSk\\).
- Using ECDH, the user generates \\(k\\) using \\(eSk\\) and \\(cPk\\).
- The user encrypts their command with \\(k\\), and publishes the ciphertext and
  \\(ePk\\) to the MACI contract.
- The coordinator generates \\(k\\) using \\(ePk\\) and \\(cSk\\), and can therefore
  decrypt the ciphertext.

### zk-SNARKs

MACI uses the Groth16 zk-SNARK construction on the BN245 pairing-friendly
curve. Its circuits are written in the
[`circom`](https://github.com/iden3/circom) language.

If time permits, we will perform a trusted setup for the circuits. Phase 1 of
the trusted setup will use the latest verified output of the [Perpetual Powers
of Tau ceremony](https://github.com/weijiekoh/perpetualpowersoftau). Phase 2
will ideally be run with the help of a user interface that allows for multiple
circuit setups in one go. This UI is a separate project, which is a work in
progress.

### Nothing-up-my sleeve value

The state queue and message queue both use a [nothing-up-my-sleeve
value](https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number) as the
default leaf. This value is:

```
8370432830353022751713833565135785980866757267633941821328460903436894336785
```

which is the Keccak256 hash of the UTF-8 string `Maci`. The Typescript code
used to generate it is:

```ts
BigInt(ethers.utils.solidityKeccak256(
    ['bytes'],
    [ethers.utils.toUtf8Bytes('Maci')])
) % SNARK_FIELD_SIZE
```

where `SNARK_FIELD_SIZE` is the [BN254 group order
`p`](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-197.md), equal to:

```
21888242871839275222246405745257275088548364400416034343698204186575808495617
```

## Data structures and domain objects

### AccQueue

An *AccQueue* enables MACI to build incremental Merkle trees cheaply. The
AccQueue was originally proposed by Barry Whitehat in [this
post](https://ethresear.ch/t/batch-deposits-for-op-zk-rollup-mixers-maci/6883).
Previously, MACI used incremental Merkle trees. When a user signed up or
published a message, the MACI contract would insert a leaf value at the next
unmodified index. This involved the same number of hashes in the EVM as the
depth of the tree, and as the gas cost of the snark-friendly Poseidon hash
function is high, the cost of these functions went up to hundreds of thousands
of gas. The AccQueue approach solves this by reducing the number of on-chain
hashes that each user must perform, and making the coordinator responsible for
paying for the gas needed to compute the final Merkle root.

To *enqueue* a leaf into an AccQueue is to insert it into its rightmost
subtree. When a subtree is full, the next enqueue operation creates a new
subtree. To obtain the Merkle root of all leaves, the coordinator merges all
the subtree roots. When performed on-chain, the *merge* operation can be
completed in multiple transactions, which is necessary if a single operation
would exceed the block gas limit.

There are two steps to the merge operation:

**`mergeSubRoots(uint256 _numSrQueueOps)`** This function merges the subroots
to the shortest possible tree, also known as the *small subroot tree*. For
instance, if the arity of the tree is 2 and the number of subroots is 5, the
shortest possible tree has a depth of 3 (since $2^2=4$ and $2^3=8$).

The `_numSrQueueOps` parameter restricts the number of number of subroots to
merge per transaction. This allows the entire operation to be performed in
multiple transactions. If it is set to 0, the function will attempt to perform
the operation in one go.

**`merge(uint256 _depth)`** This function must and can only be run after
`mergeSubRoots()`. It computes the Merkle root of a tree where the small
subroot tree is the leftmost leaf. The given `_depth` must be greater than or
equal to the small subroot tree depth.

### Public key

Each user has an EdDSA public key, and only they know the private key
associated with it.

### Voice credit

A unit which denotes the strength of a user's vote for a particular option. In
a quadratic voting use case, users start out with a limited number of voice
credits and spend them on votes.

### Vote weight

The number of voice credits which a user wishes to spend on a particular vote
option.

### Vote option

One out of many possible choices which a user may vote for. A vote option is
represented by an index starting from 0. 

### Vote option tree

A Merkle tree where each leaf at index \\(i\\) contains the vote weight for the
corresponding vote option \\(i\\). 


### Command

A command is an instruction from a user to cast a vote for a particular vote
option, a key-change request, or both. Its fields are:

| Field | Bits | Description |
|-|-|-|
| `stateIndex` | 50 | The index of the leaf in the state tree which contains the public key used to sign the message. This is used to point to the state leaf to update. |
| `newPubKey` | 253 * 2|  This row refers to two fields: the x- and y-coordinates of the new public key. If no change is desired, it should be that of the current key. |
| `voteOptionIndex` |  50 | The index of the leaf in the vote option tree to vote for. |
| `newVoteWeight` | 50 |  In the quadratic voting use case, this is the square root of the number of voice credits a user wishes to spend on this vote. |
| `nonce` |  50 | The nonce. |
| `pollId` |  50 | The ID of the poll for which this vote is meant. |
| `salt` | 253 | A random value to prevent brute-force attacks. |


With the values provided above an array is generated with length four that is
hashed and signed using the users private key. 

This is acheived by packing the `stateIndex`, `voteOptionIndex`,
`newVoteWeight`, `nonce`, and `pollId` into a single value. The `stateIndex` is
added to a leftwise shift of increasing increments of fifty bits to each of
subsequent parameters which are also concatenated, i.e. voteOption is shifted
by 50, voteWeight is shifted by 100 and so on, that then gives a 250-bit value.
This upper-bound limit of 50-bits provides more than enough space to run a poll
with a large number of users while allowing MACI to save on gas by packing
values using the method outlined here. 

The hashed array contains this calculated value labeled `p`, the users public
key (x and y coordinate), and the random salt. When encrypting, the signature
generated from the hashed command array is used in the plaintext of the
message. The plaintext contains both the hashed command array and user's
signture flattened into a single array, where the shared EcDH key will encrypt
and return this new message containing the ciphertext. 


### Message

A message is the encrypted version of a command and its signature. 

### State queue

The state queue is an AccQueue of state leaves. The Merkle root of all the state leaves represents a mapping of all users to their registered public key and voice credit balance.

The default (zero) leaf value is the nothing-up-my-sleeve value described above.

#### State Leaf

A state leaf is a user's public key, their voice credit balance, and the timestamp at which they signed up.

### Poll

#### Ballot

A ballot represents the outcome of a user's actions during a poll. Specifically, it consists of the user's vote option tree and their next valid nonce.

It is analogous to the slip of paper that a voter uses to indicate their preferred candidates in an election.

The next valid nonce, as described below, allows MACI to prevent replay attacks, and allows users to easily invalidate a vote they wish to use to fool a briber.

#### Ballot tree

Each poll has a tree of ballots. Since each user has one ballot per poll, the ballot tree has the same arity and depth as the state tree. The vote option tree depth, however, is variable, so we precompute the Merkle roots of five empty ballot trees, for vote option tree depths 1-5.

An empty ballot tree has an empty ballot as its default leaf. An empty ballot with a vote option tree of depth 2 would therefore be computed as such:

```
hashLeftRight(
    0, // the nonce
    root(2, 0, 5) // a quinary Merkle root of a tree with depth 5 and default leaf 0
)
```

#### Message queue

    Each poll has a message queue. Like the state queue, each message queue is an AccQueue. Each leaf is the hash of a message.

    The default (zero) leaf value is the nothing-up-my-sleeve value described above.
