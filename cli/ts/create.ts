import {
    genJsonRpcDeployer,
    deployMaci,
    deployConstantInitialVoiceCreditProxy,
    deployUserDefinedInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
} from 'maci-contracts'

import {
    PrivKey,
    Keypair,
} from 'maci-domainobjs'


import {
    promptPwd,
    validateEthSk,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_MAX_USERS,
    DEFAULT_MAX_MESSAGES,
    DEFAULT_MAX_VOTE_OPTIONS,
    DEFAULT_SIGNUP_DURATION,
    DEFAULT_VOTING_DURATION,
    DEFAULT_INITIAL_VOICE_CREDITS,
    DEFAULT_MESSAGE_BATCH_SIZE,
    DEFAULT_TALLY_BATCH_SIZE,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'create',
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


    const coordinatorPrivkeyGroup = createParser.addMutuallyExclusiveGroup({ required: true })

    coordinatorPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the coordinator\'s serialized MACI private key',
        }
    )

    coordinatorPrivkeyGroup.addArgument(
        ['-sk', '--privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The coordinator\'s serialized MACI private key',
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
        ['-u', '--max-users'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of users. It must be one less than a power of 2. Default: 24',
        }
    )

    createParser.addArgument(
        ['-m', '--max-messages'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of messages. It must be one less than a power of 2. Default: 24',
        }
    )

    createParser.addArgument(
        ['-v', '--max-vote-options'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of vote options. It must be one less than a power of 5. Default: 15',
        }
    )

    createParser.addArgument(
        ['-s', '--signup-duration'],
        {
            action: 'store',
            'default': DEFAULT_SIGNUP_DURATION,
            type: 'int',
            help: 'The sign-up duration in seconds. Default: 3600',
        }
    )

    createParser.addArgument(
        ['-o', '--voting-duration'],
        {
            action: 'store',
            'default': DEFAULT_VOTING_DURATION,
            type: 'int',
            help: 'The voting duration in seconds. Default: 3600',
        }
    )

    createParser.addArgument(
        ['-bm', '--message-batch-size'],
        {
            action: 'store',
            type: 'int',
            help: 'The batch size for processing messages',
        }
    )

    createParser.addArgument(
        ['-bv', '--tally-batch-size'],
        {
            action: 'store',
            type: 'int',
            help: 'The batch size for tallying votes',
        }
    )

    const vcGroup = createParser.addMutuallyExclusiveGroup()

    vcGroup.addArgument(
        ['-c', '--initial-voice-credits'],
        {
            action: 'store',
            type: 'int',
            help: 'Each user\'s initial voice credits. Default: 100',
        }
    )

    vcGroup.addArgument(
        ['-i', '--initial-vc-proxy'],
        {
            action: 'store',
            type: 'string',
            help: 'If specified, deploys the MACI contract with this address as the initial voice credit proxy constructor argument. Otherwise, deploys a ConstantInitialVoiceCreditProxy contract with the above-specified value.',
        }
    )

    createParser.addArgument(
        ['-g', '--signup-gatekeeper'],
        {
            action: 'store',
            type: 'string',
            help: 'If specified, deploys the MACI contract with this address as the signup gatekeeper constructor argument. Otherwise, deploys a gatekeeper contract which allows any address to sign up.',
        }
    )

    createParser.addArgument(
        ['-n', '--debug-mode'],
        {
            action: 'storeTrue',
            help: 'If specified, deploys the MACI contract in debug mode',
        }
    )

}

