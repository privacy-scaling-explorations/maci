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
        'fundWallet',
        { addHelp: true },
    )

    parser.addArgument(
        ['-w', '--address'],
        {
            required: true,
            type: 'string',
            help: 'The wallet address',
        }
    )

    parser.addArgument(
        ['-a', '--amount'],
        {
            required: true,
            type: 'string',
            help: 'The amount to fund in wei'
        }
    )
}

const fundWallet = async (args: any) => {
    const signer = await getDefaultSigner()

    const value = ethers.BigNumber.from(args.amount)
    const to = args.address
    try {
	const tx = await signer.sendTransaction({ to, value })
	console.log('tx hash: ', tx.hash)
	await tx.wait()
    } catch (e) {
        console.error(e)
        return 
    }

    return 
}

export {
    fundWallet,
    configureSubparser,
}
