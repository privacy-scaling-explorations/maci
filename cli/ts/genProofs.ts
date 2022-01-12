import * as ethers from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

import { genProof, verifyProof, extractVk } from 'maci-circuits'
import { hashLeftRight, hash3 } from 'maci-crypto'
import { PrivKey, Keypair } from 'maci-domainobjs'
import { genTallyResultCommitment } from 'maci-core'

import {
    parseArtifact,
    getDefaultSigner,
    genMaciStateFromContract,
} from 'maci-contracts'

import {
    promptPwd,
    validateEthAddress,
    contractExists,
} from './utils'
import {readJSONFile} from 'maci-common'
import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'genProofs',
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
        ['-t', '--tally-file'],
        {
            required: true,
            type: 'string',
            help: 'A filepath in which to save the final vote tally and salt.',
        }
    )

    parser.addArgument(
        ['-r', '--rapidsnark'],
        {
            required: true,
            type: 'string',
            help: 'The path to the rapidsnark binary',
        }
    )

    parser.addArgument(
        ['-wp', '--process-witnessgen'],
        {
            required: true,
            type: 'string',
            help: 'The path to the ProcessMessages witness generation binary',
        }
    )

    parser.addArgument(
        ['-wt', '--tally-witnessgen'],
        {
            required: true,
            type: 'string',
            help: 'The path to the TallyVotes witness generation binary',
        }
    )

    parser.addArgument(
        ['-zp', '--process-zkey'],
        {
            required: true,
            type: 'string',
            help: 'The path to the ProcessMessages .zkey file',
        }
    )

    parser.addArgument(
        ['-zt', '--tally-zkey'],
        {
            required: true,
            type: 'string',
            help: 'The path to the TallyVotes .zkey file',
        }
    )

    parser.addArgument(
        ['-f', '--output'],
        {
            required: true,
            type: 'string',
            help: 'The output directory for proofs',
        }
    )

    parser.addArgument(
        ['-tx', '--transaction-hash'],
        {
            type: 'string',
            help: 'transaction hash of MACI contract creation',
        }
    )



    // TODO: support resumable proof generation
    //parser.addArgument(
        //['-r', '--resume'],
        //{
            //action: 'storeTrue',
            //help: 'Resume proof generation from the last proof in the specified output file',
        //}
    //)
}

