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
        'processAndTallyWithoutProofs',
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
        ['-t', '--tally-file'],
        {
            required: true,
            type: 'string',
            help: 'A filepath in which to save the final vote tally and salt.',
        }
    )
}

// This function is named as such as there already is a global Node.js object
// called 'process'
const processAndTallyWithoutProofs = async (args: any): Promise<object | undefined> => {
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

    const messageTreeMaxLeafIndex = (await maciContract.messageTreeMaxLeafIndex()).toNumber()

    // Build an off-chain representation of the MACI contract using data in the contract storage
    let maciState
    try {
        maciState = await genMaciStateFromContract(
            provider,
            maciAddress,
            coordinatorKeypair,
            StateLeaf.genBlankLeaf(BigInt(0)),
        )
    } catch (e) {
        console.error(e)
        return
    }

    const messageBatchSize  = Number((await maciContract.messageBatchSize()).toString())
    let currentMessageBatchIndex = 
        (Math.floor(maciState.messages.length / messageBatchSize)) * messageBatchSize

    const randomStateLeaf = StateLeaf.genRandomLeaf()
    while (true) {
        maciState.batchProcessMessage(
            currentMessageBatchIndex,
            messageBatchSize,
            randomStateLeaf,
        )
        if (currentMessageBatchIndex <= 0) {
            break
        }
        currentMessageBatchIndex -= messageBatchSize
    }

    const tally: BigInt[] = []
    const totalSpentVoiceCreditsPerVO: BigInt[] = []
    let totalSpentVoiceCredits = BigInt(0)
    for (let i = 0; i < 5 ** maciState.voteOptionTreeDepth; i ++) {
        tally.push(BigInt(0))
        totalSpentVoiceCreditsPerVO.push(BigInt(0))
    }

    for (let i = 0; i < maciState.users.length; i ++) {
        for (let j = 0; j < maciState.users[i].votes.length; j ++) {
            const votes = maciState.users[i].votes[j]
            tally[j] = tally[j] + votes
            const votesSq = (BigInt(votes) * BigInt(votes))
            totalSpentVoiceCreditsPerVO[j] = BigInt(totalSpentVoiceCreditsPerVO[j]) + votesSq
            totalSpentVoiceCredits = BigInt(totalSpentVoiceCredits) + votesSq
        }
    }

    const tallyFileData = {
        results: {
            tally: tally.map((x) => x.toString()),
        },
        totalVoiceCredits: {
            spent: totalSpentVoiceCredits.toString(),
        },
        totalVoiceCreditsPerVoteOption: {
            tally: totalSpentVoiceCreditsPerVO.map((x) => x.toString()),
        }
    }

    fs.writeFileSync(args.tally_file, JSON.stringify(tallyFileData, null, 4))

    return tallyFileData
}

export {
    processAndTallyWithoutProofs,
    configureSubparser,
}
