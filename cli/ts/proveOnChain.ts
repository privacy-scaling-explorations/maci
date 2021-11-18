import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    maciContractAbi,
    formatProofForVerifierContract,
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
    delay,
    promptPwd,
    validateEthSk,
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'proveOnChain',
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

    const ethPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    ethPrivkeyGroup.addArgument(
        ['-dp', '--prompt-for-eth-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the user\'s Ethereum private key and ignore -d / --eth-privkey',
        }
    )

    ethPrivkeyGroup.addArgument(
        ['-d', '--eth-privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The deployer\'s Ethereum private key',
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
        ['-o', '--proof-file'],
        {
            required: true,
            type: 'string',
            help: 'The proof output file from the genProofs subcommand',
        }
    )
}

const proveOnChain = async (args: any) => {
    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    let ethSk
    // The coordinator's Ethereum private key
    // The user may either enter it as a command-line option or via the
    // standard input
    if (args.prompt_for_eth_privkey) {
        ethSk = await promptPwd('Your Ethereum private key')
    } else {
        ethSk = args.eth_privkey
    }

    if (ethSk.startsWith('0x')) {
        ethSk = ethSk.slice(2)
    }

    if (!validateEthSk(ethSk)) {
        console.error('Error: invalid Ethereum private key')
        return
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    if (! (await checkDeployerProviderConnection(ethSk, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    const wallet = new ethers.Wallet(ethSk, provider)

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

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    // Check that the contract is ready to accept proofs
    const currentMessageBatchIndex = Number(await maciContract.currentMessageBatchIndex())
    const numMessages = Number(await maciContract.numMessages())
    const messageBatchSize  = Number(await maciContract.messageBatchSize())

    const numSignUps = Number(await maciContract.numSignUps())
    const tallyBatchSize = Number(await maciContract.tallyBatchSize())

    const expectedIndex = Math.floor(numMessages / messageBatchSize) * messageBatchSize
    if (currentMessageBatchIndex > expectedIndex) {
        console.error('Error: unexpected current message batch index. Is the contract address correct?')
        return
    }

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

    // Check that the proof file is complete
    const expectedNumProcessProofs =
        numMessages % messageBatchSize === 0 ?
        numMessages / messageBatchSize
        :
        1 + Math.floor(numMessages / messageBatchSize)

    const expectedNumTallyProofs = (1 + numSignUps) % tallyBatchSize === 0 ?
        (1 + numSignUps) / tallyBatchSize
        :
        1 + Math.floor((1 + numSignUps) / tallyBatchSize)

    debugger
    if (expectedNumProcessProofs !== data.processProofs.length) {
        console.error('Error: the message processing proofs in', args.proof_file, 'are incomplete')
        return
    }

    if (expectedNumTallyProofs !== data.tallyProofs.length) {
        console.error('Error: the vote tallying proofs in', args.proof_file, 'are incomplete')
        return
    }

    // ------------------------------------------------------------------------
    // Message processing proofs
    console.log('\nSubmitting proofs of message processing...')
    
    // Get the maximum message batch index
    const maxMessageBatchIndex = numMessages % messageBatchSize === 0 ?
        (numMessages / messageBatchSize - 1) * messageBatchSize
        :
        Math.floor(numMessages / messageBatchSize) * messageBatchSize

    // Get the number of processed message batches
    let numProcessedMessageBatches
    if (! (await maciContract.hasUnprocessedMessages())) {
        numProcessedMessageBatches = data.processProofs.length
    } else {
        numProcessedMessageBatches = (
            maxMessageBatchIndex - currentMessageBatchIndex
        ) / messageBatchSize
    }

    for (let i = numProcessedMessageBatches; i < data.processProofs.length; i ++) {
        console.log(`\nProgress: ${i+1}/${data.processProofs.length}`)
        const p = data.processProofs[i]

        //const circuitInputs = p.circuitInputs
        const stateRootAfter = BigInt(p.stateRootAfter)
        const proof = p.proof
        const ecdhPubKeys = p.ecdhPubKeys.map((x) => PubKey.unserialize(x))
        
        const formattedProof = formatProofForVerifierContract(proof)
        const txErr = 'Error: batchProcessMessage() failed'

        let tx
        try {
            tx = await maciContract.batchProcessMessage(
                '0x' + stateRootAfter.toString(16),
                ecdhPubKeys.map((x) => x.asContractParam()),
                formattedProof,
                { gasLimit: 2000000 },
            )
        } catch (e) {
            console.error(txErr)
            console.error(e)
            break
        }

        const receipt = await tx.wait()

        if (receipt.status !== 1) {
            console.error(txErr)
            break
        }
        console.log(`Transaction hash: ${tx.hash}`)
    }

    // ------------------------------------------------------------------------
    // Vote tallying proofs
    console.log('Submitting proofs of vote tallying...')

    // Get the maximum tally batch index
    const maxTallyBatchIndex = (1 + numSignUps) % tallyBatchSize === 0 ?
        (1 + numSignUps) / tallyBatchSize
        :
        1 + Math.floor((1 + numSignUps) / tallyBatchSize)

    // Get the number of processed message batches
    const currentQvtBatchNum = Number(await maciContract.currentQvtBatchNum())

    for (let i = currentQvtBatchNum; i < maxTallyBatchIndex; i ++) {
        console.log(`\nProgress: ${i+1}/${maxTallyBatchIndex}`)
        const p = data.tallyProofs[i]
        const proof = p.proof
        const circuitInputs = p.circuitInputs
        const newResultsCommitment = p.newResultsCommitment
        const newSpentVoiceCreditsCommitment = p.newSpentVoiceCreditsCommitment
        const newPerVOSpentVoiceCreditsCommitment = p.newPerVOSpentVoiceCreditsCommitment
        const totalVotes = p.totalVotes
        const totalVotesPublicInput = BigInt(circuitInputs.isLastBatch) === BigInt(1) ? totalVotes.toString() : 0

        let tx
        const txErr = 'Error: proveVoteTallyBatch() failed'

        const formattedProof = formatProofForVerifierContract(proof)
        try {
            tx = await maciContract.proveVoteTallyBatch(
                circuitInputs.intermediateStateRoot.toString(),
                newResultsCommitment.toString(),
                newSpentVoiceCreditsCommitment.toString(),
                newPerVOSpentVoiceCreditsCommitment.toString(),
                totalVotesPublicInput.toString(),
                formattedProof,
                { gasLimit: 2000000 },
            )
        } catch (e) {
            console.error('Error: proveVoteTallyBatch() failed')
            console.error(txErr)
            console.error(e)
            break
        }

        const receipt = await tx.wait()

        if (receipt.status !== 1) {
            console.error(txErr)
            break
        }
        console.log(`Transaction hash: ${tx.hash}`)
    }
    console.log('OK')
}

export {
    proveOnChain,
    configureSubparser,
}
