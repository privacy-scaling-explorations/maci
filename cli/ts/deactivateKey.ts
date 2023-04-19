import { contractFilepath } from './config'

import {
    getDefaultSigner,
    parseArtifact,
} from 'maci-contracts'

import {
    PubKey,
    PrivKey,
    PCommand,
    Keypair,
} from 'maci-domainobjs'

import {
    genRandomSalt,
} from 'maci-crypto'

import {
    validateEthAddress,
    promptPwd,
    validateSaltFormat,
    validateSaltSize,
    ,
    contractExists,
} from './utils'

const { ethers } = require('hardhat')

import {readJSONFile} from 'maci-common'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const deactivateKeyParser = subparsers.addParser(
        'deactivateKey',
        { addHelp: true },
    )

    deactivateKeyParser.addArgument(
        ['-p', '--pubkey'],
        {
            required: true,
            type: 'string',
            help: 'This command will deactivate your current public key.',
        }
    )

    deactivateKeyParser.addArgument(
        ['-i', '--state-index'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The user\'s state index',
        }
    )

    deactivateKeyParser.addArgument(
        ['-x', '--contract'],
        {
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    deactivateKeyParser.addArgument(
        ['-n', '--nonce'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The message nonce',
        }
    )

    deactivateKeyParser.addArgument(
        ['-s', '--salt'],
        {
            action: 'store',
            type: 'string',
            help: 'The message salt',
        }
    )

    const maciPrivkeyGroup = deactivateKeyParser.addMutuallyExclusiveGroup({ required: true })

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

}

const deactivateKey = async (args: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // User's MACI public key
    if (!PubKey.isValidSerializedPubKey(args.pubkey)) {
        console.error('Error: invalid MACI public key')
        return 1
    }

    const userMaciPubKey = PubKey.unserialize(args.pubkey)

    // MACI contract address
    const contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs||!contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty') 
        return 1
    }
    const maciAddress = args.contract ? args.contract: contractAddrs["MACI"]

    // Verify that MACI contract exists
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return 1
    }

    // Ethereum provider
    // const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    // Verify user's MACI private key
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

    // State leaf index
    const stateIndex = BigInt(args.state_index)
    if (stateIndex < 0) {
        console.error('Error: the state index must be greater than 0')
        return 0
    }

    // Vote option index,
    // hardcoded to 0 for key deactivation command
    const voteOptionIndex = 0;

    // Command nonce
    const nonce = BigInt(args.nonce)

    // Command salt
    const DEFAULT_SALT = genRandomSalt()
    let salt = null;
    if (args.salt) {
        if (!validateSaltFormat(args.salt)) {
            console.error('Error: the salt should be a 32-byte hexadecimal string')
            return 0
        }

        salt = BigInt(args.salt)

        if (!validateSaltSize(args.salt)) {
            console.error('Error: the salt should less than the BabyJub field size')
            return 0
        }
    } else {
        salt = DEFAULT_SALT
    }

    // Verify poll ID
    const pollId = args.poll_id
    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

    // Get contract artifacts
    const [ maciContractAbi ] = parseArtifact('MACI')
    const [ pollContractAbi ] = parseArtifact('Poll')

    // === Process MACI contract ===

    // Verify that MACI contract address is deployed at the given address
    const signer = await getDefaultSigner()
    if (! (await contractExists(signer.provider, maciAddress))) {
        console.error('Error: there is no MACI contract deployed at the specified address')
        return 1
    }

    // Initialize MACI contract object
    const maciContractEthers = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer,
    )

    // === Process Poll contract ===

    // Verify that Poll contract address is deployed at the given address
    const pollAddr = await maciContractEthers.getPoll(pollId)
    if (! (await contractExists(signer.provider, pollAddr))) {
        console.error('Error: there is no Poll contract with this poll ID linked to the specified MACI contract.')
        return 1
    }

    // Initialize Poll contract object
    const pollContract = new ethers.Contract(
        pollAddr,
        pollContractAbi,
        signer,
    )

    // Fetch and process poll coordinator's public key
    const coordinatorPubKeyResult = await pollContract.coordinatorPubKey()
    const coordinatorPubKey = new PubKey([
        BigInt(coordinatorPubKeyResult.x.toString()),
        BigInt(coordinatorPubKeyResult.y.toString()),
    ])

    // Setting vote weight to hardcoded value 0 for key deactivation command
    const voteWeight = BigInt(0)

    // Create key deactivation command 
    const command: PCommand = new PCommand(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex, // 0
        voteWeight,      // 0
        nonce,
        pollId,
        salt,
    )

    // Create encrypted message
    const encKeypair = new Keypair()
    const signature = command.sign(userMaciPrivkey)
    const message = command.encrypt(
        signature,
        Keypair.genEcdhSharedKey(
            encKeypair.privKey,
            coordinatorPubKey,
        )
    )

    // Send transaction
    let tx = null;
    try {
        tx = await pollContract.deacticateKey(
            message.asContractParam(),
            encKeypair.pubKey.asContractParam(),
            { gasLimit: 10000000 },
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
    deactivateKey,
    configureSubparser,
}