const create = async (args: any) => {

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

    // Max users
    const maxUsers = args.max_users ? args.max_users : DEFAULT_MAX_USERS

    // Max messages
    const maxMessages = args.max_messages ? args.max_messages : DEFAULT_MAX_MESSAGES

    // Max vote options
    const maxVoteOptions = args.max_vote_options ? args.max_vote_options : DEFAULT_MAX_VOTE_OPTIONS

    // Signup duration
    const signupDuration = args.signup_duration

    // Voting duration
    const votingDuration = args.voting_duration

    // Message batch size
    const messageBatchSize = args.message_batch_size ? args.message_batch_size : DEFAULT_MESSAGE_BATCH_SIZE

    // Tally batch size
    const tallyBatchSize = args.tally_batch_size ? args.tally_batch_size : DEFAULT_TALLY_BATCH_SIZE

    const debugMode = args.debug_mode
    if (debugMode) {
        if (signupDuration !== 0 && votingDuration !== 0) {
            console.error('Error: in debug mode, the signup and voting durations should be set to 0')
            return
        }
    }

    const isTest = maxMessages <= 16 && maxUsers <= 15 && maxVoteOptions <= 25

    const isSmall = 
        maxMessages > 16 && maxMessages <= 2048 ||
        maxUsers > 15 && maxUsers <= 255 ||
        maxVoteOptions > 24 && maxVoteOptions <= 125

    const isMedium = 
        maxMessages > 2048 && maxMessages <= 8192 ||
        maxUsers > 255 && maxUsers <= 511 ||
        maxVoteOptions > 24 && maxVoteOptions <= 125

    const isLarge =
        maxMessages > 8192 && maxMessages <= 32768 ||
        maxUsers > 512 && maxUsers <= 4095 ||
        maxVoteOptions > 24 && maxVoteOptions <= 125

    if (!isTest && !isSmall && !isMedium && !isLarge) {
        console.error('Error: this codebase only supports test, prod-small, prod-medium, or prod-large configurations for max-users, max-messages, and max-vote-options.')
        return
    }

    if (messageBatchSize !== 4 && messageBatchSize !== 8) {
        console.error('Error: this codebase only supports a message-batch-size of 4 or 8.')
        return
    }

    if (tallyBatchSize !== 4 && tallyBatchSize !== 8) {
        console.error('Error: this codebase only supports a tally-batch-size of value 4 or 8.')
        return
    }

    let stateTreeDepth
    let messageTreeDepth
    let voteOptionTreeDepth
    let configType

    if (isSmall) {
        stateTreeDepth = 8
        messageTreeDepth = 11
        voteOptionTreeDepth = 3
        configType = 'prod-small'
    } else if (isMedium) {
        stateTreeDepth = 9
        messageTreeDepth = 13
        voteOptionTreeDepth = 3
        configType = 'prod-medium'
    } else if (isLarge) {
        stateTreeDepth = 12
        messageTreeDepth = 15
        voteOptionTreeDepth = 3
        configType = 'prod-large'
    } else if (isTest) {
        stateTreeDepth = 4
        messageTreeDepth = 4
        voteOptionTreeDepth = 2
        configType = 'test'
    }

    // Initial voice credits
    const initialVoiceCredits = args.initial_voice_credits ? args.initial_voice_credits : DEFAULT_INITIAL_VOICE_CREDITS

    // Initial voice credit proxy contract 
    const initialVoiceCreditProxy = args.initial_vc_proxy

    // Whether we should deploy a ConstantInitialVoiceCreditProxy
    if (initialVoiceCreditProxy != undefined && initialVoiceCredits != undefined) {
        console.error('Error: only one of the following can be specified: the initial voice credit proxy or the amount of initial voice credits.')
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    if (! (await checkDeployerProviderConnection(deployerPrivkey, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }
    const deployer = genJsonRpcDeployer(deployerPrivkey, ethProvider)

    let initialVoiceCreditProxyContractAddress = ''
    if (initialVoiceCreditProxy == undefined) {
        if (debugMode) {
            // Deploy a UserDefinedInitialVoiceCreditProxy contract
            const c = await deployUserDefinedInitialVoiceCreditProxy(
                deployer,
                true,
            )
            await c.deployTransaction.wait()
            initialVoiceCreditProxyContractAddress = c.address
        } else {
            // Deploy a ConstantInitialVoiceCreditProxy contract
            const c = await deployConstantInitialVoiceCreditProxy(
                deployer,
                initialVoiceCredits,
                true,
            )
            await c.deployTransaction.wait()
            initialVoiceCreditProxyContractAddress = c.address
        }
    } else {
        initialVoiceCreditProxyContractAddress = initialVoiceCreditProxy
    }

    // Signup gatekeeper contract
    const signupGatekeeper = args.signup_gatekeeper

    let signUpGatekeeperAddress = ''
    if (signupGatekeeper == undefined) {
        // Deploy a FreeForAllGatekeeper contract
        const c = await deployFreeForAllSignUpGatekeeper(deployer, true)
        await c.deployTransaction.wait()
        signUpGatekeeperAddress = c.address
    } else {
        signUpGatekeeperAddress = signupGatekeeper
    }

    const contracts = await deployMaci(
        deployer,
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        tallyBatchSize,
        messageBatchSize,
        maxVoteOptions,
        signupDuration,
        votingDuration,
        coordinatorKeypair.pubKey,
        configType,
        true,
    )

    console.log('MACI:', contracts.maciContract.address)
}

export {
    create,
    configureSubparser,
}
