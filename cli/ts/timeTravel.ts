import * as ethers from 'ethers'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'timeTravel',
        { addHelp: true },
    )

    createParser.addArgument(
        ['-s', '--seconds'],
        {
            action: 'store',
            required: true,
            type: 'int',
            help: 'The number of seconds to fast-forward on a local testnet with evm_increaseTime',
        }
    )

    createParser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: 'A connection string to an Ethereum provider. Default: http://localhost:8545',
        }
    )
}

const timeTravel = async (args: any) => {
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER
    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    await provider.send('evm_increaseTime', [args.seconds])
    await provider.send('evm_mine', [])
}

export {
    timeTravel,
    configureSubparser,
}
