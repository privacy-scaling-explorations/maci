import {
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployPollFactory,
    deployMaci,
    deployMessageAqFactory,
    getDefaultSigner,
} from 'maci-contracts'

import { contractExists } from './utils'

import {
    DEFAULT_INITIAL_VOICE_CREDITS,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'create',
        { addHelp: true },
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

    // Initial voice credits
    const initialVoiceCredits = args.initial_voice_credits ? args.initial_voice_credits : DEFAULT_INITIAL_VOICE_CREDITS

    // Initial voice credit proxy contract 
    const initialVoiceCreditProxy = args.initial_vc_proxy

    // Whether we should deploy a ConstantInitialVoiceCreditProxy
    if (initialVoiceCreditProxy != undefined && initialVoiceCredits != undefined) {
        console.error('Error: only one of the following can be specified: the initial voice credit proxy or the amount of initial voice credits.')
        return 1
    }

    let initialVoiceCreditProxyContractAddress
    if (initialVoiceCreditProxy == undefined) {
        // Deploy a ConstantInitialVoiceCreditProxy contract
        const c = await deployConstantInitialVoiceCreditProxy(
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
        const c = await deployFreeForAllSignUpGatekeeper(true)
        signUpGatekeeperAddress = c.address
    } else {
        signUpGatekeeperAddress = signupGatekeeper
    }

    const vkRegistryAddress = args.vk_registry
    // Check whether there is a contract deployed at the VkRegistry address
    const signer = await getDefaultSigner()
    if (!(await contractExists(signer.provider,vkRegistryAddress))) {
        console.error('Error: a VkRegistry contract is not deployed at', vkRegistryAddress)
        return 1
    }

    // Deploy PollFactory
    const pollFactoryContract = await deployPollFactory()
    await pollFactoryContract.deployTransaction.wait()

    // Deploy MessageAqFactory
    const messageAqFactoryContract = await deployMessageAqFactory()
    await messageAqFactoryContract.deployTransaction.wait()
    await (await (messageAqFactoryContract.transferOwnership(pollFactoryContract.address))).wait()
    
    const maciContract = await deployMaci(
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
        vkRegistryAddress,
    )

    await (await (pollFactoryContract.transferOwnership(maciContract.address))).wait()

    const initTx = await maciContract.init(
        vkRegistryAddress,
        messageAqFactoryContract.address,
    )
    await initTx.wait()

    console.log('MACI:', maciContract.address)
    return 0
}

export {
    create,
    configureSubparser,
}
