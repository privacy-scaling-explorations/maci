import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

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
        'download',
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
        ['-o', '--output'],
        {
            required: true,
            type: 'string',
            help: 'The output file for signups and messages',
        }
    )
}

const download = async (args: any) => {
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

    //const maciContract = new ethers.Contract(
        //maciAddress,
        //maciContractAbi,
        //provider,
    //)

    const zerothLeaf = StateLeaf.genRandomLeaf()
    const coordinatorKeypair = new Keypair()

    const maciState = await genMaciStateFromContract(
        provider,
        maciAddress,
        coordinatorKeypair,
        zerothLeaf,
        false,
    )
    console.log('numSignups:', maciState.users.length)
    console.log('numMessages', maciState.messages.length)
    
    const data: any = {
        users: [],
        messages: [],
    }

    for (const user of maciState.users) {
        data.users.push({
            pubKey: user.pubKey.serialize(),
            voiceCreditBalance: user.voiceCreditBalance.toString(),
        })
    }

    let i = 0
    for (const message of maciState.messages) {
        data.messages.push({
            encPubKey: maciState.encPubKeys[i].serialize(),
            iv: message.iv.toString(),
            data: message.data.map((x) => x.toString())
        })
        i ++
    }

    fs.writeFileSync(args.output, JSON.stringify(data, null, 2))
}

export {
    download,
    configureSubparser,
}
