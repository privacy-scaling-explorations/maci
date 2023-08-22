import * as ethers from 'ethers'
import * as fs from 'fs'

// import { genProof, verifyProof, extractVk } from 'maci-circuits'
// import { hashLeftRight, hash3 } from 'maci-crypto'
import { PrivKey, Keypair, VerifyingKey } from 'maci-domainobjs'
// import { genTallyResultCommitment } from 'maci-core'

import {
    parseArtifact,
    getDefaultSigner,
    genMaciStateFromContract,
} from 'maci-contracts'

import {
    promptPwd,
    validateEthAddress,
    contractExists,
    isPathExist,
    saveOutput,
} from './utils'
import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'genCircuitInputs',
        { addHelp: true },
    )

    const maciPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    maciPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized MACI private key',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-sk', '--privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your serialized MACI private key',
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
        ['-f', '--output'],
        {
            required: true,
            type: 'string',
            help: 'The output directory for circuitInputs',
        }
    )

    parser.addArgument(
        ['-tx', '--transaction-hash'],
        {
            type: 'string',
            help: 'transaction hash of MACI contract creation',
        }
    )
}

const genCircuitInputs = async (args: any) => {
    const outputDir = args.output

    if (!fs.existsSync(outputDir)) {
        // Create the directory
        fs.mkdirSync(outputDir)
    }

    // The coordinator's MACI private key
    let serializedPrivkey
    if (args.prompt_for_maci_privkey) {
        serializedPrivkey = await promptPwd('Your MACI private key')
    } else {
        serializedPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedPrivkey)) {
        console.error('Error: invalid MACI private key')
        return 1
    }

    const maciPrivkey = PrivKey.unserialize(serializedPrivkey)
    const coordinatorKeypair = new Keypair(maciPrivkey)

    const contractAddrs = readJSONFile(contractFilepath)
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
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    const extContracts = await pollContract.extContracts()
    const messageAqContractAddr = extContracts.messageAq

    const messageAqContract = new ethers.Contract(
        messageAqContractAddr,
        accQueueContractAbi,
        signer,
    )


    // Check that the state and message trees have been merged for at least the first poll
    if (!(await pollContract.stateAqMerged()) && pollId == 0) {
        console.error(
            'Error: the state tree has not been merged yet. ' +
            'Please use the mergeSignups subcommmand to do so.'
        )
        return 1
    }

    const messageTreeDepth = Number(
        (await pollContract.treeDepths()).messageTreeDepth
    )

    const mainRoot = (await messageAqContract.getMainRoot(messageTreeDepth.toString())).toString()

    if (mainRoot === '0') {
        console.error(
            'Error: the message tree has not been merged yet. ' +
            'Please use the mergeMessages subcommmand to do so.'
        )
        return 1
    }

    // Build an off-chain representation of the MACI contract using data in the contract storage

    // some rpc endpoint like bsc chain has limitation to retreive history logs
    let fromBlock = 0
    const txHash = args.transaction_hash
    if (txHash) {
        const txn = await signer.provider.getTransaction(txHash);
        fromBlock = txn.blockNumber
    }
    console.log(`fromBlock = ${fromBlock}`)
    const maciState = await genMaciStateFromContract(
        signer.provider,
        maciAddress,
        coordinatorKeypair,
        pollId,
        fromBlock,
    )

    const poll = maciState.polls[pollId]

    const circuitInputs: any[] = []

    let startTime = Date.now()
    console.log('Generating proofs of message processing...')
    const messageBatchSize = poll.batchSizes.messageBatchSize
    const numMessages = poll.messages.length
    let totalMessageBatches = numMessages <= messageBatchSize ?
    1
    : 
    Math.floor(numMessages / messageBatchSize)

    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
        totalMessageBatches ++
    }

    while (poll.hasUnprocessedMessages()) {

        const thisCircuitInputs = poll.processMessages(pollId)

        circuitInputs.push(thisCircuitInputs)

        saveOutput(outputDir, thisCircuitInputs, `input_${poll.numBatchesProcessed - 1}.json`)

        console.log(`\nProgress: ${poll.numBatchesProcessed} / ${totalMessageBatches}`)
    }

    let endTime = Date.now() 
    console.log(`----------gen circuitInputs took ${(endTime - startTime)/1000} seconds`)
    return 0
}

export {
    genCircuitInputs,
    configureSubparser,
}
