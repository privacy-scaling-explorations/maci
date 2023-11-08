import { existsSync, mkdirSync, writeFileSync } from "fs"
import { GenProofsArgs, asHex, banner, contractExists, doesPathExist, info, logError, logGreen, logYellow, promptPwd, readContractAddress, success } from "../utils/"
import { Keypair, PrivKey, VerifyingKey } from "maci-domainobjs"
import { extractVk, genProof, verifyProof } from "maci-circuits"
import { genMaciStateFromContract, getDefaultSigner, parseArtifact } from "maci-contracts"
import { Contract } from "ethers"
import { hash3, hashLeftRight, genTreeCommitment } from "maci-crypto"
import { join } from "path"

export const genProofs = async ({
    outputDir,
    tallyFile,
    quiet,
    rapidsnark,
    processWitgen,
    tallyWitgen,
    processZkey,
    processWasm,
    tallyZkey,
    tallyWasm,
    subsidyFile,
    subsidyWasm,
    subsidyZkey,
    subsidyWitgen,
    coordinatorPrivKey,
    maciAddress,
    pollId,
    transactionHash
}: GenProofsArgs) => {
    if(!quiet) banner()

    if (!existsSync(outputDir)) {
        // Create the directory
        mkdirSync(outputDir)
    }

    // differentiate whether we are using wasm or rapidsnark
    // so if we pass rapidsnark we assume we don't want to use wasm
    if (rapidsnark) {   
        const processDatFile = processWitgen + ".dat"
        const tallyDatFile =  tallyWitgen + ".dat"
        const [ok, path] = doesPathExist([
            rapidsnark, 
            processWitgen, 
            tallyWitgen, 
            processDatFile,
            tallyDatFile
        ])
        if (!ok) logError(`Could not find ${path}.`)
    } else {
        // if no rapidsnark then we assume we go with wasm
        // so we expect those arguments
        if (!processWasm) logError('Please specify the process wasm file location')
        if (!tallyWasm) logError('Please specify the tally wasm file location')
        const [ok, path] = doesPathExist([
            processWasm, 
            tallyWasm
        ])
        if (!ok) logError(`Could not find ${path}.`)
    }

    // check if zkeys were provided
    const [ok, path] = doesPathExist([
        processZkey, 
        tallyZkey
    ])
    if (!ok) logError(`Could not find ${path}.`)


    // the vk for the subsidy contract (optional)
    let subsidyVk: VerifyingKey
    if (subsidyFile) {
        if (existsSync(subsidyFile)) logError(`${subsidyFile} exists. Please specify a different filepath.`)
        if (!subsidyZkey) logError('Please specify the subsidy zkey file location')
        if (!subsidyWitgen) logError('Please specify the subsidy witnessgen file location')
        
        if (rapidsnark) {
            if (!subsidyWitgen) logError('Please specify the subsidy witnessgen file location')
            const subsidyDatFile = subsidyWitgen + ".dat"
            const [ok, path] = doesPathExist([
                subsidyWitgen,
                subsidyDatFile
            ])
        } else {
            // we expect to have the wasm file
            if (!subsidyWasm) logError('Please specify the subsidy wasm file location')
            const [ok, path] = doesPathExist([
                subsidyWasm
            ])
            if (!ok) logError(`Could not find ${path}.`)
        }

        // either way we check the subsidy zkey
        const [ok, path] = doesPathExist([
            subsidyZkey
        ])
        if (!ok) logError(`Could not find ${path}.`)

        subsidyVk = await extractVk(subsidyZkey)
    }

    // extract the rest of the verifying keys
    const processVk = extractVk(processZkey)
    const tallyVk = extractVk(tallyZkey)

    // the coordinator's MACI private key
    const privateKey = coordinatorPrivKey ? coordinatorPrivKey : await promptPwd('Insert your MACI private key')

    if (!PrivKey.isValidSerializedPrivKey(privateKey)) logError('Invalid MACI private key')
    const maciPrivKey = PrivKey.deserialize(privateKey)
    const coordinatorKeypair = new Keypair(maciPrivKey)

    const signer = await getDefaultSigner()
    // contracts
    if (!readContractAddress("MACI") && !maciAddress) logError('MACI contract address is empty')
    const maciContractAddress = maciAddress ? maciAddress : readContractAddress("MACI")

    if (!(await contractExists(signer.provider, maciContractAddress))) logError('MACI contract does not exist')

    if (pollId < 0) logError('Invalid poll id')

    const maciContract = new Contract(
        maciContractAddress,
        parseArtifact('MACI')[0],
        signer
    )

    const pollAddr = await maciContract.polls(pollId)
    if (!(await contractExists(signer.provider, pollAddr))) logError('Poll contract does not exist')
    const pollContract = new Contract(
        pollAddr,
        parseArtifact('Poll')[0],
        signer
    )

    const extContracts = await pollContract.extContracts()
    const messageAqContractAddr = extContracts.messageAq
    const messageAqContract = new Contract(
        messageAqContractAddr,
        parseArtifact('AccQueue')[0],
        signer
    )

    // Check that the state and message trees have been merged for at least the first poll
    if (!(await pollContract.stateAqMerged()) && pollId == 0) logError(
        'The state tree has not been merged yet. ' +
        'Please use the mergeSignups subcommmand to do so.'
    )

    const messageTreeDepth = Number(
        (await pollContract.treeDepths()).messageTreeDepth
    )

    const mainRoot = (await messageAqContract.getMainRoot(messageTreeDepth.toString())).toString()
    if (mainRoot === '0') logError(
        'The message tree has not been merged yet. ' +
        'Please use the mergeMessages subcommmand to do so.'
    )

    // build an off-chain representation of the MACI contract using data in the contract storage
    const fromBlock = transactionHash ? (await signer.provider.getTransaction(transactionHash)).blockNumber : 0
    if (!quiet) logYellow(info(`starting to fetch logs from block ${fromBlock}`))

    const maciState = await genMaciStateFromContract(
        signer.provider,
        maciContract.address,
        coordinatorKeypair,
        pollId,
        fromBlock
    )

    const poll = maciState.polls[pollId]

    const processProofs: any[] = []
    const tallyProofs: any[] = []
    const subsidyProofs: any[] = []

    // time how long it takes
    const startTime = Date.now()

    if (!quiet) logYellow(info(`Generating proofs of message processing...`))
    const messageBatchSize = poll.batchSizes.messageBatchSize
    const numMessages = poll.messages.length
    let totalMessageBatches = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize)
    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) totalMessageBatches ++

    // while we have unprocessed messages, process them
    while(poll.hasUnprocessedMessages()) { 
        const circuitInputs = poll.processMessages(pollId)

        try {
            const r = await genProof(
                circuitInputs,
                processZkey,
                rapidsnark,
                processWitgen
            )
            const isValid = await verifyProof(
                r.publicInputs,
                r.proof,
                processVk
            )

            if (!isValid) logError('Error: generated an invalid proof')

            const thisProof = {
                circuitInputs,
                proof: r.proof,
                publicInputs: r.publicInputs,
            }
            // save the proof 
            processProofs.push(thisProof)
            writeFileSync(join(outputDir, `process_${poll.numBatchesProcessed -1}.json`), JSON.stringify(thisProof, null, 4))

            if (!quiet) logYellow(info(`Progress: ${poll.numBatchesProcessed} / ${totalMessageBatches}`))
        } catch (error: any) {
            logError(error.message)
        }
    }

    const endTime = Date.now()
    if (!quiet) logYellow(info(`gen processMessage proof took ${(endTime - startTime)/1000} seconds\n`))

    // subsidy calculations are not mandatory
    if (subsidyFile) {
        const subsidyStartTime = Date.now()
        if (!quiet) logYellow(info(`Generating proofs of subsidy calculation...`))

        const subsidyBatchSize = poll.batchSizes.subsidyBatchSize
        const numLeaves = poll.stateLeaves.length
        const totalSubsidyBatches = Math.ceil(numLeaves/subsidyBatchSize) ** 2
        if (!quiet) logYellow(info(`subsidyBatchSize=${subsidyBatchSize}, numLeaves=${numLeaves}, totalSubsidyBatch=${totalSubsidyBatches}`))

        let numBatchesCalulated = 0

        // @todo fix types in the circuits package
        // @todo why this next part works
        let subsidyCircuitInputs: any
        // calculate the subsidy for each batch
        while (poll.hasUnfinishedSubsidyCalculation()) {
            subsidyCircuitInputs = poll.subsidyPerBatch()
            try {
                const r = await genProof(
                    subsidyCircuitInputs,
                    rapidsnark,
                    subsidyWitgen,
                    subsidyZkey
                )
                const isValid = await verifyProof(
                    r.publicInputs,
                    r.proof,
                    subsidyVk
                )
                if (!isValid) logError('Error: generated an invalid subsidy calc proof')

                const thisProof = {
                    circuitInputs: subsidyCircuitInputs,
                    proof: r.proof,
                    publicInputs: r.publicInputs,
                }
                subsidyProofs.push(thisProof)
                writeFileSync(join(outputDir,  `subsidy_${numBatchesCalulated}.json`), JSON.stringify(thisProof, null, 4))
                numBatchesCalulated ++
                if (!quiet) logYellow(info(`Progress: ${numBatchesCalulated} / ${totalSubsidyBatches}`))
            } catch (error: any) {
                logError(error.message)
            }
        }

        const subsidyFileData = {
            provider: signer.provider.connection.url,
            maci: maciAddress,
            pollId,
            newSubsidyCommitment: asHex(subsidyCircuitInputs.newSubsidyCommitment),
            results: {
                subsidy: poll.subsidy.map((x) => x.toString()),
                salt: asHex(subsidyCircuitInputs.newSubsidySalt),
            }
        }

        // store it 
        writeFileSync(subsidyFile, JSON.stringify(subsidyFileData, null, 4))
        
        const susbsidyEndTime = Date.now()
        if (!quiet) logYellow(info(`gen subsidy proof took ${(susbsidyEndTime - subsidyStartTime)/1000} seconds\n`))
    }

    // tallying proofs
    if (!quiet) logYellow(info(`Generating proofs of vote tallying...`))
    const tallyStartTime = Date.now()

    const tallyBatchSize = poll.batchSizes.tallyBatchSize
    const numStateLeaves = poll.stateLeaves.length
    let totalTallyBatches = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize)
    if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) totalTallyBatches ++

    let tallyCircuitInputs: any 
    // tally all ballots for this poll
    while (poll.hasUntalliedBallots()) {
        tallyCircuitInputs = poll.tallyVotes()

        try {
            // generate the proof
            const r = await genProof(
                tallyCircuitInputs,
                rapidsnark,
                tallyWitgen,
                tallyZkey
            )

            // verify it 
            const isValid = await verifyProof(
                r.publicInputs,
                r.proof,
                tallyVk
            )

            if (!isValid) logError('Generated an invalid tally proof')

            const thisProof = {
                circuitInputs: tallyCircuitInputs,
                proof: r.proof,
                publicInputs: r.publicInputs,
            }

            tallyProofs.push(thisProof)

            writeFileSync(join(outputDir, `tally_${poll.numBatchesTallied - 1}.json`), JSON.stringify(thisProof, null, 4))

            if (!quiet) logYellow(info(`Progress: ${poll.numBatchesTallied} / ${totalTallyBatches}`))


        } catch (error: any) { logError(error.message) }
    }

    const tallyFileData = {
        provider: signer.provider.connection.url,
        maci: maciAddress,
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

    // verify the results
    // Compute newResultsCommitment
    const newResultsCommitment = genTreeCommitment(
        tallyFileData.results.tally.map((x) => BigInt(x)),
        BigInt(tallyFileData.results.salt),
        poll.treeDepths.voteOptionTreeDepth
    )
    // compute newSpentVoiceCreditsCommitment
    const newSpentVoiceCreditsCommitment = hashLeftRight(
        BigInt(tallyFileData.totalSpentVoiceCredits.spent),
        BigInt(tallyFileData.totalSpentVoiceCredits.salt)
    )
    
    // Compute newPerVOSpentVoiceCreditsCommitment
    const newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
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

    writeFileSync(tallyFile, JSON.stringify(tallyFileData, null, 4))

    if ('0x' + newTallyCommitment.toString(16) === tallyFileData.newTallyCommitment) {
        if (!quiet) logGreen(success('The tally commitment is correct'))
    } else {
        logError('Error: the newTallyCommitment is invalid.')
    }

    const tallyEndTime = Date.now()
    if (!quiet) logYellow(info(`gen tally proof took ${(tallyEndTime - tallyStartTime)/1000} seconds\n`))
}
