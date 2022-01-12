import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    validateEthAddress,
    contractExists,
    currentBlockTimestamp,
} from './utils'
import {readJSONFile} from 'maci-common'

import * as ethers from 'ethers'

import {
    DEFAULT_SR_QUEUE_OPS,
} from './defaults'

import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'mergeSignups',
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
        ['-o', '--poll-id'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The Poll ID',
        }
    )

    parser.addArgument(
        ['-n', '--num-queue-ops'],
        {
            action: 'store',
            type: 'int',
            defaultValue: DEFAULT_SR_QUEUE_OPS,
            help: 'The number of subroot queue operations per transaction',
        }
    )
}

const mergeSignups = async (args: any) => {
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
    
    const signer = await getDefaultSigner()

    if (! (await contractExists(signer.provider, maciAddress))) {
        console.error('Error: there is no MACI contract deployed at the specified address')
        return 1
    }

    const pollId = args.poll_id

    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')
    const [ accQueueContractAbi ] = parseArtifact('AccQueue')

	const maciContractEthers = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )

    const pollAddr = await maciContractEthers.polls(pollId)
    if (! (await contractExists(signer.provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    const accQueueContract = new ethers.Contract(
        await maciContractEthers.stateAq(),
        accQueueContractAbi,
        signer,
    )

    // Check if the voting period is over

    const dd = await pollContract.getDeployTimeAndDuration()
    const deadline = Number(dd[0]) + Number(dd[1])

    const now = await currentBlockTimestamp(signer.provider)

    if (now < deadline) {
        console.error(
            'Error: the voting period is not over. ' +
            'Please wait till ' + new Date(deadline * 1000),
        )
        return 1
    }

    while (true) {
        const subTreesMerged = await accQueueContract.subTreesMerged()
        if (subTreesMerged) {
            console.log('All state subtrees have been merged.')
            break
        }

        const indices = (
            await accQueueContract.getSrIndices()
        ).map((x) => Number(x))

        console.log(
            `Merging state subroots ${indices[0] + 1} / ${indices[1] + 1}`,
        )

        const tx = await pollContract.mergeMaciStateAqSubRoots(
            args.num_queue_ops.toString(),
            pollId.toString(),
        )
        const receipt = await tx.wait()

        console.log(
            `Executed mergeMaciStateAqSubRoots(); ` +
            `gas used: ${receipt.gasUsed.toString()}`)
        console.log(`Transaction hash: ${receipt.transactionHash}\n`)
    }

    // Check if the state AQ has been fully merged
    const stateTreeDepth = Number(await maciContractEthers.stateTreeDepth())
    const mainRoot = (await accQueueContract.getMainRoot(stateTreeDepth.toString())).toString()

    if (mainRoot === '0' || pollId > 0) {
        console.log('Merging subroots to a main state root...')
        const tx = await pollContract.mergeMaciStateAq(pollId.toString())
        const receipt = await tx.wait()
        console.log(
            `Executed mergeStateAq(); ` +
            `gas used: ${receipt.gasUsed.toString()}`,
        )
        console.log(`Transaction hash: ${receipt.transactionHash}`)
        console.log('The state tree has been merged.')

    } else {
        console.log('The state tree has already been merged.')
    }
    
    // TODO: intelligently set num_queue_ops

    return 0
}

export {
    mergeSignups,
    configureSubparser,
}
