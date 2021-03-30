import * as fs from 'fs'
import * as ethers from 'ethers'
import * as shelljs from 'shelljs'
import * as path from 'path'
import {
    parseArtifact,
    getDefaultSigner,
} from 'maci-contracts'

import {
    VerifyingKey,
} from 'maci-domainobjs'

import {
    contractExists,
} from './utils'

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
    console.log(`Generating ${zkeyFile}, please wait...`)
    const cmd = `node ${snarkjsPath} zkev ${zkeyFile} ${vkFile}`
    shelljs.exec(cmd, { silent: false })
    const vkJson = fs.readFileSync(vkFile).toString()
    fs.unlinkSync(vkFile)
    return vkJson
}

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'setVerifyingKeys',
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
        ['-b', '--msg-batch-depth'],
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

    // Check whether there is a contract deployed at the VkRegistry address
    const signer = await getDefaultSigner()
    if (!(await contractExists(signer.provider,vkRegistryAddress))) {
        console.error('Error: a VkRegistry contract is not deployed at', vkRegistryAddress)
        return 1
    }

    const [ vkRegistryAbi ] = parseArtifact('VkRegistry')
    const vkRegistryContract = new ethers.Contract(
        vkRegistryAddress,
        vkRegistryAbi,
        signer,
    )

    try {
        const tx = await vkRegistryContract.setVerifyingKeys(
            stateTreeDepth,
            intStateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            5 ** msgBatchDepth,
            processVk.asContractParam(),
            tallyVk.asContractParam(),
        )
        //console.log({stateTreeDepth, intStateTreeDepth, msgTreeDepth, voteOptionTreeDepth, msgBatchDepth})

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
