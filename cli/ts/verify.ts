import * as fs from 'fs'

import {
    genTallyResultCommitment,
} from 'maci-core'

import {
    maciContractAbi,
    genJsonRpcDeployer,
} from 'maci-contracts'

import {
    bigInt,
} from 'maci-crypto'

import {
    validateEthSk,
    validateEthAddress,
    contractExists,
    checkDeployerProviderConnection,
} from './utils'

import * as ethers from 'ethers'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'verify',
        { addHelp: true },
    )
    parser.addArgument(
        ['-t', '--tally-file'],
        {
            required: true,
            type: 'string',
            help: 'A filepath in which to save the final vote tally and salt.',
        }
    )
}

const verify = async (args: any) => {
    let contents
    try {
        contents = fs.readFileSync(args.tally_file, { encoding: 'utf8' })
    } catch {
        console.error('Error: unable to open ', args.tally_file)
        return
    }

    let data
    try {
        data = JSON.parse(contents)
    } catch {
        console.error('Error: unable to parse ', args.tally_file)
        return
    }

    const validSalt = data.salt && data.salt.match(/0x[a-fA-F0-9]+/)

    if (!validSalt) {
        console.error('Error: invalid salt')
        return
    }

    const validCommitment = data.commitment && data.commitment.match(/0x[a-fA-F0-9]+/)

    if (!validCommitment) {
        console.error('Error: invalid commitment format')
        return
    }

    // Ensure that the length of data.tally is a square root of 2
    const depth = Math.sqrt(data.tally.length)
    if (Math.floor(depth).toString() !== depth.toString()) {
        console.error('Error: invalid tally field length')
        return
    }

    // Verify that the commitment matches the output of genTallyResultCommitment()
    const tally = data.tally.map(bigInt)
    const salt = bigInt(data.salt)
    const commitment = bigInt(data.commitment)

    const expectedCommitment = genTallyResultCommitment(tally, salt, depth)
    if (expectedCommitment.toString() === commitment.toString()) {
        console.log('Valid off-chain commitment')
    } else {
        console.error('Error: the commitment does not match the tally and salt')
        return
    }

    const maciAddress = data.maci

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    // Ethereum provider
    const ethProvider = data.provider
    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    const onChainCommitment = bigInt((await maciContract.currentResultsCommitment()).toString())
    if (onChainCommitment.toString() === expectedCommitment.toString()) {
        console.log('Valid on-chain commitment')
    } else {
        console.error('Error: the commitment in the MACI contract does not match the expected commitment')
    }
}

export {
    verify,
    configureSubparser,
}
