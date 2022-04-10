import * as fs from 'fs'

import { genTallyResultCommitment } from 'maci-core'
import { hash2, hash3 } from 'maci-crypto'

import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    calcQuinTreeDepthFromMaxLeaves,
    validateEthAddress,
    contractExists,
} from './utils'
import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'

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
        ['-sf', '--subsidy-file'],
        {
            required: true,
            type: 'string',
            help: 'A filepath in which to save the final tally result and salt.',
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
            action: 'store',
            required: true,
            type: 'string',
            help: 'The Poll ID',
        }
    )

    parser.addArgument(
        ['-q', '--ppt'],
        {
            type: 'string',
            help: 'The PollProcessorAndTallyer contract address',
        }
    )
}

const verify = async (args: any) => {
    const signer = await getDefaultSigner()

    const pollId = Number(args.poll_id)

    // check existence of MACI and ppt contract addresses
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty') 
        return 1
    }
    if ((!contractAddrs||!contractAddrs["PollProcessorAndTally-"+pollId]) && !args.ppt) {
        console.error('Error: PollProcessorAndTally contract address is empty') 
        return 1
    }

    const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]
    const pptAddress = args.ppt ? args.ppt: contractAddrs["PollProcessorAndTally-"+pollId]

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return 0
    }

    // PollProcessorAndTallyer contract
    if (!validateEthAddress(pptAddress)) {
        console.error('Error: invalid PollProcessorAndTallyer contract address')
        return 0
    }

    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')
    const [ pptContractAbi ] = parseArtifact('PollProcessorAndTallyer')

    if (! (await contractExists(signer.provider, pptAddress))) {
        console.error(`Error: there is no contract deployed at ${pptAddress}.`)
        return 1
    }

	const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )

    const pollAddr = await maciContract.polls(pollId)
    if (! (await contractExists(signer.provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    const pptContract = new ethers.Contract(
        pptAddress,
        pptContractAbi,
        signer,
    )

    // ----------------------------------------------
    // verify subsidy result

    const onChainSubsidyCommitment = BigInt(await pptContract.subsidyCommitment())
    console.log(onChainSubsidyCommitment.toString(16))
    // Read the subsidy file
    let contents
    try {
        contents = fs.readFileSync(args.subsidy_file, { encoding: 'utf8' })
    } catch {
        console.error('Error: unable to open ', args.subsidy_file)
        return 0
    }
   // Parse the file
    let data
    try {
        data = JSON.parse(contents)
    } catch {
        console.error('Error: unable to parse ', args.subsidy_file)
        return 0
    }
    console.log('-------------subsidy data -------------------')
    console.log(data)

    let validResultsCommitment =
        data.newSubsidyCommitment &&
        data.newSubsidyCommitment.match(/0x[a-fA-F0-9]+/)

    if (!validResultsCommitment) {
        console.error('Error: invalid results commitment format')
        return 0
    }

    const treeDepths = await pollContract.treeDepths()
    const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth)
    const numVoteOptions = 5 ** voteOptionTreeDepth
    const wrongNumVoteOptions = 'Error: wrong number of vote options.'
    if (data.results.subsidy.length !== numVoteOptions) {
        console.error(wrongNumVoteOptions)
        return 1
    }

    // to compute newSubsidyCommitment, we can use genTallyResultCommitment
    const newSubsidyCommitment = genTallyResultCommitment(
        data.results.subsidy.map((x) => BigInt(x)),
        data.results.salt,
        voteOptionTreeDepth
    )

    if (onChainSubsidyCommitment !== newSubsidyCommitment) {
        console.log('Error: the on-chain subsidy commitment does not match.')
        return 1
    }




    // ----------------------------------------------
    // verify tally result
    const onChainTallyCommitment = BigInt(await pptContract.tallyCommitment())
    console.log(onChainTallyCommitment.toString(16))

    // Read the tally file
    try {
        contents = fs.readFileSync(args.tally_file, { encoding: 'utf8' })
    } catch {
        console.error('Error: unable to open ', args.tally_file)
        return 0
    }

    // Parse the tally file
    try {
        data = JSON.parse(contents)
    } catch {
        console.error('Error: unable to parse ', args.tally_file)
        return 0
    }

    console.log('-------------tally data -------------------')
    console.log(data)
    // Check the results commitment
    validResultsCommitment =
        data.newTallyCommitment &&
        data.newTallyCommitment.match(/0x[a-fA-F0-9]+/)

    if (!validResultsCommitment) {
        console.error('Error: invalid results commitment format')
        return 0
    }

    // Ensure that the lengths of data.results.tally and
    // data.perVOSpentVoiceCredits.tally are correct
    // Get vote option tree depth
    if (data.results.tally.length !== numVoteOptions) {
        console.error(wrongNumVoteOptions)
        return 1
    }

    if (data.perVOSpentVoiceCredits.tally.length !== numVoteOptions) {
        console.error(wrongNumVoteOptions)
        return 1
    }

    // Verify that the results commitment matches the output of
    // genTallyResultCommitment()

    // Verify the results

    // Compute newResultsCommitment
    const newResultsCommitment = genTallyResultCommitment(
        data.results.tally.map((x) => BigInt(x)),
        data.results.salt,
        voteOptionTreeDepth
    )

    // Compute newSpentVoiceCreditsCommitment
    const newSpentVoiceCreditsCommitment = hash2([
        BigInt(data.totalSpentVoiceCredits.spent),
        BigInt(data.totalSpentVoiceCredits.salt),
    ])

    // Compute newPerVOSpentVoiceCreditsCommitment
    const newPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
        data.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
        data.perVOSpentVoiceCredits.salt,
        voteOptionTreeDepth
    )

    // Compute newTallyCommitment
    const newTallyCommitment = hash3([
        newResultsCommitment,
        newSpentVoiceCreditsCommitment,
        newPerVOSpentVoiceCreditsCommitment,
    ])

    if (onChainTallyCommitment !== newTallyCommitment) {
        console.log('Error: the on-chain tally commitment does not match.')
        return 1
    }

    console.log('OK. finish verify')

    return 0
}

export {
    verify,
    configureSubparser,
}
