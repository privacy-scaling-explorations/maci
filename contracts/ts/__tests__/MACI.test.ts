jest.setTimeout(90000)
import * as ethers from 'ethers'
import { deployMaci, genDeployer } from '../deploy'
import {
    //StateLeaf,
    //Command,
    VerifyingKey,
    Keypair,
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import {
    MaciState,
    genProcessVkSig,
    genTallyVkSig,
} from 'maci-core'

import { config } from 'maci-config'
import { G1Point, G2Point, stringifyBigInts } from 'maci-crypto'

const STATE_TREE_DEPTH = 10
import { genTestAccounts } from '../accounts'
const accounts = genTestAccounts(1)
const deployer = genDeployer(accounts[0].privateKey)
const coordinator = new Keypair(new PrivKey(BigInt(config.maci.coordinatorPrivKey)))

const testProcessVk = new VerifyingKey(
    new G1Point(BigInt(0), BigInt(1)),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    [
        new G1Point(BigInt(0), BigInt(1)),
        new G1Point(BigInt(0), BigInt(1)),
    ],
)

const testTallyVk = new VerifyingKey(
    new G1Point(BigInt(2), BigInt(3)),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    new G2Point([BigInt(0), BigInt(0)], [BigInt(1), BigInt(1)]),
    [
        new G1Point(BigInt(0), BigInt(1)),
        new G1Point(BigInt(0), BigInt(1)),
    ],
)

const users = [
    new Keypair(),
    new Keypair(),
    new Keypair(),
]

describe('MACI', () => {
    let maciContract

    describe('Deployment', () => {
        beforeAll(async () => {
            const r = await deployMaci(
                deployer,
                STATE_TREE_DEPTH,
            )
            maciContract = r.maciContract
        })

        it('MACI.stateTreeDepth should be correct', async () => {
            const std = await maciContract.stateTreeDepth()
            expect(std.toString()).toEqual(STATE_TREE_DEPTH.toString())
        })

        describe('Signups', () => {

            it('should sign up users', async () => {
                expect.assertions(users.length)

                for (const user of users) {
                    const tx = await maciContract.signUp(
                        user.pubKey.asContractParam(),
                    )
                    const receipt = await tx.wait()
                    expect(receipt.status).toEqual(1)
                    console.log('signUp() gas used:', receipt.gasUsed.toString())
                }
            })

            it('signUp() shold fail when given an invalid pubkey', async () => {
                try {
                    await maciContract.signUp(
                        {
                            x: '21888242871839275222246405745257275088548364400416034343698204186575808495617',
                            y: '0',
                        },
                    )
                } catch (e) {
                    const error = 'MACI: pubkey values should be less than the snark scalar field'
                    expect(e.message.endsWith(error)).toBeTruthy()
                }

            })
        })

        describe('Merge sign-ups', () => {
            it('coordinator should be able to merge the signUp AccQueue', async () => {
                let tx = await maciContract.mergeSignUpsSubRoots(0)
                let receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeSignUpsSubRoots() gas used:', receipt.gasUsed.toString())

                tx = await maciContract.mergeSignUps()
                receipt = await tx.wait()
                expect(receipt.status).toEqual(1)

                console.log('mergeSignUps() gas used:', receipt.gasUsed.toString())
            })
        })

        describe('Create polls', () => {
            // Poll parameters
            const duration = 10
            const maxValues = {
                maxUsers: 25,
                maxMessages: 25,
                maxVoteOptions: 25,
            }
            const treeDepths = {
                intStateTreeDepth: 1,
                messageTreeDepth: 2,
                voteOptionTreeDepth: 2,
            }
            const messageBatchSize = 5
            let pollId: number

            beforeAll(async () => {
                // Create the poll and get the poll ID from the tx event logs
                const tx = await maciContract.createPoll(
                    duration,
                    maxValues,
                    treeDepths,
                    messageBatchSize,
                    coordinator.pubKey.asContractParam(),
                    testProcessVk.asContractParam(),
                    testTallyVk.asContractParam(),
                    { gasLimit: 4000000 },
                )
                const receipt = await tx.wait()
                console.log('createPoll() gas used:', receipt.gasUsed.toString())
                expect(receipt.status).toEqual(1)
                const iface = new ethers.utils.Interface(maciContract.interface.abi)
                const event = iface.parseLog(receipt.logs[0])
                pollId = event.values._pollId
            })

            it('should set correct storage values', async () => {
                // Retrieve the Poll via the poll ID and check that each value is correct
                const std = await maciContract.stateTreeDepth()
                const poll = await maciContract.getPoll(pollId)

                const pollProcessVkSig = poll.processVkSig
                const pollTallyVkSig = poll.tallyVkSig

                const expectedProcessVkSig = genProcessVkSig(
                    std,
                    treeDepths.messageTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                    messageBatchSize,
                )

                const expectedTallyVkSig = genTallyVkSig(
                    std,
                    treeDepths.intStateTreeDepth,
                    treeDepths.voteOptionTreeDepth,
                )

                expect(pollProcessVkSig.toString()).toEqual(expectedProcessVkSig.toString())
                expect(pollTallyVkSig.toString()).toEqual(expectedTallyVkSig.toString())

                const onChainProcessVk = VerifyingKey.fromContract(
                    await maciContract.getProcessVk(
                        std.toString(),
                        treeDepths.messageTreeDepth.toString(),
                        treeDepths.voteOptionTreeDepth.toString(),
                        messageBatchSize.toString(),
                    )
                )
                const onChainTallyVk = VerifyingKey.fromContract(
                    await maciContract.getTallyVk(
                        std.toString(),
                        treeDepths.intStateTreeDepth.toString(),
                        treeDepths.voteOptionTreeDepth.toString(),
                    )
                )
                expect(onChainProcessVk.equals(testProcessVk)).toBeTruthy()
                expect(onChainTallyVk.equals(testTallyVk)).toBeTruthy()

                expect(poll.coordinatorPubKey.x.toString()).toEqual(coordinator.pubKey.rawPubKey[0].toString())
                expect(poll.coordinatorPubKey.y.toString()).toEqual(coordinator.pubKey.rawPubKey[1].toString())
                expect(poll.duration.toString()).toEqual(duration.toString())
                expect(poll.maxValues.maxUsers.toString()).toEqual(maxValues.maxUsers.toString())
                expect(poll.maxValues.maxMessages.toString()).toEqual(maxValues.maxMessages.toString())
                expect(poll.maxValues.maxVoteOptions.toString()).toEqual(maxValues.maxVoteOptions.toString())
                expect(poll.treeDepths.intStateTreeDepth.toString()).toEqual(treeDepths.intStateTreeDepth.toString())
                expect(poll.treeDepths.messageTreeDepth.toString()).toEqual(treeDepths.messageTreeDepth.toString())
                expect(poll.treeDepths.voteOptionTreeDepth.toString()).toEqual(treeDepths.voteOptionTreeDepth.toString())
            })
        })
    })
})
