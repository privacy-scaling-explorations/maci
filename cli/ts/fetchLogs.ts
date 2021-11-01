import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    maciContractAbi,
} from 'maci-contracts'

import {
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'fetchLogs',
        { addHelp: true },
    )

    parser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: `A connection string to an Ethereum provider. Default: ${DEFAULT_ETH_PROVIDER}`,
        }
    )

    parser.addArgument(
        ['-x', '--contract'],
        {
            required: true,
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-b', '--start-block'],
        {
            required: true,
            type: 'int',
            help: 'The block number at which the contract was deployed',
        }
    )
    parser.addArgument(
        ['-n', '--num-blocks-per-request'],
        {
            required: true,
            type: 'int',
            help: 'The number of logs to fetch per RPC request',
        }
    )

    parser.addArgument(
        ['-o', '--output'],
        {
            required: true,
            type: 'string',
            help: 'The output file for signups and messages',
        }
    )
}

const fetchLogs = async (args: any) => {
    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)


    const maciAddress = args.contract

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    const startBlock = args.start_block
    const currentBlock = await provider.getBlockNumber()
    console.log('currentBlock:', currentBlock)

    console.log('Fetching signup logs')
    const numBlocksPerRequest = args.num_blocks_per_request
    let signUpLogs: any[] = []
    let publishMessageLogs: any[] = []

    for (let i = startBlock; i < currentBlock; i += numBlocksPerRequest) {
        console.log(`${i} / ${currentBlock}`)
        const toBlock = (i + numBlocksPerRequest) >= currentBlock ? currentBlock : i + numBlocksPerRequest
        const logs = await provider.getLogs({
            ...maciContract.filters.SignUp(),
            fromBlock: i,
            toBlock,
        })

        signUpLogs = signUpLogs.concat(logs)
    }
    console.log('Fetched', signUpLogs.length, 'signups\n')

    console.log('Fetching publish message logs')
    for (let i = startBlock; i <= currentBlock; i += numBlocksPerRequest) {
        console.log(`${i} / ${currentBlock}`)
        const toBlock = (i + numBlocksPerRequest) >= currentBlock ? currentBlock : i + numBlocksPerRequest
        const logs = await provider.getLogs({
            ...maciContract.filters.PublishMessage(),
            fromBlock: i,
            toBlock,
        })
        publishMessageLogs = publishMessageLogs.concat(logs)
    }
    console.log('Fetched', publishMessageLogs.length, 'messages\n')

    const iface = new ethers.utils.Interface(maciContractAbi)

    let data: any = {
        signUpLogs: [],
        publishMessageLogs: [],
    }

    let i = 0
    for (const log of signUpLogs) {
        if (i % 100 === 0) {
            console.log(`${i} / ${signUpLogs.length}`)
        }
        const event = iface.parseLog(log)
        const voiceCreditBalance = event.values._voiceCreditBalance.toString()
        const pubKey = [
            event.values._userPubKey[0].toString(),
            event.values._userPubKey[1].toString(),
        ]

        data.signUpLogs.push({
            voiceCreditBalance,
            pubKey,
        })
        i ++
    }

    i = 0
    for (const log of publishMessageLogs) {
        if (i % 100 === 0) {
            console.log(`${i} / ${publishMessageLogs.length}`)
        }
        const event = iface.parseLog(log)
        const msgIv = event.values._message[0].toString()
        const msgData = event.values._message[1].map((x) => x.toString())
        const encPubKey = [
            event.values._encPubKey[0].toString(),
            event.values._encPubKey[1].toString(),
        ]

        data.publishMessageLogs.push({
            msgIv,
            msgData,
            encPubKey,
        })

        i ++
    }

    fs.writeFileSync(args.output, JSON.stringify(data))
}

export {
    fetchLogs,
    configureSubparser,
}
