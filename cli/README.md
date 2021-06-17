# maci-cli

## Subcommands

| Role | Action | Subcommand |
|-|-|-|
| User | Generate MACI keypair | `genMaciKeypair` |
| User | Generate MACI public key | `genMaciPubkey` |
| Coordinator | Create election | `create `|
| User | Sign up | `signup` |
| User | Change key / vote | `publish` |
| Coordinator | Generate message processing and vote tallying proofs | `genProofs` |
| Coordinator | Submit proofs | `proveOnChain` |
| Coordinator | Process and tally all votes without producing proofs | `processAndTallyWithoutProofs` |
| Coordinator | Roll back message processing and vote tallying in the MACI contract | `coordinatorReset` |

## Public and private key format

MACI uses private keys in the BabyJub field for operations which occur within
zk-SNARKs, such as decrypting messages or signing commands. As MACI is deployed
on Ethereum, we seek to avoid confusing BabyJub private keys with Ethereum
private keys. To that end, users should pass serialized formats of public and
private keys to this CLI. We use `maci-domainobj`'s `PrivKey.serialize` and
`PubKey.serialize` functions to do so. 

Examples of serialized public and private keys:

```
Private key: macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c
Public key:  macipk.2c93053fcc4dc13dfb1cdd679aea39d1667af3d937e1430766e514fd24043999
```

### Coordinator: Create election

This command deploys an instance of a MACI contract.

Note that all the example commands default to a local Ethereum testnet at
`http://localhost:8545`. For testing purposes, you can run one using:

```bash

# in maci/contracts
npm run ganache
```

Fields that the coordinator has to set:

`node build/index.js create <options>`

Example usage:

```
$ node build/index.js create -sk macisk.23d007423d56475d7e39dcd5053c5aa98f57a69ee85bc7813ccbf4c5e688307  -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -u 15 -m 15
```

Example output:

```
MACI: 0xE28158eCFde143e2536761c3254C7C31efd97271
```

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to an Ethereum provider. Default: `http://localhost:8545` |
| Coordinator's MACI private key | `-sk` or `--privkey` | A serialized MACI private key. This is *not* an Ethereum private key. Its big-endian value must be below the snark field size. |
| Prompt for the coordinator's MACI private key | `-dsk` or `--prompt-for-maci-privkey` | If specified, ignores `-sk / --privkey` and prompts the coordinator to input their MACI private key |
| Deployer's Ethereum private key | `-d` or `--deployer-privkey` | A private key of the Ethereum account to use to deploy the MACI contract |
| Prompt for the deployer's Ethereum private key | `-dp` or `--prompt-for-deployer-privkey` | If specified, ignores `-d / --deployer-privkey` and prompts the coordinator to input their Ethereum private key |
| Maximum number of users | `-u` or `--max-users` | Default: 15 |
| Maximum number of messages | `-m` or `--max-messages` | Default: 15 |
| Maximum number of vote options | `-v` or `--max-vote-options` | Default: 25 |
| Sign-up duration | `-s` or `--signup-duration` | The sign-up duration, in seconds. |
| Voting duration | `-o` or `--voting-duration` | The voting duration, in seconds. |
| Initial voice credits | `-c` or `--initial-voice-credits` | Default: 100 |
| Initial voice credit proxy contract | `-i` or `--initial-vc-proxy` | If specified, deploys the MACI contract with this address as the initial voice credit proxy constructor argument. Otherwise, deploys a ConstantInitialVoiceCreditProxy contract with the above-specified value. |
| Signup gatekeeper contract | `-g` or `--signup-gatekeeper` | If specified, deploys the MACI contract with this address as the signup gatekeeper constructor argument. Otherwise, deploys a gatekeeper contract which allows any address to sign up. | 
| Batch size for processing messages | `-bm` or `--message-batch-size` | Default: 4 |
| Batch size for tallying votes | `-bv` or `--tally-batch-size` | Default: 4 |

### Coordinator: Process, tally and verify outcome

`node build/index.js genProofs <options>`

Fields that the coordinator has to set:

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| Coordinator's MACI private key | `-sk` or `--privkey` | See above |
| Coordinator's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to perform the transaction |
| Prompt for the coordinator's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the coordinator to input their Ethereum private key |
| The final tally file | `-t` or `--tally-file` | A filepath in which to save the final vote tally and salt. |

