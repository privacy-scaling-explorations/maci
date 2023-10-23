import * as fs from 'fs'

import { genTallyResultCommitment } from 'maci-core'
import { hash2, hash3 } from 'maci-crypto'

import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    validateEthAddress,
    contractExists,
} from './utils'
import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'

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

    parser.addArgument(
        ['-sf', '--subsidy-file'],
        {
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
        ['-tc', '--tally-contract'],
        {
            type: 'string',
            help: 'The Tally contract address',
        }
    )

    parser.addArgument(
        ['-sc', '--subsidy-contract'],
        {
            type: 'string',
            help: 'The Subsidy contract address',
        }
    )
}


const verify = async (args: any) => {
    const signer = await getDefaultSigner()

    const pollId = Number(args.poll_id)

    // check existence of MACI, Tally and Subsidy contract addresses
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty') 
        return 1
    }
    if ((!contractAddrs||!contractAddrs["Tally-"+pollId]) && !args.tally_contract) {
        console.error('Error: Tally contract address is empty') 
        return 1
    }
    if ((!contractAddrs||!contractAddrs["Subsidy-"+pollId]) && !args.subsidy_contract) {
        console.error('Error: Subsidy contract address is empty') 
        return 1
    }

    const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]
    const tallyAddress = args.tally_contract? args.tally_contract: contractAddrs["Tally-"+pollId]
    const subsidyAddress = args.subsidy_contract? args.subsidy_contract: contractAddrs["Subsidy-"+pollId]

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return 1
    }

    // Tally contract
    if (!validateEthAddress(tallyAddress)) {
        console.error('Error: invalid Tally contract address')
        return 1
    }

    // Subsidy contract
    if (!validateEthAddress(subsidyAddress)) {
        console.error('Error: invalid Subsidy contract address')
        return 1
    }
    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')
    const [ tallyContractAbi ] = parseArtifact('Tally')
    const [ subsidyContractAbi ] = parseArtifact('Subsidy')

    if (! (await contractExists(signer.provider, tallyAddress))) {
        console.error(`Error: there is no contract deployed at ${tallyAddress}.`)
        return 1
    }
    if (!(await contractExists(signer.provider, subsidyAddress))) {
        console.error(`Error: there is no contract deployed at ${subsidyAddress}.`)
        return 1
    }

	const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )

    const pollAddr = await maciContract.polls(pollId)
    if (!(await contractExists(signer.provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    const tallyContract = new ethers.Contract(
        tallyAddress,
        tallyContractAbi,
        signer,
    )

    const subsidyContract = new ethers.Contract(
        subsidyAddress,
        subsidyContractAbi,
        signer,
    )

       // ----------------------------------------------
    // verify tally result
    const onChainTallyCommitment = BigInt(await tallyContract.tallyCommitment())
    console.log(onChainTallyCommitment.toString(16))

    // Read the tally file
    let contents
    try {
        contents = fs.readFileSync(args.tally_file, { encoding: 'utf8' })
    } catch {
        console.error('Error: unable to open ', args.tally_file)
        return 1
    }

    // Parse the tally file
    let data
    try {
        data = JSON.parse(contents)
    } catch {
        console.error('Error: unable to parse ', args.tally_file)
        return 1
    }

    console.log('-------------tally data -------------------')
    console.log(data)
    // Check the results commitment
    let validResultsCommitment =
        data.newTallyCommitment &&
        data.newTallyCommitment.match(/0x[a-fA-F0-9]+/)

    if (!validResultsCommitment) {
        console.error('Error: invalid results commitment format')
        return 1
    }

    const treeDepths = await pollContract.treeDepths()
    const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth)
    const numVoteOptions = 5 ** voteOptionTreeDepth
    const wrongNumVoteOptions = 'Error: wrong number of vote options.'
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

    // ----------------------------------------------
    // verify subsidy result

    if (args.subsidy_file) {
        const onChainSubsidyCommitment = BigInt(await subsidyContract.subsidyCommitment())
        console.log(onChainSubsidyCommitment.toString(16))
        // Read the subsidy file
        try {
            contents = fs.readFileSync(args.subsidy_file, { encoding: 'utf8' })
        } catch {
            console.error('Error: unable to open ', args.subsidy_file)
            return 0
        }
       // Parse the file
        try {
            data = JSON.parse(contents)
        } catch {
            console.error('Error: unable to parse ', args.subsidy_file)
            return 0
        }
        console.log('-------------subsidy data -------------------')
        console.log(data)
    
        validResultsCommitment =
            data.newSubsidyCommitment &&
            data.newSubsidyCommitment.match(/0x[a-fA-F0-9]+/)
    
        if (!validResultsCommitment) {
            console.error('Error: invalid results commitment format')
            return 1
        }
    
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
    }

    console.log('OK. finish verify')

    return 0
}

export {
    verify,
    configureSubparser,
}
