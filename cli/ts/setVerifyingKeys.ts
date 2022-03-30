import * as fs from 'fs'
import * as ethers from 'ethers'
import * as shelljs from 'shelljs'
import * as path from 'path'

import { extractVk } from 'maci-circuits'
import { VerifyingKey } from 'maci-domainobjs'
import { genProcessVkSig, genTallyVkSig, genCoeffVkSig } from 'maci-core'
import { parseArtifact, getDefaultSigner } from 'maci-contracts'
import { contractExists } from './utils'
import { contractFilepath } from './config'
import { readJSONFile } from 'maci-common'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'setVerifyingKeys',
        { addHelp: true },
    )

    createParser.addArgument(
        ['-k', '--vk_registry'],
        {
            action: 'store',
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
        ['-ic', '--int-coeff-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The intermediate coeff tree depth. '
        }
    )

    createParser.addArgument(
        ['-cf', '--coeff-tree-depth'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The coeff tree depth. '
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
    createParser.addArgument(
        ['-cz', '--coeff-zkey'],
        {
            action: 'store',
            type: 'string',
            required: true,
            help: 'The .zkey file for the vote tallying circuit. '
        }
    )
}

const setVerifyingKeys = async (args: any) => {
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["VkRegistry"]) && !args.vk_registry) {
        console.error('Error: vkRegistry contract address is empty') 
        return 1
    }
    const vkRegistryAddress = args.vk_registry ? args.vk_registry: contractAddrs["VkRegistry"]
    // State tree depth
    const stateTreeDepth = args.state_tree_depth
    const intStateTreeDepth = args.int_state_tree_depth
    const msgTreeDepth = args.msg_tree_depth
    const voteOptionTreeDepth = args.vote_option_tree_depth
    const msgBatchDepth = args.msg_batch_depth

    const intCoeffTreeDepth = args.int_coeff_tree_depth
    const coeffTreeDepth = args.coeff_tree_depth

    const pmZkeyFile = path.resolve(args.process_messages_zkey)
    const tvZkeyFile = path.resolve(args.tally_votes_zkey)
    const cfZkeyFile = path.resolve(args.coeff_zkey)

    const processVk: VerifyingKey = VerifyingKey.fromObj(extractVk(pmZkeyFile))
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(extractVk(tvZkeyFile))
    const coeffVk: VerifyingKey = VerifyingKey.fromObj(extractVk(cfZkeyFile))

    if (!fs.existsSync(pmZkeyFile)) {
        console.error(`Error: ${pmZkeyFile} does not exist.`)
        return 1
    }
    if (!fs.existsSync(tvZkeyFile)) {
        console.error(`Error: ${tvZkeyFile} does not exist.`)
        return 1
    }
    if (!fs.existsSync(cfZkeyFile)) {
        console.error(`Error: ${cfZkeyFile} does not exist.`)
        return 1
    }

    // Simple validation
    if (
        stateTreeDepth < 1 ||
        intStateTreeDepth < 1 ||
        msgTreeDepth < 1 ||
        voteOptionTreeDepth < 1 ||
        msgBatchDepth < 1 ||
        intCoeffTreeDepth < 1 ||
        coeffTreeDepth < 1
    ) {
        console.error('Error: invalid depth or batch size parameters')
        return 1
    }

    if (stateTreeDepth < intStateTreeDepth) {
        console.error('Error: invalid state tree depth or intermediate state tree depth')
        return 1
    }

    // Check the pm zkey filename against specified params
    const pmMatch = pmZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)_/)
    if (pmMatch == null) {
        console.error(`Error: ${pmZkeyFile} has an invalid filename`)
        return 1
    }
    const pmStateTreeDepth = Number(pmMatch[1])
    const pmMsgTreeDepth = Number(pmMatch[2])
    const pmMsgBatchDepth = Number(pmMatch[3])
    const pmVoteOptionTreeDepth = Number(pmMatch[4])

    const tvMatch = tvZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)_/)
    if (tvMatch == null) {
        console.error(`Error: ${tvZkeyFile} has an invalid filename`)
        return 1
    }
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

    const messageBatchSize = 5 ** msgBatchDepth

    // Query the contract to see if the processVk has been set
    const processVkSig = genProcessVkSig(
        stateTreeDepth,
        msgTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
    )

    const isProcessVkSet = await vkRegistryContract.isProcessVkSet(
        processVkSig,
    )

    if (isProcessVkSet) {
        console.error('Error: this process verifying key is already set in the contract')
        return 1
    }

    // Query the contract to see if the tallyVk has been set
    const tallyVkSig = genTallyVkSig(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
    )

    const isTallyVkSet = await vkRegistryContract.isTallyVkSet(tallyVkSig)

    // Query the contract to see if the coeffVk has been set
    const coeffVkSig = genCoeffVkSig(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
        intCoeffTreeDepth,
        coeffTreeDepth
    )

    const isCoeffVkSet = await vkRegistryContract.isCoeffVkSet(coeffVkSig)


    if (isCoeffVkSet) {
        console.error('Error: this coeff calculation verifying key is already set in the contract')
        return 1
    }

    try {
        console.log('Setting verifying keys...')
        const tx = await vkRegistryContract.setVerifyingKeys(
            stateTreeDepth,
            intStateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            5 ** msgBatchDepth,
            intCoeffTreeDepth,
            coeffTreeDepth,
            processVk.asContractParam(),
            tallyVk.asContractParam(),
            coeffVk.asContractParam()
        )

        const receipt = await tx.wait()
        if (receipt.status !== 1) {
            console.error('Error: transaction failed')
        }

        console.log('Transaction hash:', tx.hash)

        const processVkOnChain = await vkRegistryContract.getProcessVk(
            stateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize,
        )

        const tallyVkOnChain = await vkRegistryContract.getTallyVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth,
        )

        const coeffVkOnChain = await vkRegistryContract.getCoeffVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth,
            intCoeffTreeDepth,
            coeffTreeDepth,
        )

        if (!compareVks(processVk, processVkOnChain)) {
            console.error('Error: processVk mismatch')
            return 1
        }
        if (!compareVks(tallyVk, tallyVkOnChain)) {
            console.error('Error: tallyVk mismatch')
            return 1
        }
        if (!compareVks(coeffVk, coeffVkOnChain)) {
            console.error('Error: coeffVk mismatch')
            return 1
        }

        return 0

    } catch (e) {
        console.error('Error: transaction failed')
        console.error(e.message)
        return 1
    }
}