This command does not yet support pausing and restarting the generation of the
proofs for each batch.

`node build/index.js proveOnChain <options>`

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| Coordinator's MACI private key | `-sk` or `--privkey` | See above |
| Coordinator's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to perform the transaction |
| Prompt for the coordinator's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the coordinator to input their Ethereum private key |

### User: Generate MACI keypair

`node build/index.js genMaciKeypair <options>`

The output of this command is a serialised private key and serialised
public key.

### User: Generate MACI public key

`node build/index.js genMaciPubkey <options>`

| Option | Flags | About |
|-|-|-|
| Private key | `-sk` or `--privKey` | A serialised private key |

The output of this command is a serialised public key derived from the given private key.

### User: Sign up

`node build/index.js signup <options>`

Fields that the user has to set:

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| The user's MACI public key | `-p` or `--pubkey` | This should not be an Ethereum public key. Instead, it should be the user's serialised BabyJub public key (where the x and y values have been concatenated. |
| User's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to sign up |
| Prompt for the user's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the user to input their Ethereum private key |
| Signup gatekeeper proxy data | `-s` or `--sg-data` | A hex string to pass to the sign-up gatekeeper proxy contract which may use it to determine whether to allow the user to sign up. Default: an empty bytestring. |
| Initial voice credit proxy data | `-v` or `--ivcp-data` | A hex string to pass to the initial voice credit proxy contract which may use it to determine how many voice credits to assign to the user. Default: an empty bytestring. |

### User: Change key / vote

`node build/index.js publish <options>`

Fields that the user has to set:

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| The user's MACI private key | `-sk` or `--pubkey` | This should not be an Ethereum private key |
| Prompt for the user's MACI private key | `-dsk` or `--prompt-for-maci-privkey` | If specified, ignores `-sk / --privkey` and prompts the user to input thier MACI private key |
| User's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to perform the transaction |
| Prompt for the user's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the user to input their Ethereum private key |
| State index | `-i` or `--state-index` | The state index of the user |
| The user's new or current MACI public key | `-p` or `--pubkey` | This should be a serialised BabyJub public key which should replace the user\'s public key in the state tree if the command is valid|
| Vote option index | `-v` or `--vote-option-index` | The index of the option to vote for |
| New vote weight | `-w` or `--new-vote-weight` | The vote weight to assign to said vote option |
| Nonce | `-n` or `--nonce` | The nonce of the message |
| Salt | `-s` or `--salt` | The salt of the message. If unspecified, this command will randomly generate a salt |

### Anyone: Verify a vote tally

`node build/index.js verify <options>`

Fields to set:

| Option | Flags | About |
|-|-|-|
| The final tally file | `-t` or `--tally-file` | The final tally file created by the `tally` subcommand. |

## Demonstration

This section contains a sequence of commands which will be useful for a live
demonstration. They simulate the following scenario:

1. Eve tries to bribe Alice to vote for Party B
2. Alice votes for Party B (`m0`)
3. Alice changes her key (`m1`)
4. Alice submits a vote for Party A (`m2`)
5. The coordinator processes the votes and computes the final tally
6. The expected result is: Party A has 1 vote and Party B has 0 votes. Alice’s
   invalid vote was not counted, and Eve had no way to tell.

Note that since messages are processed in reverse order, message `m0` will be rendered invalid by `m1`.

**Coordinator: create keypair**

```
node ./build/index.js genMaciKeypair
```

Example output:

```
Private key: macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c
Public key:  macipk.2c93053fcc4dc13dfb1cdd679aea39d1667af3d937e1430766e514fd24043999

Please store your private key in a safe place and do not reveal it to anyone.
```

**Alice: create keypair**

```
node ./build/index.js genMaciKeypair
```

Example output:

```
Private key: macisk.8d9bce75e0053db023ffd26597a4f389b33edd9236998e357cef36d5c978cc8
gublic key:  macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06

Please store your private key in a safe place and do not reveal it to anyone.
```

**Coordinator: create election**

```
node ./build/index.js create -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
	-e http://localhost:8545 \
	-s 15 \
	-o 60 \
	-bm 4 \
	-bv 4
```

Example output:

```
MACI: 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4
```

**Alice: sign up**

```
node ./build/index.js signup -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4
```

Example output:

```
Transaction hash: 0x3cd2e6e805b54a6dfaff840dcf496092447400a1b26ba9f3c31bd78c3fe15723
State index: 1
```

**Alice: vote for party B**

```
node ./build/index.js publish -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
	-sk macisk.8d9bce75e0053db023ffd26597a4f389b33edd9236998e357cef36d5c978cc8 \
	-p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \
	-i 1 \
	-v 1 \
	-w 9 \
	-n 1
```

Example output:

```
Transaction hash: 0xc52ff70c3bbcc91457fd61738cd00d09d8bac96c56094910e275e474132ff741
Ephemeral private key: macisk.1e3233eec8d0ccf722f2576ba5cb1b361939f0617ac3583a3eb025e4944b0e40
```

**Alice: create new key**

```
node ./build/index.js genMaciKeypair
```

Example output:

```
Private key: macisk.1c454dfd8d8afabc0955112ef32a665a0c8b85985ad65481bb9612c1ed188d0d
Public key:  macipk.be34a027c1be52d37646df2d39bcbe824877525838dcbdc4f242666fa9de7a8b

Please store your private key in a safe place and do not reveal it to anyone.
```

**Alice: change key**

```sh
node ./build/index.js publish -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
	-sk macisk.8d9bce75e0053db023ffd26597a4f389b33edd9236998e357cef36d5c978cc8 \
	-p macipk.be34a027c1be52d37646df2d39bcbe824877525838dcbdc4f242666fa9de7a8b \
	-i 1 \
	-v 0 \
	-w 9 \
	-n 1
```

Example output:

```
Transaction hash: 0x812dc6345e2515bced4f15e7ca3842d3d343c22f6729fe3216b946fa97bffc1e
Ephemeral private key: macisk.24115d8d585b7dd8f7ea1975668b3d4f34dcf8b1bcc6617bdefbed7e41b89846
```

**Alice: vote for party A**

```
node ./build/index.js publish -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.1c454dfd8d8afabc0955112ef32a665a0c8b85985ad65481bb9612c1ed188d0d \
	-p macipk.be34a027c1be52d37646df2d39bcbe824877525838dcbdc4f242666fa9de7a8b \
	-i 1 \
	-v 1 \
	-w 9 \
	-n 2
```

Example output:

```
Transaction hash: 0x45ae379b056a6fc647a3718bd356268a1bcda35e6645bb7a1aba44cb76418c98
Ephemeral private key: macisk.2b23e978301d029e46117ef0138f860e277ffed0f008712f3d7ca2c40f1a6768
```

**Coordinator: process and tally all messages and votes without producing proofs** 

In situations where the coordinator requires results quickly, they can run
`processAndTallyWithoutProofs` to process all messages and tally all votes
without producing any proofs.

```
node ./build/index.js processAndTallyWithoutProofs \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
	-sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
	-t preProofTally.json
```

**Coordinator: generate proofs** 

```
node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json
```

Example output:

```
Generating proofs of message processing...

Progress: 1 / 2; batch index: 4
Loading circuit from /home/di/t/maci/circuits/params/batchUstCircuit.r1cs...
Proving...
Saved /home/di/t/maci/circuits/params/1615726027749.proof.json and /home/di/t/maci/circuits/params/1615726027749.publicSignals.json
Proof is correct

Progress: 2 / 2; batch index: 0
Loading circuit from /home/di/t/maci/circuits/params/batchUstCircuit.r1cs...
Proving...
Saved /home/di/t/maci/circuits/params/1615726036074.proof.json and /home/di/t/maci/circuits/params/1615726036074.publicSignals.json                                                                                                         
Proof is correct
Generating proofs of vote tallying...

Progress: 1 / 2; batch index: 0
Loading circuit from /home/di/t/maci/circuits/params/qvtCircuit.r1cs...
Proving...
Saved /home/di/t/maci/circuits/params/1615726042953.proof.json and /home/di/t/maci/circuits/params/1615726042953.publicSignals.json
Proof is correct

Progress: 2 / 2; batch index: 4
Loading circuit from /home/di/t/maci/circuits/params/qvtCircuit.r1cs...
Proving...
Saved /home/di/t/maci/circuits/params/1615726045769.proof.json and /home/di/t/maci/circuits/params/1615726045769.publicSignals.json
Proof is correct
```

**Coordinator: submit all proofs**

```
node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
```

Example output:

```
Submitting proofs of message processing...

Progress: 1/true
Transaction hash: 0x7b0aa10dae7fc244d649a83dfeb1f126faa9b7ff5497c34b2aa2b539f39e1b99

Progress: 2/true
Transaction hash: 0x1741cc6294d502d987bffdf6ea5339e2bfbdee2caa53b9d4165b706301845b68
Submitting proofs of vote tallying...

Progress: 1/2
Transaction hash: 0xd059e72330db7f0402928b6e1a00ba7786d96ff66544b50d336aabc8dac4c719

Progress: 2/2
Transaction hash: 0x0e8405e8c80390508dbd9ed20eef0249574147ab708b06f8d22a9995c70d6869
```

The file `tally.json` will now contain something like the following:

```json
{
    "provider": "http://localhost:8545",
    "maci": "0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4",
    "results": {
        "commitment": "0x1cd0ec2789abceb908b06f6a74c26a848e209011ec41b3e5028bb7aeff2bdeb2",
        "tally": [
            "9",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0"
        ],
        "salt": "0x2d7f1744185507a529fdb32dec920bfdaf825b0fdba5b66661a40a71beac3b46"
    },
    "totalVoiceCredits": {
        "spent": "81",
        "commitment": "0x2d55a42ec1da99227125cf9562aa91aad12e2f1387ccf3411da79b0a953d69a6",
        "salt": "0xfc95a102f3c66d92d7a5700f1e12a6f2325c54a10efa0e1178cc21b67f0d97c"
    },
    "totalVoiceCreditsPerVoteOption": {
        "commitment": "0x18526f481cf2476543c8dcc3762f3a54af8e217d3d048810856623367ef4ba14",
        "tally": [
            "81",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0"
        ],
        "salt": "0x1f17d2ff16b9791ef4b1849bfccf420b9fece161e419ad4f8b1ef726c62e3943"
    }
}
```

Anyone can now run `verify` to check if the tally is correct:

```bash
node build/index.js verify -t tally.json
```

Example output:

```
The results commitment in the specified file is correct given the tally and salt
The total spent voice credit commitment in the specified file is correct given the tally and salt
The per vote option spent voice credit commitment in the specified file is correct given the tally and salt
The results commitment in the MACI contract on-chain is valid
The total spent voice credit commitment in the MACI contract on-chain is valid
The per vote option spent voice credit commitment in the MACI contract on-chain is valid
The total sum of votes in the MACI contract on-chain is valid.
```

## Demonstration with `prod-small` settings

Create a MACI instance:

```bash
node ./build/index.js create -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
	-e http://localhost:8545 \
	-s 10 \
	-o 10 \
	-bm 4 \
	-bv 4 \
	-u 255 \
	-m 2048 && \
node ./build/index.js signup -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-p macipk.ec084c00a3de1f1f7d74e8af70852a778f477f3db0459b2b3709cbe6a8b20a93 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js publish -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
	-sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
	-p macipk.ec084c00a3de1f1f7d74e8af70852a778f477f3db0459b2b3709cbe6a8b20a93 \
	-i 1 \
	-v 0 \
	-w 9 \
	-n 1 && \
node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json && \
sleep 5 && \
node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 && \
node ./build/index.js verify -t tally.json
```

## Demonstration with `prod-medium` settings

```bash
node ./build/index.js create \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -e http://localhost:8545 -s 10 -o 10 -bm 4 -bv 4 -u 511 -m 8192 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.ec084c00a3de1f1f7d74e8af70852a778f477f3db0459b2b3709cbe6a8b20a93 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.ec084c00a3de1f1f7d74e8af70852a778f477f3db0459b2b3709cbe6a8b20a93 \
    -i 1 -v 0 -w 9 -n 1 && \
sleep 5 && \
node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json &&
node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 && \
node ./build/index.js verify -t tally.json
```

## Demonstration with `prod-large` settings

```bash
node ./build/index.js create \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -e http://localhost:8545 -s 10 -o 10 -bm 8 -bv 4 -u 4095 -m 32768 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json &&
sleep 5 && \
node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 && \
node ./build/index.js verify -t tally.json
```


## Demonstration with `prod-32` settings

```bash
node ./build/index.js create \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -e http://localhost:8545 -s 120 -o 120 -bm 8 -bv 8 -u 4294967296 -m 4294967296 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
time node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json &&
node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 && \
node ./build/index.js verify -t tally.json
```
