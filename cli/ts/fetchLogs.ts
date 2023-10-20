import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    parseArtifact,
} from 'maci-contracts'

import {
    validateEthAddress,
    contractExists,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'


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
        ['-x', '--maci-contract'],
        {
            required: false,
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-i', '--poll-id'],
        {
            required: false,
            type: 'int',
            help: 'The Poll ID',
        }
    )

    parser.addArgument(
        ['-p', '--poll-contract'],
        {
            required: false,
            type: 'string',
            help: 'The Poll contract address',
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
        ['-f', '--end-block'],
        {
            required: false,
            type: 'int',
            help: 'The last block number to fetch logs from. If not specified, the current block number is used',
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
    // read the contract addresses from the config file
    const contractAddrs = readJSONFile(contractFilepath)

    const pollId = args.poll_id ? args.poll_id : 0
    const pollArtifactName = `Poll-${pollId}`

    // ensure we have at least one address
    if ((!contractAddrs||!contractAddrs["MACI"]||!contractAddrs[pollArtifactName]) && !args.maci_contract && !args.poll_contract) {
        console.error('Error: MACI and Poll contract addresses are empty or this poll Id does not exist') 
        return 
    }
    // prioritize cli flag arg
    const maciAddress = args.maci_contract ? args.maci_contract: contractAddrs["MACI"]
    const pollAddress = args.poll_contract ? args.poll_contract: contractAddrs[pollArtifactName]

    // validate it's a valid eth address
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    if (!validateEthAddress(pollAddress)) {
        console.error("Error: invalid Poll contract address")
        return 
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    if (!(await contractExists(provider, maciAddress))) {
        console.error('Error: there is no MACI contract deployed at the specified address')
        return
    }

    if (!(await contractExists(provider, pollAddress))) {
        console.error('Error: there is no Poll contract deployed at the specified address')
        return
    }

    // fetch abis
    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    const pollContract = new ethers.Contract(
        pollAddress,
        pollContractAbi,
        provider
    )

    const startBlock = args.start_block

    // calculate the end block number 
    const endBlockNumber = args.end_block ? args.end_block : await provider.getBlockNumber()
    console.log('Fetching logs till:', endBlockNumber)

    console.log('Fetching signup and publish message logs')
    const numBlocksPerRequest = args.num_blocks_per_request

    // arrays to store the logs
    let signUpLogs: any[] = []
    let publishMessageLogs: any[] = []
    let topUpMessageLogs: any[] = []

    // loop and get all events
    for (let i = startBlock; i < endBlockNumber; i += numBlocksPerRequest + 1) {
        console.log(`${i} / ${endBlockNumber}`)
        const toBlock = (i + numBlocksPerRequest) >= endBlockNumber ? undefined : i + numBlocksPerRequest
        // fetch signups from the MACI contract
        const sLogs = await provider.getLogs({
            ...maciContract.filters.SignUp(),
            fromBlock: i,
            toBlock,
        })

        signUpLogs = signUpLogs.concat(sLogs)

        // fetch messages from the Poll contract
        const mLogs = await provider.getLogs({
            ...pollContract.filters.PublishMessage(),
            fromBlock: i,
            toBlock,
        })
        publishMessageLogs = publishMessageLogs.concat(mLogs)

        // fetch the topup messages from the Poll contract
        const tLogs = await provider.getLogs({
            ...pollContract.filters.TopupMessage(),
            fromBlock: i,
            toBlock
        })
        topUpMessageLogs = topUpMessageLogs.concat(tLogs)

    }
    console.log('Fetched', signUpLogs.length, 'signups from MACI\n')
    console.log('Fetched', publishMessageLogs.length, 'messages from Poll\n')
    console.log('Fetched', topUpMessageLogs.length, 'topup Messages from Poll')

    const ifaceMaci = new ethers.utils.Interface(maciContractAbi)
    const ifacePoll = new ethers.utils.Interface(pollContractAbi)

    let data: any = {
        signUpLogs: [],
        publishMessageLogs: [],
        topupMessagesLogs: []
    }

    let i = 0
    /*
        event SignUp(
        uint256 _stateIndex,
        PubKey _userPubKey,
        uint256 _voiceCreditBalance,
        uint256 _timestamp
    );
    */
    for (const log of signUpLogs) {
        if (i % 100 === 0) {
            console.log(`${i} / ${signUpLogs.length}`)
        }
        const event = ifaceMaci.parseLog(log)
        const voiceCreditBalance = event.args._voiceCreditBalance.toString()
        const pubKey = [
            event.args._userPubKey[0].toString(),
            event.args._userPubKey[1].toString(),
        ]

        data.signUpLogs.push({
            voiceCreditBalance,
            pubKey,
        })
        i ++
    }

    i = 0
    /*
        event PublishMessage(Message _message, PubKey _encPubKey);
    */
    for (const log of publishMessageLogs) {
        if (i % 100 === 0) {
            console.log(`${i} / ${publishMessageLogs.length}`)
        }
        const event = ifacePoll.parseLog(log)
        const msgIv = event.args._message[0].toString()
        const msgData = event.args._message[1].map((x: any) => x.toString())
        const encPubKey = [
            event.args._encPubKey[0].toString(),
            event.args._encPubKey[1].toString(),
        ]

        data.publishMessageLogs.push({
            msgIv,
            msgData,
            encPubKey,
        })

        i ++
    }

    /*
        event TopupMessage(Message _message);
    */
    for (const log of topUpMessageLogs) {
        if (i % 100 === 0) {
            console.log(`${i} / ${publishMessageLogs.length}`)
        }
        const event = ifacePoll.parseLog(log)
        const msgIv = event.args._message[0].toString()
        const msgData = event.args._message[1].map((x: any) => x.toString())

        data.topupMessagesLogs.push({
            msgIv,
            msgData
        })
    }

    fs.writeFileSync(args.output, JSON.stringify(data))
}

export {
    fetchLogs,
    configureSubparser,
}
