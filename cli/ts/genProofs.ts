import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    genRandomSalt,
    stringifyBigInts,
} from 'maci-crypto'

import {
    maciContractAbi,
} from 'maci-contracts'

import {
    genBatchUstProofAndPublicSignals,
    verifyBatchUstProof,
    genQvtProofAndPublicSignals,
    verifyQvtProof,
    getSignalByNameViaSym,
} from 'maci-circuits'

import {
    PubKey,
    PrivKey,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import { 
    genPerVOSpentVoiceCreditsCommitment,
    genTallyResultCommitment,
    genSpentVoiceCreditsCommitment,
} from 'maci-core'

import {
    promptPwd,
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'genProofs',
        { addHelp: true },
    )

    parser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: `A connection string to an Ethereum provider. Default: ${DEFAULT_ETH_PROVIDER}`,
        }
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
            required: true,
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-o', '--output'],
        {
            required: true,
            type: 'string',
            help: 'The output file',
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
        ['-z', '--final-zeroth-leaf'],
        {
            required: false,
            type: 'string',
            help: 'The serialized zeroth state leaf to update the state tree after processing the final message batch.',
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
    // Zeroth leaf
    const serialized = args.final_zeroth_leaf
    let zerothLeaf: StateLeaf
    if (serialized) {
        try {
            zerothLeaf = StateLeaf.unserialize(serialized)
        } catch {
            console.error('Error: invalid zeroth state leaf')
            return
        }
    } else {
        zerothLeaf = StateLeaf.genRandomLeaf()
    }

    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    const maciAddress = args.contract

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    // The coordinator's MACI private key
    // They may either enter it as a command-line option or via the
    // standard input
    let coordinatorPrivkey
    if (args.prompt_for_maci_privkey) {
        coordinatorPrivkey = await promptPwd('Coordinator\'s MACI private key')
    } else {
        coordinatorPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(coordinatorPrivkey)) {
        console.error('Error: invalid MACI private key')
        return
    }

    const unserialisedPrivkey = PrivKey.unserialize(coordinatorPrivkey)
    const coordinatorKeypair = new Keypair(unserialisedPrivkey)

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        provider,
    )

    // Build an off-chain representation of the MACI contract using data in the contract storage
    let maciState
    try {
        maciState = await genMaciStateFromContract(
            provider,
            maciAddress,
            coordinatorKeypair,
            StateLeaf.genBlankLeaf(BigInt(0)),
            false,
        )
    } catch (e) {
        console.error(e)
        return
    }

    const numMessages = maciState.messages.length
    if (numMessages === 0) {
        console.error('No messages to process.')
        return
    }
    const messageBatchSize  = Number(await maciContract.messageBatchSize())

    const outputFile = args.output

    const processProofs: any[] = []
    const tallyProofs: any[] = []
    //if (fs.existsSync(outputFile)) {
        //proofs = JSON.parse(fs.readFileSync(outputFile).toString())
    //}

    const currentMessageBatchIndex = numMessages % messageBatchSize === 0 ?
        (numMessages / messageBatchSize - 1) * messageBatchSize
        :
        Math.floor(numMessages / messageBatchSize) * messageBatchSize


    console.log('Generating proofs of message processing...')
    let proofNum = 1

    for (let i = currentMessageBatchIndex; i >= 0; i -= messageBatchSize) {
        console.log(`\nProgress: ${proofNum} / ${1 + currentMessageBatchIndex / messageBatchSize}; batch index: ${i}`)
        proofNum ++

        const randomStateLeaf = i > 0 ?
            StateLeaf.genRandomLeaf()
            :
            zerothLeaf
        const circuitInputs = maciState.genBatchUpdateStateTreeCircuitInputs(
            i,
            messageBatchSize,
            randomStateLeaf,
        )
        // Process the batch of messages
        maciState.batchProcessMessage(
            i,
            messageBatchSize,
            randomStateLeaf,
        )

        const stateRootAfter = maciState.genStateRoot()

        let result

        let configType
        let circuitName
        if (maciState.stateTreeDepth === 12) {
            configType = 'prod-large'
            circuitName = 'batchUstLarge'
        } else if (maciState.stateTreeDepth === 9) {
            configType = 'prod-medium'
            circuitName = 'batchUstMedium'
        } else if (maciState.stateTreeDepth === 8) {
            configType = 'prod-small'
            circuitName = 'batchUstSmall'
        } else {
            configType = 'test'
            circuitName = 'batchUst'
        }

        try {
            result = await genBatchUstProofAndPublicSignals(circuitInputs, configType)
        } catch (e) {
            console.error('Error: unable to compute batch update state tree witness data')
            console.error(e)
            return
        }
        const { witness, proof, publicSignals } = result

        // Get the circuit-generated root
        //const circuitNewStateRoot = getSignalByName(circuit, witness, 'main.root')
        const circuitNewStateRoot = getSignalByNameViaSym(circuitName, witness, 'main.root')
        if (!circuitNewStateRoot.toString() === stateRootAfter.toString()) {
            console.error('Error: circuit-computed root mismatch')
            return
        }

        const ecdhPubKeys: string[] = []
        for (const p of circuitInputs['ecdh_public_key']) {
            const pubKey = new PubKey(p.map((x) => BigInt(x)))
            ecdhPubKeys.push(pubKey.serialize())
        }

        const isValid = await verifyBatchUstProof(proof, publicSignals, configType)
        if (!isValid) {
            console.error('Error: could not generate a valid proof or the verifying key is incorrect')
            return
        }

        processProofs.push(stringifyBigInts({
            stateRootAfter,
            circuitInputs,
            publicSignals,
            proof,
            ecdhPubKeys,
            randomStateLeaf: randomStateLeaf.serialize(),
        }))

        if (outputFile) {
            saveOutput(outputFile, processProofs, tallyProofs)
        }
    }

    // Tally votes

    const tallyBatchSize = Number(await maciContract.tallyBatchSize())
    const numStateLeaves = 1 + maciState.users.length

    let currentResultsSalt = BigInt(0)
    let currentTvcSalt = BigInt(0)
    let currentPvcSalt = BigInt(0)
    let cumulativeTally
    let newResultsCommitment
    let newSpentVoiceCredits
    let newSpentVoiceCreditsCommitment
    let newResultsSalt
    let newSpentVoiceCreditsSalt
    let newPerVOSpentVoiceCreditsSalt
    let newPerVOSpentVoiceCreditsCommitment
    let totalPerVOSpentVoiceCredits

    console.log('\nGenerating proofs of vote tallying...')
    for (let i = 0; i < numStateLeaves; i += tallyBatchSize) {
        const startIndex = i

        console.log(`\nProgress: ${1 + i / tallyBatchSize} / ${1 + Math.floor(numStateLeaves / tallyBatchSize)}; batch index: ${i}`)

        cumulativeTally = maciState.computeCumulativeVoteTally(startIndex)

        const tally = maciState.computeBatchVoteTally(startIndex, tallyBatchSize)
        let totalVotes = BigInt(0)
        for (let i = 0; i < tally.length; i++) {
            cumulativeTally[i] = BigInt(cumulativeTally[i]) + BigInt(tally[i])
            totalVotes += cumulativeTally[i]
        }

        newResultsSalt = genRandomSalt()
        newSpentVoiceCreditsSalt = genRandomSalt()
        newPerVOSpentVoiceCreditsSalt = genRandomSalt()

        // Generate circuit inputs
        const circuitInputs 
            = maciState.genQuadVoteTallyCircuitInputs(
                startIndex,
                tallyBatchSize,
                currentResultsSalt,
                newResultsSalt,
                currentTvcSalt,
                newSpentVoiceCreditsSalt,
                currentPvcSalt,
                newPerVOSpentVoiceCreditsSalt,
            )

        currentResultsSalt = BigInt(newResultsSalt)
        currentTvcSalt = BigInt(newSpentVoiceCreditsSalt)
        currentPvcSalt = BigInt(newPerVOSpentVoiceCreditsSalt)

        let configType
        let circuitName
        if (maciState.stateTreeDepth === 12) {
            configType = 'prod-large'
            circuitName = 'qvtLarge'
        } else if (maciState.stateTreeDepth === 9) {
            configType = 'prod-medium'
            circuitName = 'qvtMedium'
        } else if (maciState.stateTreeDepth === 8) {
            configType = 'prod-small'
            circuitName = 'qvtSmall'
        } else {
            configType = 'test'
            circuitName = 'qvt'
        }

        let result
        try {
            result = await genQvtProofAndPublicSignals(circuitInputs, configType)
        } catch (e) {
            console.error('Error: unable to compute quadratic vote tally witness data')
            console.error(e)
            return
        }

        const { witness, proof, publicSignals } = result

        // The vote tally commmitment
        const expectedNewResultsCommitmentOutput =
            getSignalByNameViaSym(circuitName, witness, 'main.newResultsCommitment')

        newResultsCommitment = genTallyResultCommitment(
            cumulativeTally,
            newResultsSalt,
            maciState.voteOptionTreeDepth,
        )

        if (expectedNewResultsCommitmentOutput.toString() !== newResultsCommitment.toString()) {
            console.error('Error: result commitment mismatch')
            return
        }

        // The commitment to the total spent voice credits
        const expectedSpentVoiceCreditsCommitmentOutput =
            getSignalByNameViaSym(circuitName, witness, 'main.newSpentVoiceCreditsCommitment')

        const currentSpentVoiceCredits = maciState.computeCumulativeSpentVoiceCredits(startIndex)

        newSpentVoiceCredits = 
            currentSpentVoiceCredits + 
            maciState.computeBatchSpentVoiceCredits(startIndex, tallyBatchSize)

        newSpentVoiceCreditsCommitment = genSpentVoiceCreditsCommitment(
            newSpentVoiceCredits,
            currentTvcSalt,
        )

        if (expectedSpentVoiceCreditsCommitmentOutput.toString() !== newSpentVoiceCreditsCommitment.toString()) {
            console.error('Error: total spent voice credits commitment mismatch')
            return
        }

        // The commitment to the spent voice credits per vote option
        const expectedPerVOSpentVoiceCreditsCommitmentOutput =
            getSignalByNameViaSym(circuitName, witness, 'main.newPerVOSpentVoiceCreditsCommitment')

        const currentPerVOSpentVoiceCredits 
            = maciState.computeCumulativePerVOSpentVoiceCredits(startIndex)

        const perVOSpentVoiceCredits = maciState.computeBatchPerVOSpentVoiceCredits(
            startIndex,
            tallyBatchSize,
        )

        totalPerVOSpentVoiceCredits = []
        for (let i = 0; i < currentPerVOSpentVoiceCredits.length; i ++) {
            totalPerVOSpentVoiceCredits[i] = currentPerVOSpentVoiceCredits[i] + perVOSpentVoiceCredits[i]
        }

        newPerVOSpentVoiceCreditsCommitment = genPerVOSpentVoiceCreditsCommitment(
            totalPerVOSpentVoiceCredits,
            newPerVOSpentVoiceCreditsSalt,
            maciState.voteOptionTreeDepth,
        )

        if (
            expectedPerVOSpentVoiceCreditsCommitmentOutput.toString() !== 
            newPerVOSpentVoiceCreditsCommitment.toString()
        ) {
            console.error('Error: total spent voice credits per vote option commitment mismatch')
            return
        }

        const isValid = verifyQvtProof(proof, publicSignals, configType)
        if (!isValid) {
            console.error('Error: could not generate a valid proof or the verifying key is incorrect')
            return
        }

        tallyProofs.push(stringifyBigInts({
            circuitInputs,
            publicSignals,
            proof,
            newResultsCommitment,
            newSpentVoiceCreditsCommitment,
            newPerVOSpentVoiceCreditsCommitment,
            totalVotes,
        }))

        if (outputFile) {
            saveOutput(outputFile, processProofs, tallyProofs)
        }
    }

    const tallyFileData = {
        provider: ethProvider,
        maci: maciContract.address,
        results: {
            commitment: '0x' + BigInt(newResultsCommitment.toString()).toString(16),
            tally: cumulativeTally.map((x) => x.toString()),
            salt: '0x' + currentResultsSalt.toString(16),
        },
        totalVoiceCredits: {
            spent: newSpentVoiceCredits.toString(),
            commitment: '0x' + newSpentVoiceCreditsCommitment.toString(16),
            salt: '0x' + newSpentVoiceCreditsSalt.toString(16),
        },
        totalVoiceCreditsPerVoteOption: {
            commitment: '0x' + newPerVOSpentVoiceCreditsCommitment.toString(16),
            tally: totalPerVOSpentVoiceCredits.map((x) => x.toString()),
            salt: '0x' + newPerVOSpentVoiceCreditsSalt.toString(16),
        },
    }

    if (args.tally_file) {
        fs.writeFileSync(args.tally_file, JSON.stringify(tallyFileData, null, 4))
    }
    console.log('OK')
    return {
        proofs: { processProofs, tallyProofs },
        tally: tallyFileData,
    }
}

const saveOutput = (outputFile: string, processProofs: any, tallyProofs: any) => {
    fs.writeFileSync(
        outputFile,
        JSON.stringify({ processProofs, tallyProofs }, null, 2),
    )
}

export {
    genProofs,
    configureSubparser,
}
