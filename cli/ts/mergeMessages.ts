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
        'mergeMessages',
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

const mergeMessages = async (args: any) => {
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
        console.error(
            'Error: there is no MACI contract deployed at the ' +
            'specified address',
        )
        return 1
    }

    const pollId = Number(args.poll_id)

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
        console.error(
            'Error: there is no Poll contract with this poll ID linked to ' +
            'the specified MACI contract.',
        )
        return 1
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    const extContracts = await pollContract.extContracts()
    const messageAqContractAddr = extContracts.messageAq

    const accQueueContract = new ethers.Contract(
        messageAqContractAddr,
        accQueueContractAbi,
        signer,
    )

    // Check if the signer is the Poll owner
    const pollOwner = await pollContract.owner()
    if (pollOwner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error(
            'Error: the signer is not the owner of this Poll contract ' +
            pollAddr,
        )
        return 1
    }

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
            console.log('All message subtrees have been merged.')
            break
        }
        const indices = (
            await accQueueContract.getSrIndices()
        ).map((x) => Number(x))

        console.log(
            `Merging message subroots ${indices[0] + 1} / ${indices[1] + 1}`,
        )

        const tx = await pollContract.mergeMessageAqSubRoots(
            args.num_queue_ops.toString(),
        )
        const receipt = await tx.wait()

        console.log(
            `Executed mergeMaciStateAqSubRoots(); ` +
            `gas used: ${receipt.gasUsed.toString()}`)
        console.log(`Transaction hash: ${receipt.transactionHash}\n`)
    }
    
    // Check if the message AQ has been fully merged
    const messageTreeDepth = Number(
        (await pollContract.treeDepths()).messageTreeDepth
    )

    const mainRoot = (await accQueueContract.getMainRoot(messageTreeDepth.toString())).toString()
    if (mainRoot === '0') {
        console.log('Merging subroots to a main message root...')
        const tx = await pollContract.mergeMessageAq()
        const receipt = await tx.wait()
        console.log(
            `Executed mergeMessageAq(); ` +
            `gas used: ${receipt.gasUsed.toString()}`,
        )
        console.log(`Transaction hash: ${receipt.transactionHash}`)
        console.log('The message tree has been merged.')
    } else {
        console.log('The message tree has already been merged.')
    }

    // TODO: intelligently set num_queue_ops
    //const numLeaves = Number(await accQueueContract.numLeaves())

    //const treeDepths = await pollContract.treeDepths()
    //const messageTreeDepth = Number(treeDepths.messageTreeDepth)
    //const messageAqSubDepth = Number(treeDepths.messageTreeSubDepth)

    //const d = messageTreeDepth - messageAqSubDepth

    //const numSubTrees = Math.floor(numLeaves / (5 ** messageAqSubDepth)) + 1

    //const totalEstGas = numSubTrees * (d * 123105)

    //const numOps = Math.floor(totalEstGas / 5000000)

    //if (numOps === 0) {
        //// Attempt once
    //} else {
        //while (true) {
        //}
    //}
    //console.log(numLeaves, messageAqSubDepth, numOps)

    return 0
}

export {
    mergeMessages,
    configureSubparser,
}