const compareVks = (vk: VerifyingKey, vkOnChain: any): boolean => {
    let isEqual = vk.ic.length === vkOnChain.ic.length
    for (let i = 0; i < vk.ic.length; i ++) {
        isEqual = isEqual && vk.ic[i].x.toString() === vkOnChain.ic[i].x.toString()
        isEqual = isEqual && vk.ic[i].y.toString() === vkOnChain.ic[i].y.toString()
    }
    isEqual = isEqual && vk.alpha1.x.toString() === vkOnChain.alpha1.x.toString()
    isEqual = isEqual && vk.alpha1.y.toString() === vkOnChain.alpha1.y.toString()
    isEqual = isEqual && vk.beta2.x[0].toString() === vkOnChain.beta2.x[0].toString()
    isEqual = isEqual && vk.beta2.x[1].toString() === vkOnChain.beta2.x[1].toString()
    isEqual = isEqual && vk.beta2.y[0].toString() === vkOnChain.beta2.y[0].toString()
    isEqual = isEqual && vk.beta2.y[1].toString() === vkOnChain.beta2.y[1].toString()
    isEqual = isEqual && vk.delta2.x[0].toString() === vkOnChain.delta2.x[0].toString()
    isEqual = isEqual && vk.delta2.x[1].toString() === vkOnChain.delta2.x[1].toString()
    isEqual = isEqual && vk.delta2.y[0].toString() === vkOnChain.delta2.y[0].toString()
    isEqual = isEqual && vk.delta2.y[1].toString() === vkOnChain.delta2.y[1].toString()
    isEqual = isEqual && vk.gamma2.x[0].toString() === vkOnChain.gamma2.x[0].toString()
    isEqual = isEqual && vk.gamma2.x[1].toString() === vkOnChain.gamma2.x[1].toString()
    isEqual = isEqual && vk.gamma2.y[0].toString() === vkOnChain.gamma2.y[0].toString()
    isEqual = isEqual && vk.gamma2.y[1].toString() === vkOnChain.gamma2.y[1].toString()

    return isEqual
}

export {
    setVerifyingKeys,
    configureSubparser,
}
