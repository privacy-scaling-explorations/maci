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
        'airdrop',
        { addHelp: true },
    )

    parser.addArgument(
        ['-e', '--erc20-contract'],
        {
            type: 'string',
            help: 'The topup credit contract address',
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
        ['-x', '--contract'],
        {
            type: 'string',
            help: 'The MACI contract address',
        }
    )
    parser.addArgument(
        ['-o', '--poll-id'],
        {
            type: 'int',
            action: 'store',
            help: 'poll id'
        }
    )

}

const airdrop = async (args: any) => {
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["TopupCredit"]) && !args.erc20_contract) {
        console.error('Error: ERC20 contract address is empty') 
        return 
    }
    const ERC20Address = args.erc20_contract ? args.erc20_contract: contractAddrs["TopupCredit"]

    if (!validateEthAddress(ERC20Address)) {
        console.error('Error: invalid topup credit contract address')
        return 
    }

    const signer = await getDefaultSigner()

    if (! await contractExists(signer.provider, ERC20Address)) {
        console.error('Error: there is no contract deployed at the specified address')
        return 
    }

    const ERC20ContractAbi = parseArtifact('TopupCredit')[0]
    const ERC20Contract = new ethers.Contract(
        ERC20Address,
        ERC20ContractAbi,
        signer,
    )
    const amount = args.amount 
    if (amount < 0) {
        console.error('Error: airdrop amount must be greater than 0')
        return 
    }

    let tx
    try {
        tx = await ERC20Contract.airdrop(
            amount.toString(),
            { gasLimit: 1000000 }
        )
        await tx.wait()
        console.log('Transaction hash of airdrop:', tx.hash)
    } catch(e) {
        console.error('Error: the transaction of airdrop failed')
        if (e.message) {
            console.error(e.message)
        }
        return 
    }

    if (typeof args.poll_id !== 'undefined') {
        const pollId = args.poll_id
        if (pollId < 0) {
            console.error('Error: the Poll ID should be a positive integer.')
            return 
        }
    
        if ((!contractAddrs["MACI"]) && !args.contract) {
            console.error('Error: MACI contract address is empty') 
            return 
        }
        const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]
        const maciContractAbi = parseArtifact('MACI')[0]
        const maciContract = new ethers.Contract(
            maciAddress,
            maciContractAbi,
            signer,
        )
    
        const pollAddr = await maciContract.getPoll(pollId)
        let MAXIMUM_ALLOWANCE = "10000000000000000000000000"
        try {
            tx = await ERC20Contract.approve(
                pollAddr,
                MAXIMUM_ALLOWANCE,
                { gasLimit: 1000000 }
            )
            await tx.wait()
            console.log('Transaction hash of approve:', tx.hash)
        } catch(e) {
            console.error('Error: the transaction failed')
            if (e.message) {
                console.error(e.message)
            }
            return 
        }
    }
    return 
}

export {
    airdrop,
    configureSubparser,
}
