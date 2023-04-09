import { contractFilepath } from './config'

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

const { ethers } = require('hardhat')

import {readJSONFile} from 'maci-common'

const configureSubparser = (subparsers: any) => {
    const deactivateKeyParser = subparsers.addParser(
        'deactivateKey',
        { addHelp: true },
    )

    deactivateKeyParser.addArgument(
        ['-p', '--pubkey'],
        {
            required: true,
            type: 'string',
            help: 'This command will deactivate your current public key.',
        }
    )

    deactivateKeyParser.addArgument(
        ['-x', '--contract'],
        {
            type: 'string',
            help: 'The MACI contract address',
        }
    )
}

const deactivateKey = async (args: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const { pubkey } = args;
    console.log(`Deactivate key: ${pubkey}`);

    // Validate MACI public key
    if (!PubKey.isValidSerializedPubKey(args.pubkey)) {
        console.error('Error: invalid MACI public key')
        return
    }

    const userMaciPubKey = PubKey.unserialize(args.pubkey)

    // Load MACI contract address
    const contractAddrs = readJSONFile(contractFilepath)
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

    let tx = null;
    try {
        tx = await maciContract.deactivateKey(
            userMaciPubKey.asContractParam(),
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
    deactivateKey,
    configureSubparser,
}
