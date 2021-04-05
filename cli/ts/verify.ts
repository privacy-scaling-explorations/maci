import * as fs from 'fs'

import {
    genTallyResultCommitment,
} from 'maci-core'

import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    calcQuinTreeDepthFromMaxLeaves,
    validateEthAddress,
    contractExists,
} from './utils'

import * as ethers from 'ethers'

const Web3 = require('web3')

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

    parser.addArgument(
        ['-q', '--ppt'],
        {
            required: true,
            type: 'string',
            help: 'The PollProcessorAndTallyer contract address',
        }
    )

}

const verify = async (args: any) => {
    const signer = await getDefaultSigner()

    if (!validateEthAddress(args.ppt)) {
        console.error('Error: invalid PollProcessorAndTallyer contract address')
        return 1
    }

    const [ pptContractAbi ] = parseArtifact('PollProcessorAndTallyer')

    const pptAddress = args.ppt
    if (! (await contractExists(signer.provider, pptAddress))) {
        console.error(`Error: there is no contract deployed at ${pptAddress}.`)
        return 1
    }

    const pptContract = new ethers.Contract(
        pptAddress,
        pptContractAbi,
        signer,
    )

    const onChainTallyCommitment = BigInt(await pptContract.tallyCommitment())
    console.log(onChainTallyCommitment.toString(16))

    // Read the tally file
    let contents
    try {
        contents = fs.readFileSync(args.tally_file, { encoding: 'utf8' })
    } catch {
        console.error('Error: unable to open ', args.tally_file)
        return
    }

    // Parse the tally file
    let data
    try {
        data = JSON.parse(contents)
    } catch {
        console.error('Error: unable to parse ', args.tally_file)
        return
    }

    console.log(data)
    // Check the results commitment
    const validResultsCommitment =
        data.newTallyCommitment &&
        data.newTallyCommitment.match(/0x[a-fA-F0-9]+/)

    if (!validResultsCommitment) {
        console.error('Error: invalid results commitment format')
        return
    }

    // Ensure that the lengths of data.results.tally and
    // data.perVOSpentVoiceCredits.tally are correct

    // Verify that the results commitment matches the output of
    // genTallyResultCommitment()

    // Verify the results

    // Compute newResultsCommitment
    // Compute newSpentVoiceCreditsCommitment
    // Compute newPerVOSpentVoiceCreditsCommitment
    // Compute newTallyCommitment
    //
    return 0
}

export {
    verify,
    configureSubparser,
}
