import * as ethers from 'ethers'
import {
    genJsonRpcDeployer,
    loadAbi,
    loadAB,
    deployVerifier,
} from 'maci-contracts'

import {
    PubKey,
    Keypair,
} from 'maci-domainobjs'


import {
    validateEthSk,
    promptPwd,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_MAX_USERS,
    DEFAULT_MAX_MESSAGES,
    DEFAULT_MAX_VOTE_OPTIONS,
    DEFAULT_INITIAL_VOICE_CREDITS,
    DEFAULT_MESSAGE_BATCH_SIZE,
    DEFAULT_TALLY_BATCH_SIZE,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'deployPoll',
        { addHelp: true },
    )

    const deployerPrivkeyGroup = createParser.addMutuallyExclusiveGroup({ required: true })

    deployerPrivkeyGroup.addArgument(
        ['-dp', '--prompt-for-deployer-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the deployer\'s Ethereum private key and ignore -d / --deployer-privkey',
        }
    )

    deployerPrivkeyGroup.addArgument(
        ['-d', '--deployer-privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The deployer\'s Ethereum private key',
        }
    )

    createParser.addArgument(
        ['-x', '--maci-address'],
        {
            action: 'store',
            type: 'string',
            required: true,
            help: 'The MACI contract address',
        }
    )

    createParser.addArgument(
        ['-pk', '--pubkey'],
        {
            action: 'store',
            type: 'string',
            required: true,
            help: 'The coordinator\'s serialized MACI public key',
        }
    )

    createParser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: 'A connection string to an Ethereum provider. Default: http://localhost:8545',
        }
    )

    createParser.addArgument(
        ['-t', '--duration'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The poll duration in seconds',
        }
    )

    createParser.addArgument(
        ['-g', '--max-messages'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The maximum number of messages',
        }
    )

    createParser.addArgument(
        ['-mv', '--max-vote-options'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The maximum number of vote options',
        }
    )

    createParser.addArgument(
        ['-i', '--int-state-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The intermediate state tree depth',
        }
    )

    createParser.addArgument(
        ['-m', '--msg-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The message tree depth',
        }
    )

    createParser.addArgument(
        ['-b', '--msg_batch_depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The batch depth for message processing. '
        }
    )

    createParser.addArgument(
        ['-v', '--vote-option-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The vote option tree depth',
        }
    )
}

const deployPoll = async (args: any) => {
    // The poll duration
    const duration = args.duration
    if (duration <= 0) {
        console.error('Error: the duration should be positive')
        return 1
    }

    // Max values
    const maxMessages = args.max_messages
    if (maxMessages <= 0) {
        console.error('Error: the maximum number of messages should be positive')
        return 1
    }

    // Max vote options
    const maxVoteOptions = args.max_vote_options
    if (maxVoteOptions <= 0) {
        console.error('Error: the maximum number of vote options be positive')
        return 1
    }
    const intStateTreeDepth = args.int_state_tree_depth
    const messageTreeSubDepth = args.msg_batch_depth
    const messageTreeDepth = args.msg_tree_depth
    const voteOptionTreeDepth = args.vote_option_tree_depth

    // The deployer's Ethereum private key
    // They may either enter it as a command-line option or via the
    // standard input
    let deployerPrivkey
    if (args.prompt_for_deployer_privkey) {
        deployerPrivkey = await promptPwd('Deployer\'s Ethereum private key')
    } else {
        deployerPrivkey = args.deployer_privkey
    }

    if (deployerPrivkey.startsWith('0x')) {
        deployerPrivkey = deployerPrivkey.slice(2)
    }

    if (!validateEthSk(deployerPrivkey)) {
        console.error('Error: invalid Ethereum private key')
        return
    }

    // The coordinator's MACI public key
    const coordinatorPubkey = args.pubkey

    if (!PubKey.isValidSerializedPubKey(coordinatorPubkey)) {
        console.error('Error: invalid MACI public key')
        return
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    if (! (await checkDeployerProviderConnection(deployerPrivkey, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }

    const unserialisedPubkey = PubKey.unserialize(coordinatorPubkey)

    const deployer = genJsonRpcDeployer(deployerPrivkey, ethProvider)
    const provider = new ethers.providers.JsonRpcProvider(ethProvider)
    const wallet = new ethers.Wallet(deployerPrivkey, provider)

    // Deployer a Verifier contract
    const verifierContract = await deployVerifier(deployer, true)

    // Deploy a PollProcessorAndTallyer contract
    const [ PptAbi, PptBin ] = loadAB('PollProcessorAndTallyer')
    const pptContract = await deployer.deploy(
        PptAbi,
        PptBin,
        verifierContract.address,
    )
    await pptContract.deployTransaction.wait()

    const maciAbi = loadAbi('MACI.abi')
    const maciContract = new ethers.Contract(
        args.maci_address,
        maciAbi,
        wallet,
    )

    try {
        const tx = await maciContract.deployPoll(
            duration,
            { maxMessages, maxVoteOptions },
            {
                intStateTreeDepth,
                messageTreeSubDepth,
                messageTreeDepth,
                voteOptionTreeDepth,
            },
            unserialisedPubkey.asContractParam(),
            pptContract.address,
        )
        const receipt = await tx.wait()
        const iface = new ethers.utils.Interface(maciContract.interface.abi)
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        const name = log.name
        if (name !== 'DeployPoll') {
            console.error('Error: invalid event log.')
            return 1
        }
        const pollId = log.values._pollId
        const pollAddr = log.values._pollAddr
        console.log('Verifier:', verifierContract.address)
        console.log('Poll ID:', pollId.toString())
        console.log('Poll contract:', pollAddr)
    } catch (e) {
        console.error('Error: could not deploy poll')
        console.error(e.message)
        return 1
    }

    return 0
}

export {
    deployPoll,
    configureSubparser,
}
