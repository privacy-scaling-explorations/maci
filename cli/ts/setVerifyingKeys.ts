import * as fs from 'fs'
import * as ethers from 'ethers'
import * as shelljs from 'shelljs'
import * as path from 'path'
import {
    loadAbi,
} from 'maci-contracts'

import {
    VerifyingKey,
} from 'maci-domainobjs'

import {
    promptPwd,
    validateEthSk,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const getVkJson = (zkeyFile: string) => {
    const vkFile = zkeyFile + '.vk.json'
    const snarkjsPath = path.join(
        __dirname,
        '..',
        'node_modules',
        'snarkjs',
        'build',
        'cli.cjs',
    )
    const cmd = `node ${snarkjsPath} zkev ${zkeyFile} ${vkFile}`
    shelljs.exec(cmd, { silent: true })
    const vkJson = fs.readFileSync(vkFile).toString()
    fs.unlinkSync(vkFile)
    return vkJson
}

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'setVerifyingKeys',
        { addHelp: true },
    )

    const ethSkGroup = createParser.addMutuallyExclusiveGroup({ required: true })

    ethSkGroup.addArgument(
        ['-dp', '--prompt-for-deployer-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the deployer\'s Ethereum private key and ignore -d / --deployer-privkey',
        }
    )

    ethSkGroup.addArgument(
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

    createParser.addArgument(
        ['-s', '--state-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The state tree depth for the first set of verifying keys. '
        }
    )

    createParser.addArgument(
        ['-i', '--int-state-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The intermediate state tree depth for vote tallying. '
        }
    )

    createParser.addArgument(
        ['-m', '--msg-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The message tree depth for message processing. '
        }
    )

    createParser.addArgument(
        ['-v', '--vote-option-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The vote option tree depth. '
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
        ['-p', '--process-messages-zkey'],
        {
            action: 'store',
            type: 'string',
            required: true,
            help: 'The .zkey file for the message processing circuit. '
        }
    )

    createParser.addArgument(
        ['-t', '--tally-votes-zkey'],
        {
            action: 'store',
            type: 'string',
            required: true,
            help: 'The .zkey file for the vote tallying circuit. '
        }
    )
}

const setVerifyingKeys = async (args: any) => {
    const vkRegistryAddress = args.vk_registry
    // State tree depth
    const stateTreeDepth = args.state_tree_depth
    const intStateTreeDepth = args.int_state_tree_depth
    const msgTreeDepth = args.msg_tree_depth
    const voteOptionTreeDepth = args.vote_option_tree_depth
    const msgBatchDepth = args.msg_batch_depth

    const pmZkeyFile = args.process_messages_zkey
    const tvZkeyFile = args.tally_votes_zkey
    const processVk: VerifyingKey = VerifyingKey.fromJSON(getVkJson(pmZkeyFile))
    const tallyVk: VerifyingKey = VerifyingKey.fromJSON(getVkJson(tvZkeyFile))

    debugger
    if (!fs.existsSync(pmZkeyFile)) {
        console.error(`Error: ${pmZkeyFile} does not exist.`)
        return 1
    }
    if (!fs.existsSync(tvZkeyFile)) {
        console.error(`Error: ${tvZkeyFile} does not exist.`)
        return 1
    }

    // Simple validation
    if (
        stateTreeDepth < 1 ||
        intStateTreeDepth < 1 ||
        msgTreeDepth < 1 ||
        voteOptionTreeDepth < 1 ||
        msgBatchDepth < 1
    ) {
        console.error('Error: invalid depth or batch size parameters')
        return 1
    }

    if (stateTreeDepth < intStateTreeDepth) {
        console.error('Error: invalid state tree depth or intermediate state tree depth')
        return 1
    }

    // Check the pm zkey filename against specified params
    const pmMatch = pmZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)\./)
    const pmStateTreeDepth = Number(pmMatch[1])
    const pmMsgTreeDepth = Number(pmMatch[2])
    const pmMsgBatchDepth = Number(pmMatch[3])
    const pmVoteOptionTreeDepth = Number(pmMatch[4])

    const tvMatch = tvZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)\./)
    const tvStateTreeDepth = Number(tvMatch[1])
    const tvIntStateTreeDepth = Number(tvMatch[2])
    const tvVoteOptionTreeDepth = Number(tvMatch[3])

    if (
        stateTreeDepth !== pmStateTreeDepth ||
        msgTreeDepth !== pmMsgTreeDepth ||
        msgBatchDepth !== pmMsgBatchDepth ||
        voteOptionTreeDepth !== pmVoteOptionTreeDepth ||

        stateTreeDepth != tvStateTreeDepth ||
        intStateTreeDepth != tvIntStateTreeDepth ||
        voteOptionTreeDepth != tvVoteOptionTreeDepth
    ) {
        console.error('Error: incorrect .zkey file; please check the circuit params')
        return 1
    }

    // The coordinator's Ethereum private key
    // They may either enter it as a command-line option or via the
    // standard input
    let ethSk
    if (args.prompt_for_deployer_privkey) {
        ethSk = await promptPwd('Deployer\'s Ethereum private key')
    } else {
        ethSk = args.deployer_privkey
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
    const vkRegistryAbi = loadAbi('VkRegistry.abi')
    const vkRegistryContract = new ethers.Contract(
        vkRegistryAddress,
        vkRegistryAbi,
        wallet,
    )

    try {
        const tx = await vkRegistryContract.setVerifyingKeys(
            stateTreeDepth,
            intStateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            msgBatchDepth,
            processVk.asContractParam(),
            tallyVk.asContractParam(),
        )

        const receipt = await tx.wait()
        if (receipt.status !== 1) {
            console.error('Error: transaction failed')
        }
        console.log('Transaction hash:', tx.hash)

        return 0
    } catch (e) {
        console.error('Error: transaction failed')
        console.error(e.message)
        return 1
    }
}

export {
    setVerifyingKeys,
    configureSubparser,
}