const genProofs = async (args: any) => {
    const outputDir = args.output

    //if (fs.existsSync(outputDir)) {
    if (!fs.existsSync(outputDir)) {
        //console.error(`Error: ${outputDir} exists. Please specify a different directory to save proofs in.`)
        //return 1
    //} else {
        // Create the directory
        fs.mkdirSync(outputDir)
    }

    if (fs.existsSync(args.tally_file)) {
        console.error(`Error: ${args.tally_file} exists. Please specify a different filepath.`)
        return 1
    }

    // Check that args.witness_gen_exe exists
    const rapidsnarkExe = args.rapidsnark

    if (!fs.existsSync(rapidsnarkExe)) {
        console.error(`Error: ${rapidsnarkExe} does not exist.`)
        return 1
    }

    if (!fs.existsSync(args.process_witnessgen)) {
        console.error(`Error: ${args.process_witnessgen} does not exist.`)
        return 1
    }

    if (!fs.existsSync(args.tally_witnessgen)) {
        console.error(`Error: ${args.process_witnessgen} does not exist.`)
        return 1
    }

    if (!fs.existsSync(args.process_zkey)) {
        console.error(`Error: ${args.process_zkey} does not exist.`)
        return 1
    }

    if (!fs.existsSync(args.tally_zkey)) {
        console.error(`Error: ${args.tally_zkey} does not exist.`)
        return 1
    }

    // Extract the verifying keys
    const processVk = extractVk(args.process_zkey)
    const tallyVk = extractVk(args.tally_zkey)

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
        let txn = await signer.provider.getTransaction(txHash);
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

    // TODO: support resumable proof generation
    const processProofs: any[] = []
    const tallyProofs: any[] = []

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

        const circuitInputs = poll.processMessages(pollId)

        let r
        try {
            r = genProof(
                circuitInputs,
                rapidsnarkExe,
                args.process_witnessgen,
                args.process_zkey,
            )
        } catch (e) {
            console.error('Error: could not generate proof.')
            console.error(e)
            return 1
        }

        // Verify the proof
        const isValid = verifyProof(
            r.publicInputs,
            r.proof,
            processVk,
        )

        if (!isValid) {
            console.error('Error: generated an invalid proof')
            return 1
        }
        
        const thisProof = {
            circuitInputs,
            proof: r.proof,
            publicInputs: r.publicInputs,
        }

        processProofs.push(thisProof)

        saveOutput(outputDir, thisProof, `process_${poll.numBatchesProcessed - 1}.json`)

        console.log(`\nProgress: ${poll.numBatchesProcessed} / ${totalMessageBatches}`)
    }

    console.log('\nGenerating proofs of vote tallying...')
    const tallyBatchSize = poll.batchSizes.tallyBatchSize
    const numStateLeaves = poll.stateLeaves.length
    let totalTallyBatches = numStateLeaves <= tallyBatchSize ?
    1
    : 
    Math.floor(numStateLeaves / tallyBatchSize)
    if (
        numStateLeaves > tallyBatchSize &&
        numStateLeaves % tallyBatchSize > 0
    ) {
        totalTallyBatches ++
    }

    let tallyCircuitInputs
    while (poll.hasUntalliedBallots()) {
        tallyCircuitInputs = poll.tallyVotes()
        const r = genProof(
            tallyCircuitInputs,
            rapidsnarkExe,
            args.tally_witnessgen,
            args.tally_zkey,
        )

        // Verify the proof
        const isValid = verifyProof(
            r.publicInputs,
            r.proof,
            tallyVk,
        )

        if (!isValid) {
            console.error('Error: generated an invalid proof')
            return 1
        }
        
        const thisProof = {
            circuitInputs: tallyCircuitInputs,
            proof: r.proof,
            publicInputs: r.publicInputs,
        }

        tallyProofs.push(thisProof)

        saveOutput(outputDir, thisProof, `tally_${poll.numBatchesTallied - 1}.json`)

        console.log(`\nProgress: ${poll.numBatchesTallied} / ${totalTallyBatches}`)
    }

    const asHex = (val): string => {
        return '0x' + BigInt(val).toString(16)
    }

    const tallyFileData = {
        provider: signer.provider.connection.url,
        maci: args.contract,
        pollId,
        newTallyCommitment: asHex(tallyCircuitInputs.newTallyCommitment),
        results: {
            tally: poll.results.map((x) => x.toString()),
            salt: asHex(tallyCircuitInputs.newResultsRootSalt),
        },
        totalSpentVoiceCredits: {
            spent: poll.totalSpentVoiceCredits.toString(),
            salt: asHex(tallyCircuitInputs.newSpentVoiceCreditSubtotalSalt),
        },
        perVOSpentVoiceCredits: {
            tally: poll.perVOSpentVoiceCredits.map((x) => x.toString()),
            salt: asHex(tallyCircuitInputs.newPerVOSpentVoiceCreditsRootSalt),
        },
    }

    // Verify the results
    // Compute newResultsCommitment
    const newResultsCommitment = genTallyResultCommitment(
        tallyFileData.results.tally.map((x) => BigInt(x)),
        BigInt(tallyFileData.results.salt),
        poll.treeDepths.voteOptionTreeDepth,
    )
    // Compute newSpentVoiceCreditsCommitment
    const newSpentVoiceCreditsCommitment = hashLeftRight(
        BigInt(tallyFileData.totalSpentVoiceCredits.spent),
        BigInt(tallyFileData.totalSpentVoiceCredits.salt),
    )

    // Compute newPerVOSpentVoiceCreditsCommitment
    const newPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
        tallyFileData.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
        BigInt(tallyFileData.perVOSpentVoiceCredits.salt),
        poll.treeDepths.voteOptionTreeDepth,
    )

    // Compute newTallyCommitment
    const newTallyCommitment = hash3([
        newResultsCommitment,
        newSpentVoiceCreditsCommitment,
        newPerVOSpentVoiceCreditsCommitment
    ])

    fs.writeFileSync(args.tally_file, JSON.stringify(tallyFileData, null, 4))

    console.log()
    if ('0x' + newTallyCommitment.toString(16) === tallyFileData.newTallyCommitment) {
        console.log('OK')
    } else {
        console.error('Error: the newTallyCommitment is invalid.')
    }

    return 0
}

const saveOutput = (
    outputDir: string,
    proof: any,
    filename: string,
) => {
    fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(proof, null, 2),
    )
}

export {
    genProofs,
    configureSubparser,
}
