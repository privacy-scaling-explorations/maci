import {
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployMaci,
    deployVerifier,
} from 'maci-contracts'

import {readJSONFile, writeJSONFile} from 'maci-common'
import {contractFilepath} from './config'

import {
    DEFAULT_INITIAL_VOICE_CREDITS,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'create',
        { addHelp: true },
    )

    createParser.addArgument(
        ['-r', '--vk-registry'],
        {
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
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["VkRegistry"]) && !args.vk_registry) {
        console.error('Error: vkRegistry contract address is empty') 
        return 1
    }

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
            false,
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


    const verifierContract = await deployVerifier(true)

    const vkRegistryContractAddress = args.vk_registry ? args.vk_registry: contractAddrs["VkRegistry"]

    const {
        maciContract,
        stateAqContract,
        pollFactoryContract,
        messageAqContract,
    } = await deployMaci(
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
        verifierContract.address,
        vkRegistryContractAddress,
    )

    console.log('MACI:', maciContract.address)

    contractAddrs['InitialVoiceCreditProxy'] = initialVoiceCreditProxyContractAddress
    contractAddrs['SignUpGatekeeper'] = signUpGatekeeperAddress
    contractAddrs['Verifier'] = verifierContract.address
    contractAddrs['MACI'] = maciContract.address
    contractAddrs['StateAq'] = stateAqContract.address
    contractAddrs['PollFactory'] = pollFactoryContract.address
    contractAddrs['MessageAqFactory'] = messageAqContract.address
    writeJSONFile(contractFilepath, contractAddrs)

    return 0
}

export {
    create,
    configureSubparser,
}
