import * as assert from 'assert'
import * as ethers from 'ethers'

import { bigInt, genRandomSalt } from 'maci-crypto'

import { 
    genTallyResultCommitment,
    MaciState,
} from 'maci-core'

import {
    maciContractAbi,
    formatProofForVerifierContract,
} from 'maci-contracts'

import {
    loadPk,
    loadVk,
    compileAndLoadCircuit,
} from 'maci-circuits'

import {
    PubKey,
    PrivKey,
    Keypair,
    Message,
    Command,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genProof,
    verifyProof,
    genPublicSignals,
} from 'libsemaphore'

import {
    promptPwd,
    validateEthSk,
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_MESSAGE_BATCH_SIZE,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'tally',
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
        ['-z', '--leaf-zero'],
        {
            required: true,
            type: 'string',
            help: 'The serialised state leaf preimage at index 0',
        }
    )

    parser.addArgument(
        ['-r', '--repeat'],
        {
            action: 'storeTrue',
            help: 'Process all message batches instead of just the next one',
        }
    )
}

const tally = async (args: any) => {

    // Zeroth leaf
    const serialized = args.leaf_zero
    let zerothLeaf: StateLeaf
    let isValidZerothStateLeaf = false
    try {
        zerothLeaf = StateLeaf.unserialize(serialized)
        isValidZerothStateLeaf = true
    } catch {
    }

    if (!isValidZerothStateLeaf) {
        console.error('Error: invalid zeroth state leaf')
        return
    }

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

    const unserialisedPrivkey = PrivKey.unserialize(coordinatorPrivkey)
    const coordinatorKeypair = new Keypair(unserialisedPrivkey)

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    // Proceed only if all messages have been processed
    const currentMessageBatchIndex = await maciContract.currentMessageBatchIndex()

    if (await maciContract.hasUnprocessedMessages()) {
        console.error('Error: not all messages have been processed')
        return
    }

    if (! (await maciContract.hasUntalliedStateLeaves())) {
        console.error('Error: all state leaves have been tallied')
        return
    }

    // Build an off-chain representation of the MACI contract using data in the contract storage
    let maciState
    try {
        maciState = await genMaciStateFromContract(
            provider,
            maciAddress,
            coordinatorKeypair,
            zerothLeaf,
        )
    } catch (e) {
        console.error(e)
        return
    }

    const batchSize = bigInt((await maciContract.tallyBatchSize()).toString())

    while (true) {
        const startIndex = bigInt((await maciContract.currentQvtBatchNum()).toString())
        const tally = maciState.computeBatchVoteTally(startIndex, batchSize)
        const newResultsSalt = genRandomSalt()
        // Generate circuit inputs
        const circuitInputs 
            = maciState.genQuadVoteTallyCircuitInputs(
                startIndex,
                batchSize,
                newResultsSalt,
            )

        const circuit = await compileAndLoadCircuit('test/quadVoteTally_test.circom')
        const witness = circuit.calculateWitness(circuitInputs)

        if (!circuit.checkWitness(witness)) {
            console.error('Error: unable to compute quadratic vote tally witness data')
            return
        }

        const result = witness[circuit.getSignalIdx('main.newResultsCommitment')]

        const expectedCommitment = genTallyResultCommitment(tally, newResultsSalt)
        if (result.toString() !== expectedCommitment.toString()) {
            console.error('Error: result commitment mismatch')
            return
        }

        const publicSignals = genPublicSignals(witness, circuit)

        const contractPublicSignals = await maciContract.genQvtPublicSignals(
            circuitInputs.intermediateStateRoot.toString(),
            expectedCommitment.toString(),
        )

        const publicSignalMatch = JSON.stringify(publicSignals.map((x) => x.toString())) ===
            JSON.stringify(contractPublicSignals.map((x) => x.toString()))

        if (!publicSignalMatch) {
            console.error('Error: public signal mismatch')
            return
        }

        const qvtPk = loadPk('qvtPk')
        const qvtVk = loadVk('qvtVk')
        const proof = await genProof(witness, qvtPk)

        const isValid = verifyProof(qvtVk, proof, publicSignals)
        if (!isValid) {
            console.error('Error: could not generate a valid proof or the verifying key is incorrect')
            return
        }

        const formattedProof = formatProofForVerifierContract(proof)

        let tx
        const txErr = 'Error: proveVoteTallyBatch() failed'

        try {
            tx = await maciContract.proveVoteTallyBatch(
                circuitInputs.intermediateStateRoot.toString(),
                expectedCommitment.toString(),
                [...tally, newResultsSalt].map((x) => x.toString()),
                formattedProof,
            )
        } catch (e) {
            console.error(txErr)
            console.error(e)
            return
        }

        const receipt = await tx.wait()

        if (receipt.status !== 1) {
            console.error(txErr)
            return
        }

        console.log(`Transaction hash: ${tx.hash}`)
        if (!args.repeat || ! (await maciContract.hasUntalliedStateLeaves())) {
            break
        }
    }

    // Force the process to exit as it might get stuck
    process.exit()
}

export {
    tally,
    configureSubparser,
}
