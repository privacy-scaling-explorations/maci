import {
    Keypair,
    PubKey,
    Message,
    VerifyingKey,
} from 'maci-domainobjs'

import {
    maciContractAbi,
    parseArtifact,
} from './'

import {
    MaciState,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-core'

import {
    hash3,
} from 'maci-crypto'

import * as ethers from 'ethers'
import * as assert from 'assert'

interface Action {
    type: string;
    data: any;
    blockNumber: number;
    transactionIndex: number;
}

const genMaciStateFromContract = async (
    provider: ethers.providers.Provider,
    address: string,
    coordinatorKeypair: Keypair,
    pollId: number,
) => {
    // Verify and sort pollIds
    assert(pollId >= 0)

    const [ pollContractAbi ] = parseArtifact('Poll')

    const maciContract = new ethers.Contract(
        address,
        maciContractAbi,
        provider,
    )

    const maciIface = new ethers.utils.Interface(maciContractAbi)
    const pollIface = new ethers.utils.Interface(pollContractAbi)

    const maciState = new MaciState()

    // Check stateTreeDepth
    const stateTreeDepth = await maciContract.stateTreeDepth()
    assert(stateTreeDepth === maciState.stateTreeDepth)

    // Fetch event logs
    const initLogs = await provider.getLogs({
        ...maciContract.filters.Init(),
        fromBlock: 0,
    })

    // init() should only be called up to 1 time
    assert(
        initLogs.length <= 1, 
        'More than 1 init() event detected which should not be possible',
    )

    const signUpLogs = await provider.getLogs({
        ...maciContract.filters.SignUp(),
        fromBlock: 0,
    })

    const mergeStateAqSubRootsLogs = await provider.getLogs({
        ...maciContract.filters.MergeStateAqSubRoots(),
        fromBlock: 0,
    })

    const mergeStateAqLogs = await provider.getLogs({
        ...maciContract.filters.MergeStateAq(),
        fromBlock: 0,
    })

    const deployPollLogs = await provider.getLogs({
        ...maciContract.filters.DeployPoll(),
        fromBlock: 0,
    })

    let messageAqFactoryAddress
    let vkRegistryAddress

    for (const log of initLogs) {
        const event = maciIface.parseLog(log)
        vkRegistryAddress = event.args._vkRegistry
        messageAqFactoryAddress = event.args._messageAqFactory
    }

    const actions: Action[] = []

    // Order logs by block height and transaction nonce
    for (const log of signUpLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        actions.push({
            type: 'SignUp',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                stateIndex: Number(event.args._stateIndex),
                pubKey: new PubKey(
                    event.args._userPubKey.map((x) => BigInt(x)),
                ),
                voiceCreditBalance: Number(event.args._voiceCreditBalance),
            }
        })
    }

    for (const log of mergeStateAqSubRootsLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        const p =  Number(event.args._pollId)

        //// Skip in favour of Poll.MergeMaciStateAqSubRoots
        //if (p === pollId) {
            //continue
        //}

        actions.push({
            type: 'MergeStateAqSubRoots',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                numSrQueueOps: Number(event.args._numSrQueueOps),
                pollId: p,
            }
        })
    }
 
    for (const log of mergeStateAqLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        const p =  Number(event.args._pollId)

        //// Skip in favour of Poll.MergeMaciStateAq
        //if (p === pollId) {
            //continue
        //}

        actions.push({
            type: 'MergeStateAq',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: { 
                pollId: p,
            }
        })
    }

    let i = 0
    const foundPollIds: number[] = []
    const pollContractAddresses: string[] = []
    for (const log of deployPollLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        const pubKey = new PubKey(
            event.args._pubKey.map((x) => BigInt(x.toString()))
        )

        const pollId = Number(event.args._pollId)
        assert(pollId === i)

        const pollAddr = event.args._pollAddr
        actions.push({
            type: 'DeployPoll',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: { pollId, pollAddr, pubKey }
        })

        foundPollIds.push(pollId)
        pollContractAddresses.push(pollAddr)
        i ++
    }

    // Check whether each pollIds is extant
    assert(
        foundPollIds.indexOf(pollId) > -1,
        'Error: the specified pollId does not exist on-chain',
    )

    const pollContractAddress = pollContractAddresses[pollId]
    const pollContract = new ethers.Contract(
        pollContractAddress,
        pollContractAbi,
        provider,
    )

    const coordinatorPubKeyOnChain = await pollContract.coordinatorPubKey()
    assert(coordinatorPubKeyOnChain[0].toString() === coordinatorKeypair.pubKey.rawPubKey[0].toString())
    assert(coordinatorPubKeyOnChain[1].toString() === coordinatorKeypair.pubKey.rawPubKey[1].toString())

    const duration = Number(await pollContract.duration())
    const processVkSig = BigInt(await pollContract.processVkSig())
    const tallyVkSig = BigInt(await pollContract.tallyVkSig())
    const pptAddr = await pollContract.ppt()
    const onChainMaxValues = await pollContract.maxValues()
    const onChainTreeDepths = await pollContract.treeDepths()
    const onChainBatchSizes = await pollContract.batchSizes()

    assert(vkRegistryAddress === await maciContract.vkRegistry())
    const [ VkRegistryAbi ] = parseArtifact('VkRegistry')
    const vkRegistryContract = new ethers.Contract(
        vkRegistryAddress,
        VkRegistryAbi,
        provider,
    )

    const onChainProcessVk = await vkRegistryContract.getProcessVkBySig(processVkSig.toString())
    const onChainTallyVk = await vkRegistryContract.getTallyVkBySig(tallyVkSig.toString())
    const processVk = VerifyingKey.fromContract(onChainProcessVk)
    const tallyVk = VerifyingKey.fromContract(onChainTallyVk)

    const maxValues = {
        maxMessages: Number(onChainMaxValues.maxMessages.toNumber()),
        maxVoteOptions: Number(onChainMaxValues.maxVoteOptions.toNumber()),
    }
    const treeDepths = {
        intStateTreeDepth: Number(onChainTreeDepths.intStateTreeDepth),
        messageTreeDepth: Number(onChainTreeDepths.messageTreeDepth),
        messageTreeSubDepth: Number(onChainTreeDepths.messageTreeSubDepth),
        voteOptionTreeDepth: Number(onChainTreeDepths.voteOptionTreeDepth),
    }
    const batchSizes = {
        tallyBatchSize: Number(onChainBatchSizes.tallyBatchSize),
        messageBatchSize: Number(onChainBatchSizes.messageBatchSize),
    }

    const publishMessageLogs = await provider.getLogs({
        ...pollContract.filters.PublishMessage(),
        fromBlock: 0,
    })

    const mergeMaciStateAqSubRootsLogs = await provider.getLogs({
        ...pollContract.filters.MergeMaciStateAqSubRoots(),
        fromBlock: 0,
    })

    const mergeMaciStateAqLogs = await provider.getLogs({
        ...pollContract.filters.MergeMaciStateAq(),
        fromBlock: 0,
    })

    const mergeMessageAqSubRootsLogs = await provider.getLogs({
        ...pollContract.filters.MergeMessageAqSubRoots(),
        fromBlock: 0,
    })

    const mergeMessageAqLogs = await provider.getLogs({
        ...pollContract.filters.MergeMessageAq(),
        fromBlock: 0,
    })

    for (const log of publishMessageLogs) {
        assert(log != undefined)
        const event = pollIface.parseLog(log)

        const message = new Message(
            BigInt(event.args._message[0]),
            event.args._message[1].map((x) => BigInt(x)),
        )

        const encPubKey = new PubKey(
            event.args._encPubKey.map((x) => BigInt(x.toString()))
        )

        actions.push({
            type: 'PublishMessage',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                message,
                encPubKey,
            }
        })
    }

    for (const log of mergeMaciStateAqSubRootsLogs) {
        assert(log != undefined)
        const event = pollIface.parseLog(log)

        const numSrQueueOps = Number(event.args._numSrQueueOps)
        actions.push({
            type: 'MergeMaciStateAqSubRoots',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                numSrQueueOps,
            }
        })
    }

    for (const log of mergeMaciStateAqLogs) {
        assert(log != undefined)
        const event = pollIface.parseLog(log)

        const stateRoot = BigInt(event.args._stateRoot)
        actions.push({
            type: 'MergeMaciStateAq',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: { stateRoot }
        })
    }

    for (const log of mergeMessageAqSubRootsLogs) {
        assert(log != undefined)
        const event = pollIface.parseLog(log)

        const numSrQueueOps = Number(event.args._numSrQueueOps)
        actions.push({
            type: 'MergeMessageAqSubRoots',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                numSrQueueOps,
            }
        })
    }

    for (const log of mergeMessageAqLogs) {
        assert(log != undefined)
        const event = pollIface.parseLog(log)

        const messageRoot = BigInt(event.args._messageRoot)
        actions.push({
            type: 'MergeMessageAq',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: { messageRoot }
        })
    }

    // Sort actions
    sortActions(actions)

    // Reconstruct MaciState in order

    for (const action of actions) {
        console.log(action.type)
        if (action['type'] === 'SignUp') {
            maciState.signUp(
                action.data.pubKey,
                action.data.voiceCreditBalance,
            )
        //} else if (action['type'] === 'MergeStateAqSubRoots') {
            //maciState.stateAq.mergeSubRoots(
                //action.data.numSrQueueOps,
            //)
        //} else if (action['type'] === 'MergeStateAq') {
            //maciState.stateAq.merge()
        } else if (action['type'] === 'DeployPoll') {
            if (action.data.pollId === pollId) {
                maciState.deployPoll(
                    duration,
                    maxValues,
                    treeDepths,
                    batchSizes.messageBatchSize,
                    coordinatorKeypair,
                    processVk,
                    tallyVk,
                )
            } else {
                maciState.deployNullPoll()
            }
        } else if (action['type'] === 'PublishMessage') {
            maciState.polls[pollId].publishMessage(
                action.data.message,
                action.data.encPubKey,
            )
        } else if (action['type'] === 'MergeMaciStateAqSubRoots') {
            maciState.stateAq.mergeSubRoots(
                action.data.numSrQueueOps,
            )
        } else if (action['type'] === 'MergeMaciStateAq') {
            maciState.stateAq.merge(stateTreeDepth)
        } else if (action['type'] === 'MergeMessageAqSubRoots') {
            maciState.polls[pollId].messageAq.mergeSubRoots(
                action.data.numSrQueueOps,
            )
        } else if (action['type'] === 'MergeMessageAq') {
            maciState.polls[pollId].messageAq.merge(
                treeDepths.messageTreeDepth,
            )
            const poll = maciState.polls[pollId]
            assert(
                poll.messageAq.mainRoots[treeDepths.messageTreeDepth] ===
                action.data.messageRoot
            )
        }
    }
}

const sortActions = (actions: Action[]) => {
    actions.sort((a, b) => {
        if (a.blockNumber > b.blockNumber) { return 1 }
        if (a.blockNumber < b.blockNumber) { return -1 }

        if (a.transactionIndex > b.transactionIndex) { return 1 }
        if (a.transactionIndex < b.transactionIndex) { return -1 }
        return 0
    })
    return actions
}

export { genMaciStateFromContract }
