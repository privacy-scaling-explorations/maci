import * as fs from 'fs'

import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    genMerkleProof,
    calcQuinTreeDepthFromMaxLeaves,
    validateEthAddress,
    contractExists,
} from './utils'
import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'
import {genTallyResultCommitment} from 'maci-core'
import {hashLeftRight} from 'maci-crypto'

import * as ethers from 'ethers'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'verifyTallyResult',
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
        ['-v', '--vote-option-index'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The vote option index',
        }
    )

    parser.addArgument(
        ['-d', '--vote-option-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The vote option tree depth. '
        }
    )

}

const verifyTallyResult = async (args: any) => {
    const signer = await getDefaultSigner()

    const pollId = Number(args.poll_id)

    // check existence of MACI and ppt contract addresses
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty') 
        return 1
    }

    const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return 1
    }

    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')

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

    // Vote option index
    const voteOptionIndex = parseInt(args.vote_option_index)
    if (voteOptionIndex < 0) {
        console.error('Error: the vote option index should be 0 or greater')
        return 1
    }

    const voteOptionTreeDepth = parseInt(args.vote_option_tree_depth)
    if (voteOptionTreeDepth <= 0) {
        console.error('Error: the vote option tree depth should be greater than 0')
        return 1
    }


    // ----------------------------------------------
    // verify tally result
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

    const proof = genMerkleProof(voteOptionIndex, data.results.tally, voteOptionTreeDepth)
    const tallyResult = data.results.tally[voteOptionIndex]

    const spentVoiceCreditsHash = hashLeftRight(
        BigInt(data.totalSpentVoiceCredits.spent),
        BigInt(data.totalSpentVoiceCredits.salt)
    )

    const perVOSpentVoiceCreditsHash = genTallyResultCommitment(
        data.perVOSpentVoiceCredits.tally.map((x:string) => BigInt(x)),
        BigInt(data.perVOSpentVoiceCredits.salt),
        voteOptionTreeDepth
    )

    const tallyCommitment = data.newTallyCommitment

    const result = await pollContract.verifyTallyResult(
        voteOptionIndex,
        tallyResult,
        proof,
        spentVoiceCreditsHash,
        perVOSpentVoiceCreditsHash,
        tallyCommitment
    )

    if (!result) {
        console.error('verifyTallyResult returns FALSE')
        return 1
    }


    console.log('OK. finish verifyTallyResult')
    return 0
}

export {
    verifyTallyResult,
    configureSubparser,
}
