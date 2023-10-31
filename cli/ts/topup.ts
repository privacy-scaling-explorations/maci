import {
    getDefaultSigner,
    parseArtifact,
} from 'maci-contracts'

import {
    validateEthAddress,
    contractExists,
} from './utils'

import {readJSONFile} from 'maci-common'

const { ethers } = require('hardhat')

import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'topup',
        { addHelp: true },
    )

    parser.addArgument(
        ['-x', '--contract'],
        {
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-a', '--amount'],
        {
            required: true,
            type: 'int',
            action: 'store',
            help: 'The amount of topup'
        }
    )

    parser.addArgument(
        ['-i', '--state-index'],
        {
            required: true,
            type: 'int',
            action: 'store',
            help: 'state leaf index'
        }
    )

    parser.addArgument(
        ['-o', '--poll-id'],
        {
            required: true,
            type: 'int',
            action: 'store',
            help: 'poll id'
        }
    )
}

const topup = async (args: any) => {
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

    const signer = await getDefaultSigner()

    if (! await contractExists(signer.provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return 
    }

    const amount = args.amount 
    if (amount < 0) {
        console.error('Error: topup amount must be greater than 0')
        return 
    }
    const stateIndex = BigInt(args.state_index)
    if (stateIndex < 0) {
        console.error('Error: the state index must be greater than 0')
        return 
    }
    const pollId = args.poll_id
    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 
    }

    const maciContractAbi = parseArtifact('MACI')[0]
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )
    const [ pollContractAbi ] = parseArtifact('Poll')
    const pollAddr = await maciContract.getPoll(pollId)
    if (! (await contractExists(signer.provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )


    let tx
    try {
        tx = await pollContract.topup(
            stateIndex,
            amount.toString(),
            { gasLimit: 1000000 },
        )
        await tx.wait()
        console.log('Transaction hash:', tx.hash)
    } catch(e) {
        if (e.message) {
            if (e.message.endsWith('PollE03')) {
                console.error('Error: the voting period is over.')
            } else {
                console.error('Error: the transaction failed.')
                console.error(e.message)
            }
        }
        return 
    }
    return 
}

export {
    topup,
    configureSubparser,
}
