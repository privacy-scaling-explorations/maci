import {
    maciContractAbi,
    parseArtifact,
} from 'maci-contracts'

import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

import {
    genRandomSalt,
} from 'maci-crypto'

import {
    promptPwd,
    validateEthSk,
    validateEthAddress,
    validateSaltSize,
    validateSaltFormat,
    contractExists,
    checkDeployerProviderConnection,
    batchTransactionRequests,
} from './utils'

import * as ethers from 'ethers'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const Web3 = require('web3')

const DEFAULT_SALT = genRandomSalt()

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'publish',
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

    parser.addArgument(
        ['-p', '--pubkey'],
        {
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s public key in the state tree',
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
        ['-i', '--state-index'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The user\'s state index',
        }
    )

    parser.addArgument(
        ['-v', '--vote-option-index'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The vote option index',
        }
    )

    parser.addArgument(
        ['-w', '--new-vote-weight'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The new vote weight',
        }
    )

    parser.addArgument(
        ['-n', '--nonce'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The message nonce',
        }
    )

    parser.addArgument(
        ['-s', '--salt'],
        {
            action: 'store',
            type: 'string',
            help: 'The message salt',
        }
    )

    parser.addArgument(
        ['-o', '--poll-id'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The Poll ID',
        }
    )
}

const publish = async (args: any) => {
    // User's MACI public key
    if (!PubKey.isValidSerializedPubKey(args.pubkey)) {
        console.error('Error: invalid MACI public key')
        return 1
    }

    const userMaciPubKey = PubKey.unserialize(args.pubkey)

    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return 1
    }

    const maciAddress = args.contract

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    let ethSk
    // The deployer's Ethereum private key
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
        return 1
    }

    // The user's MACI private key
    let serializedPrivkey
    if (args.prompt_for_maci_privkey) {
        serializedPrivkey = await promptPwd('Your MACI private key')
    } else {
        serializedPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedPrivkey)) {
        console.error('Error: invalid MACI private key')
        return 1
    }

    const userMaciPrivkey = PrivKey.unserialize(serializedPrivkey)
    
    // State index
    const stateIndex = BigInt(args.state_index)
    if (stateIndex < 0) {
        console.error('Error: the state index must be greater than 0')
        return
    }

    // Vote option index
    const voteOptionIndex = BigInt(args.vote_option_index)

    if (voteOptionIndex < 0) {
        console.error('Error: the vote option index should be 0 or greater')
        return
    }

    // The nonce
    const nonce = BigInt(args.nonce)

    if (nonce < 0) {
        console.error('Error: the nonce should be 0 or greater')
        return
    }

    // The salt
    let salt
    if (args.salt) {
        if (!validateSaltFormat(args.salt)) {
            console.error('Error: the salt should be a 32-byte hexadecimal string')
            return
        }

        salt = BigInt(args.salt)

        if (!validateSaltSize(args.salt)) {
            console.error('Error: the salt should less than the BabyJub field size')
            return
        }
    } else {
        salt = DEFAULT_SALT
    }

    if (! (await checkDeployerProviderConnection(ethSk, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return 1
    }

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no MACI contract deployed at the specified address')
        return 1
    }

    const pollId = args.poll_id

    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

    const wallet = new ethers.Wallet(ethSk, provider)
    const web3 = new Web3(ethProvider)
	const maciContract = new web3.eth.Contract(maciContractAbi, maciAddress)
	const maciContractEthers = new ethers.Contract(maciAddress, maciContractAbi, wallet)

    const pollAddr = await maciContractEthers.polls(pollId)
    if (! (await contractExists(provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    const [ pollContractAbi ] = parseArtifact('Poll')
    const pollContract = new web3.eth.Contract(pollContractAbi, pollAddr)

    /*
     * TODO: fix this
    const [maxValues, coordinatorPubKeyResult] = 
        await batchTransactionRequests(
            ethProvider,
            [
                pollContract.methods.maxValues(),
                pollContract.methods.coordinatorPubKey(),
            ],
            wallet.address
        )

    const a = await maxValues()
    */
    const maxValues = await pollContract.methods.maxValues().call()
    const coordinatorPubKeyResult = await pollContract.methods.coordinatorPubKey().call()
    const maxVoteOptions = Number(maxValues.maxVoteOptions)

    // Validate the vote option index against the max leaf index on-chain
    if (maxVoteOptions < voteOptionIndex) {
        console.error('Error: the vote option index is invalid')
        throw new Error()
    }

    const coordinatorPubKey = new PubKey([
        BigInt(coordinatorPubKeyResult.x.toString()),
        BigInt(coordinatorPubKeyResult.y.toString()),
    ])
    
    const pollContractEthers = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        wallet,
    )

    // The new vote weight
    const newVoteWeight = BigInt(args.new_vote_weight)

    const encKeypair = new Keypair()

    const command = new Command(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex,
        newVoteWeight,
        nonce,
        pollId,
        salt,
    )
    const signature = command.sign(userMaciPrivkey)
    const message = command.encrypt(
        signature,
        Keypair.genEcdhSharedKey(
            encKeypair.privKey,
            coordinatorPubKey,
        )
    )

    let tx
    try {
        tx = await pollContractEthers.publishMessage(
            message.asContractParam(),
            encKeypair.pubKey.asContractParam(),
            { gasLimit: 1000000 },
        )
        await tx.wait()

        console.log('Transaction hash:', tx.hash)
        console.log('Ephemeral private key:', encKeypair.privKey.serialize())
    } catch(e) {
        if (e.message) {
            if (e.message.endsWith('PollE03')) {
                console.error('Error: the voting period is over.')
            } else {
                console.error('Error: the transaction failed.')
                console.error(e.message)
            }
        }
        return 1
    }

    return 0
}

export {
    publish,
    configureSubparser,
}
