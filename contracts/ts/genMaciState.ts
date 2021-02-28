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
    pollIds: number[] = [], // an empty array means we should reconstruct all polls
) => {
    // Verify and sort pollIds
    const pollIdSet = new Set()
    for (const p of pollIds) {
        assert(p >= 0)
        assert(Math.floor(p) === p)
        pollIdSet.add(p)
    }
    assert(pollIdSet.size === pollIds.length)
    pollIds.sort()

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

    const foundPollIds: number[] = []
    for (const log of deployPollLogs) {
        assert(log != undefined)
        const event = maciIface.parseLog(log)
        const pubKey = new PubKey(
            event.values._pubKey.map((x) => BigInt(x.toString()))
        )
        const pollId = Number(event.values._pollId)
        actions.push({
            type: 'DeployPoll',
            // @ts-ignore
            blockNumber: log.blockNumber,
            // @ts-ignore
            transactionIndex: log.transactionIndex,
            data: {
                pollId,
                pollAddr: event.values._pollAddr,
                pubKey,
            }
        })

        foundPollIds.push(pollId)
    }

    // Check whether each pollIds is extant
    for (const p of pollIds) {
        if (foundPollIds.indexOf(p) === -1) {
            assert(false, 'Error: a specified pollId does not exist on-chain')
        }
    }

    for (const pollId of foundPollIds) {
        // Skip polls that we wish to ignore
        if (pollIds.length > 0 && pollIds.indexOf(pollId) === -1) {
            maciState.deployNullPoll()
            continue
        }
    }

    // Recontstruct MaciState in order
}

export { genMaciStateFromContract }
