const { ethers } = require('hardhat')
import {
    parseArtifact,
    deployVerifier,
    deployTally,
    deployContract,
    getDefaultSigner,
} from 'maci-contracts'

import {
    PubKey,
} from 'maci-domainobjs'

import {contractExists} from './utils'
import {readJSONFile, writeJSONFile} from 'maci-common'
import {contractFilepath} from './config'

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser(
        'deployPoll',
        { addHelp: true },
    )

    createParser.addArgument(
        ['-x', '--maci-address'],
        {
            action: 'store',
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    createParser.addArgument(
        ['-e', '--erc20-address'],
        {
            action: 'store',
            type: 'string',
            help: 'The topup credit contract address',
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
    let contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.maci_address) {
        console.error('Error: MACI contract address is empty') 
        return 1
    }

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

    const signer = await getDefaultSigner()

    const maciAddress = args.maci_address ? args.maci_address: contractAddrs["MACI"]
    if (!(await contractExists(signer.provider, maciAddress))) {
        console.error('Error: a MACI contract is not deployed at', maciAddress)
        return 1
    }

    // The coordinator's MACI public key
    const coordinatorPubkey = args.pubkey

    if (!PubKey.isValidSerializedPubKey(coordinatorPubkey)) {
        console.error('Error: invalid MACI public key')
        return {}
    }

    const unserialisedPubkey = PubKey.unserialize(coordinatorPubkey)

    // Deploy a MessageProcessor contract
    const verifierContract = await deployVerifier(true)
    console.log('Verifier:', verifierContract.address)
    const mpContract = await deployContract('MessageProcessor', true, verifierContract.address)
    await mpContract.deployTransaction.wait()

    const tallyContract = await deployTally(verifierContract.address, contractAddrs['PoseidonT3'],contractAddrs['PoseidonT4'],contractAddrs['PoseidonT5'],contractAddrs['PoseidonT6'])
    await tallyContract.deployTransaction.wait()

    const subsidyContract = await deployContract('Subsidy', true, verifierContract.address)
    await subsidyContract.deployTransaction.wait()

    const [ maciAbi ] = parseArtifact('MACI')
    const maciContract = new ethers.Contract(
        maciAddress,
        maciAbi,
        signer,
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
	    { gasLimit: 10000000 }
        )
        const receipt = await tx.wait()
        const iface = maciContract.interface
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        const name = log.name
        if (name !== 'DeployPoll') {
            console.error('Error: invalid event log.')
            return 1
        }
        const pollId = log.args._pollId
        const pollAddr = log.args._pollAddr
        console.log('Poll ID:', pollId.toString())
        console.log('Poll contract:', pollAddr)
        console.log('MessageProcessor contract:', mpContract.address)
        console.log('Tally contract:', tallyContract.address)
        console.log('Subsidy contract:', subsidyContract.address)
        contractAddrs['Verifier-' + pollId.toString()] = verifierContract.address
        contractAddrs['MessageProcessor-' + pollId.toString()] = mpContract.address
        contractAddrs['Tally-' + pollId.toString()] = tallyContract.address
        contractAddrs['Subsidy-' + pollId.toString()] = subsidyContract.address
        contractAddrs['Poll-' + pollId.toString()] = pollAddr
        writeJSONFile(contractFilepath, contractAddrs)

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
