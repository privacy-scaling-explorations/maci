import {
    getDefaultSigner,
    parseArtifact,
} from 'maci-contracts'

import {
    PubKey,
} from 'maci-domainobjs'


import {
    validateEthAddress,
    contractExists,
} from './utils'

import {readJSONFile} from 'maci-common'

const { ethers } = require('hardhat')

import {
    DEFAULT_SG_DATA,
    DEFAULT_IVCP_DATA,
} from './defaults'
import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'signup',
        { addHelp: true },
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
            type: 'string',
            help: 'The MACI contract address',
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


    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty') 
        return 
    }
    const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
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

    const signer = await getDefaultSigner()

    if (! await contractExists(signer.provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const maciContractAbi = parseArtifact('MACI')[0]
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
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
    const iface = maciContract.interface
    console.log('Transaction hash:', tx.hash)
    // get state index from the event
    if (receipt && receipt.logs) {
        const stateIndex = iface.parseLog(receipt.logs[0]).args[0]
        console.log('State index:', stateIndex.toString())
    } else {
        console.error('Error: unable to retrieve the transaction receipt')
    }
}

export {
    signup,
    configureSubparser,
}
