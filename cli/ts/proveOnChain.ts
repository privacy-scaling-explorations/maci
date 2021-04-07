import * as ethers from 'ethers'
import * as fs from 'fs'

import { hashLeftRight, hash3 } from 'maci-crypto'
import {
    formatProofForVerifierContract,
    getDefaultSigner,
    parseArtifact,
} from 'maci-contracts'

import {
    genBatchUstProofAndPublicSignals,
    verifyBatchUstProof,
    getSignalByNameViaSym,
} from 'maci-circuits'

import {
    PubKey,
    PrivKey,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    validateEthAddress,
    contractExists,
    delay,
} from './utils'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'proveOnChain',
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
            required: true,
            type: 'string',
            help: 'The PollProcessorAndTallyer contract address',
        }
    )

    parser.addArgument(
        ['-f', '--proof-file'],
        {
            required: true,
            type: 'string',
            help: 'The proof output file from the genProofs subcommand',
        }
    )
}

const proveOnChain = async (args: any) => {
    const signer = await getDefaultSigner()

    // PollProcessorAndTallyer contract
    if (!validateEthAddress(args.ppt)) {
        console.error('Error: invalid PollProcessorAndTallyer contract address')
        return
    }

    const pptAddress = args.ppt

    if (! (await contractExists(signer.provider, pptAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')
    const [ pptContractAbi ] = parseArtifact('PollProcessorAndTallyer')
    const [ messageAqContractAbi ] = parseArtifact('AccQueue')
    const [ vkRegistryContractAbi ] = parseArtifact('VkRegistry')
    const [ verifierContractAbi ] = parseArtifact('Verifier')

    const maciAddress = args.contract
    const pollId = Number(args.poll_id)

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

    const messageAqContract = new ethers.Contract(
        (await pollContract.extContracts()).messageAq,
        messageAqContractAbi,
        signer,
    )

    const vkRegistryContract = new ethers.Contract(
        (await pollContract.extContracts()).vkRegistry,
        vkRegistryContractAbi,
        signer,
    )

    const verifierContractAddress = await pptContract.verifier()
    const verifierContract = new ethers.Contract(
        verifierContractAddress,
        verifierContractAbi,
        signer,
    )

    // Read the proof file
    let data
    if (typeof args.proof_file === 'object' && args.proof_file !== null) {
        // Argument is a javascript object
        data = args.proof_file
    } else {
        // Argument is a filename
        try {
            data = JSON.parse(fs.readFileSync(args.proof_file).toString())
            if (data.processProofs == undefined || data.tallyProofs == undefined) {
                throw new Error()
            }
        } catch {
            console.error('Error: could not parse the proof file')
            return
        }
    }

    const { processProofs, tallyProofs } = data

    const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages()
    const numSignUps = Number(numSignUpsAndMessages[0])
    const numMessages = Number(numSignUpsAndMessages[1])
    const batchSizes = await pollContract.batchSizes()
    const messageBatchSize = Number(batchSizes.messageBatchSize)
    let totalMessageBatches = numMessages <= messageBatchSize ?
    1
    : 
    Math.floor(numMessages / messageBatchSize)

    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
        totalMessageBatches ++
    }

    if (processProofs.length !== totalMessageBatches) {
        console.error(
            `Error: ${args.proof_file} does not have the correct ` +
            `number of message processing proofs ` +
            `(expected ${totalMessageBatches}, got ${processProofs.length}.`,
        )
    }

    const treeDepths = await pollContract.treeDepths()

    let numBatchesProcessed = Number(await pptContract.numBatchesProcessed())
    const messageRootOnChain = await messageAqContract.getMainRoot(
        Number(treeDepths.messageTreeDepth),
    )

    const onChainProcessVk = await vkRegistryContract.getProcessVk(
        10,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
    )


    const dd = await pollContract.getDeployTimeAndDuration()
    const pollEndTimestampOnChain = BigInt(dd[0]) + BigInt(dd[1])

    const txErr = 'Error: processMessages() failed'
    if (numBatchesProcessed < totalMessageBatches) {
        console.log('Submitting proofs of message processing...')
    }
    for (let i = numBatchesProcessed; i < totalMessageBatches; i ++) {
        const { proof, circuitInputs, publicInputs } = data.processProofs[i]

        if (circuitInputs.pollEndTimestamp !== pollEndTimestampOnChain.toString()) {
            console.error('Error: pollEndTimestamp mismatch.')
            return 1
        }

        if (BigInt(circuitInputs.msgRoot).toString() !== messageRootOnChain.toString()) {
            console.error('Error: message root mismatch.')
            return 1
        }

        const ct = await pollContract.currentSbAndTallyCommitments()
        const currentSbCommitmentOnChain = BigInt(ct[0])

        if (currentSbCommitmentOnChain.toString() !== circuitInputs.currentSbCommitment) {
            console.error('Error: currentSbCommitment mismatch.')
            return 1
        }

        const coordPubKeyHashOnChain = BigInt(await pollContract.coordinatorPubKeyHash())
        if (
            hashLeftRight(
                BigInt(circuitInputs.coordPubKey[0]),
                BigInt(circuitInputs.coordPubKey[1]),
            ).toString() !== coordPubKeyHashOnChain.toString()
        ) {
            console.error('Error: coordPubKey mismatch.')
            return 1
        }

        const packedValsOnChain = BigInt(await pptContract.genProcessMessagesPackedVals(
            pollContract.address,
            numSignUps,
        ))

        if (circuitInputs.packedVals !== packedValsOnChain.toString()) {
            console.error('Error: packedVals mismatch.')
            return 1
        }

        const formattedProof = formatProofForVerifierContract(proof)

        const publicInputHashOnChain = BigInt(await pptContract.genProcessMessagesPublicInputHash(
            pollContract.address,
            messageRootOnChain.toString(),
            numSignUps,
            circuitInputs.currentSbCommitment,
            circuitInputs.newSbCommitment,
        ))

        if (publicInputHashOnChain.toString() !== publicInputs[0].toString()) {
            console.error('Public input mismatch')
            return 1
        }

        const isValidOnChain = await verifierContract.verify(
            formattedProof,
            onChainProcessVk,
            publicInputHashOnChain.toString(),
        )

        if (!isValidOnChain) {
            console.error('Error: the verifier contract found the proof invalid.')
            return 1
        }

        let tx
        try {
            tx = await pptContract.processMessages(
                pollContract.address,
                '0x' + BigInt(circuitInputs.newSbCommitment).toString(16),
                formattedProof,
            )
        } catch (e) {
            console.error(txErr)
            console.error(e)
        }

        const receipt = await tx.wait()

        if (receipt.status !== 1) {
            console.error(txErr)
            return 1
        }

        console.log(`Transaction hash: ${tx.hash}`)

        // Wait for the node to catch up
        numBatchesProcessed = Number(await pptContract.numBatchesProcessed())
        let backOff = 1000
        let numAttempts = 0
        while (numBatchesProcessed !== i + 1) {
            await delay(backOff)
            backOff *= 1.2
            numAttempts ++
            if (numAttempts >= 100) {
                break
            }
        }
        console.log(`Progress: ${numBatchesProcessed} / ${totalMessageBatches}`)
    }

    return 0


    //// ------------------------------------------------------------------------
    //// Vote tallying proofs
    //console.log('Submitting proofs of vote tallying...')

    //// Get the maximum tally batch index
    //const maxTallyBatchIndex = (1 + numSignUps) % tallyBatchSize === 0 ?
        //(1 + numSignUps) / tallyBatchSize
        //:
        //1 + Math.floor((1 + numSignUps) / tallyBatchSize)

    //// Get the number of processed message batches
    //const currentQvtBatchNum = Number(await maciContract.currentQvtBatchNum())

    //for (let i = currentQvtBatchNum; i < maxTallyBatchIndex; i ++) {
        //console.log(`\nProgress: ${i+1}/${maxTallyBatchIndex}`)
        //const p = data.tallyProofs[i]
        //const proof = p.proof
        //const circuitInputs = p.circuitInputs
        //const newResultsCommitment = p.newResultsCommitment
        //const newSpentVoiceCreditsCommitment = p.newSpentVoiceCreditsCommitment
        //const newPerVOSpentVoiceCreditsCommitment = p.newPerVOSpentVoiceCreditsCommitment
        //const totalVotes = p.totalVotes
        //const totalVotesPublicInput = BigInt(circuitInputs.isLastBatch) === BigInt(1) ? totalVotes.toString() : 0

        //let tx
        //const txErr = 'Error: proveVoteTallyBatch() failed'

        //const formattedProof = formatProofForVerifierContract(proof)
        //try {
            //tx = await maciContract.proveVoteTallyBatch(
                //circuitInputs.intermediateStateRoot.toString(),
                //newResultsCommitment.toString(),
                //newSpentVoiceCreditsCommitment.toString(),
                //newPerVOSpentVoiceCreditsCommitment.toString(),
                //totalVotesPublicInput.toString(),
                //formattedProof,
                //{ gasLimit: 2000000 },
            //)
        //} catch (e) {
            //console.error('Error: proveVoteTallyBatch() failed')
            //console.error(txErr)
            //console.error(e)
            //break
        //}

        //const receipt = await tx.wait()

        //if (receipt.status !== 1) {
            //console.error(txErr)
            //break
        //}
        //console.log(`Transaction hash: ${tx.hash}`)
    //}
    //console.log('OK')
}

export {
    proveOnChain,
    configureSubparser,
}
