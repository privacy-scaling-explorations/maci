import {
    genJsonRpcDeployer,
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployPollFactory,
    deployPpt,
    deployMessageAqFactory,
    parseArtifact,
    deployPoseidonContracts,
    linkPoseidonLibraries,
} from 'maci-contracts'


import {
    promptPwd,
    validateEthSk,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_INITIAL_VOICE_CREDITS,
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

    createParser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: 'A connection string to an Ethereum provider. Default: http://localhost:8545',
        }
    )

    createParser.addArgument(
        ['-k', '--vk_registry'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The VkRegistry contract address',
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

    let initialVoiceCreditProxyContractAddress
    if (initialVoiceCreditProxy == undefined) {
        // Deploy a ConstantInitialVoiceCreditProxy contract
        const c = await deployConstantInitialVoiceCreditProxy(
            deployer,
            initialVoiceCredits,
            true,
        )
        initialVoiceCreditProxyContractAddress = c.address
    } else {
        initialVoiceCreditProxyContractAddress = initialVoiceCreditProxy
    }

    // Signup gatekeeper contract
    const signupGatekeeper = args.signup_gatekeeper

    let signUpGatekeeperAddress
    if (signupGatekeeper == undefined) {
        // Deploy a FreeForAllGatekeeper contract
        const c = await deployFreeForAllSignUpGatekeeper(deployer, true)
        signUpGatekeeperAddress = c.address
    } else {
        signUpGatekeeperAddress = signupGatekeeper
    }

    const vkRegistryAddress = args.vk_registry
    // Check whether there is a contract deployed at the VkRegistry address

    const {
        PoseidonT3Contract,
        PoseidonT4Contract,
        PoseidonT5Contract,
        PoseidonT6Contract,
    } = await deployPoseidonContracts(deployer)

    // Link Poseidon contracts to MACI
    linkPoseidonLibraries(
        ['MACI.sol'],
        PoseidonT3Contract.address,
        PoseidonT4Contract.address,
        PoseidonT5Contract.address,
        PoseidonT6Contract.address,
    )

    // Link Poseidon contracts to MACI
    linkPoseidonLibraries(
        ['MACI.sol'],
        PoseidonT3Contract.address,
        PoseidonT4Contract.address,
        PoseidonT5Contract.address,
        PoseidonT6Contract.address,
    )

    const [ MACIAbi, MACIBin ] = parseArtifact('MACI')

    // Deploy PollFactory
    const pollFactoryContract = await deployPollFactory(deployer)
    await pollFactoryContract.deployTransaction.wait()

    // Deploy MessageAqFactory
    const messageAqFactoryContract = await deployMessageAqFactory(deployer)
    await messageAqFactoryContract.deployTransaction.wait()
    await (await (messageAqFactoryContract.transferOwnership(pollFactoryContract.address))).wait()
    
    const maciContract = await deployer.deploy(
        MACIAbi,
        MACIBin,
        pollFactoryContract.address,
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
    )
    await maciContract.deployTransaction.wait()

    await (await (pollFactoryContract.transferOwnership(maciContract.address))).wait()

    const initTx = await maciContract.init(
        vkRegistryAddress,
        messageAqFactoryContract.address,
    )
    await initTx.wait()

    console.log('MACI:', maciContract.address)
}

export {
    create,
    configureSubparser,
}
