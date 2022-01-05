import * as fs from 'fs'
import * as shelljs from 'shelljs'
import * as path from 'path'

import {
    contractExists,
} from './utils'

import {
    compareVks,
} from './setVerifyingKeys'

import {
    getDefaultSigner,
    parseArtifact,
} from 'maci-contracts'


import { extractVk } from 'maci-circuits'
import { VerifyingKey } from 'maci-domainobjs'

const { ethers } = require('hardhat')

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'checkVerifyingKey',
        { addHelp: true },
    )

    parser.addArgument(
        ['-x', '--contract'],
        {
            required: true,
            type: 'string',
            help: 'The MACI contract address',
        }
    )
}

const checkVerifyingKey = async (args: any) => {
    const maciAddress = args.contract

    const signer = await getDefaultSigner()
    if (!await contractExists(signer.provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const [ maciContractAbi ] = parseArtifact('MACI')
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )

    try {
        console.log('Retrieving verifying key registry...')
        const vkRegistryAddress = await maciContract.vkRegistry()
        const [ vkRegistryAbi ] = parseArtifact('VkRegistry')
        const vkRegistryContract = new ethers.Contract(
            vkRegistryAddress,
            vkRegistryAbi,
            signer,
        )

        //TODO: retreive keys from sigs or maci params && compareVks to zkey file
    } catch (e) {
        console.error('Error: transaction failed')
        console.error(e.message)
        return 1
    }



    return 0
}

export {
    checkVerifyingKey,
    configureSubparser,
}

