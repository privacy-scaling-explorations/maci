import {
    Keypair,
    PubKey,
} from 'maci-domainobjs'

import {
    maciContractAbi,
    loadAbi,
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

    const pollContractAbi = loadAbi('Poll.abi')

    const maciContract = new ethers.Contract(
        address,
        maciContractAbi,
        provider,
    )

    const maciIface = new ethers.utils.Interface(maciContractAbi)

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

    let vkRegistryAddress
    let messageAqFactoryAddress

    for (const log of initLogs) {
        const event = maciIface.parseLog(log)
        vkRegistryAddress = event.values._vkRegistry
        messageAqFactoryAddress = event.values._messageAqFactory
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
                stateIndex: Number(event.values._stateIndex),
                userPubKey: Number(event.values._userPubKey),
                voiceCreditBalance: Number(event.values._voiceCreditBalance),
            }
        })
    }

    // TODO: check for duplicates!!
    for (const log of mergeStateAqSubRootsLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        actions.push({
            type: 'MergeStateAqSubRoots',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                numSrQueueOps: Number(event.values._numSrQueueOps),
            }
        })
    }
 
    // TODO: check for duplicates!!
    for (const log of mergeStateAqLogs) {
        assert(log != undefined)
        actions.push({
            type: 'MergeStateAq',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: { }
        })
    }

    let i = 0
    const foundPollIds: number[] = []
    const pollContractAddresses: string[] = []
    for (const log of deployPollLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        const pubKey = new PubKey(
            event.values._pubKey.map((x) => BigInt(x.toString()))
        )

        const pollId = Number(event.values._pollId)
        assert(pollId === i)

        const pollAddr = event.values._pollAddr
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

    // Recontstruct MaciState in order
}

export { genMaciStateFromContract }
