
import {
    maciContractAbi,
} from 'maci-contracts'

import {
    PubKey,
} from 'maci-domainobjs'


import {
    promptPwd,
    validateEthSk,
    validateEthAddress,
    checkDeployerProviderConnection,
    contractExists,
} from './utils'

import * as ethers from 'ethers'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_SG_DATA,
    DEFAULT_IVCP_DATA,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'signup',
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
        ['-p', '--pubkey'],
        {
            required: true,
            type: 'string',
            help: 'The user\'s MACI public key',
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

    const privkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    privkeyGroup.addArgument(
        ['-dp', '--prompt-for-eth-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the user\'s Ethereum private key and ignore -d / --eth-privkey',
        }
    )

    privkeyGroup.addArgument(
        ['-d', '--eth-privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The deployer\'s Ethereum private key',
        }
    )

    parser.addArgument(
        ['-s', '--sg-data'],
        {
            action: 'store',
            type: 'string',
            help: 'A hex string to pass to the sign-up gatekeeper proxy contract which may use it to determine whether to allow the user to sign up. Default: an empty bytestring.',
        }
    )

    parser.addArgument(
        ['-v', '--ivcp-data'],
        {
            action: 'store',
            type: 'string',
            help: 'A hex string to pass to the initial voice credit proxy contract which may use it to determine how many voice credits to assign to the user. Default: an empty bytestring.',
        }
    )
}

const signup = async (args: any) => {

    // User's MACI public key
    if (!PubKey.isValidSerializedPubKey(args.pubkey)) {
        console.error('Error: invalid MACI public key')
        return
    }

    const userMaciPubKey = PubKey.unserialize(args.pubkey)

    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    const maciAddress = args.contract

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    let ethSk
    // The deployer's Ethereum private key
    // The user may either enter it as a command-line option or via the
    // standard input
    if (args.prompt_for_eth_privkey) {
        ethSk = await promptPwd('Your Ethereum private key')
    } else {
        ethSk = args.eth_privkey
    }

    if (ethSk.startsWith('0x')) {
        ethSk = ethSk.slice(2)
    }

    if (!validateEthSk(ethSk)) {
        console.error('Error: invalid Ethereum private key')
        return
    }

    if (! (await checkDeployerProviderConnection(ethSk, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }

    const sgData = args.sg_data ? args.sg_data : DEFAULT_SG_DATA
    const ivcpData = args.ivcp_data ? args.ivcp_data : DEFAULT_IVCP_DATA

    const regex32ByteHex = /^0x[a-fA-F0-9]{64}$/

    if (!sgData.match(regex32ByteHex)) {
        console.error('Error: invalid signup gateway data')
        return
    }

    if (!ivcpData.match(regex32ByteHex)) {
        console.error('Error: invalid initial voice credit proxy data')
        return
    }

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)
    const wallet = new ethers.Wallet(ethSk, provider)

    if (! await contractExists(provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    let tx
    try {
        tx = await maciContract.signUp(
            userMaciPubKey.asContractParam(),
            sgData,
            ivcpData,
            { gasLimit: 1000000 }
        )

    } catch(e) {
        console.error('Error: the transaction failed')
        if (e.message) {
            console.error(e.message)
        }
        return
    }

    const receipt = await tx.wait()
    const iface = new ethers.utils.Interface(maciContract.interface.abi)
    const index = iface.parseLog(receipt.logs[1]).values._stateIndex
    console.log('Transaction hash:', tx.hash)
    console.log('State index:', index.toString())
}

export {
    signup,
    configureSubparser,
}
