import * as ethers from 'ethers'
import * as fs from 'fs'

import {
    maciContractAbi,
    formatProofForVerifierContract,
} from 'maci-contracts'

import {
    genBatchUstProofAndPublicSignals,
    verifyBatchUstProof,
    getSignalByNameViaSym,
} from 'maci-circuits'

import {
    Keypair,
    PrivKey,
    PubKey,
    Message,
    Command,
} from 'maci-domainobjs'

import {
    delay,
    promptPwd,
    validateEthSk,
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'replayCsv',
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

    parser.addArgument(
        ['-x', '--contract'],
        {
            required: true,
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-c', '--csv-file'],
        {
            required: true,
            type: 'string',
            help: 'The CSV file with commands',
        }
    )
}

const replayCsv = async (args: any) => {
    // The coordinator's MACI private key
    // They may either enter it as a command-line option or via the
    // standard input
    let coordinatorPrivkey
    if (args.prompt_for_maci_privkey) {
        coordinatorPrivkey = await promptPwd('Coordinator\'s MACI private key')
    } else {
        coordinatorPrivkey = args.privkey
    }

    const unserialisedPrivkey = PrivKey.unserialize(coordinatorPrivkey)
    const coordinatorKeypair = new Keypair(unserialisedPrivkey)

    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    let ethSk
    // The coordinator's Ethereum private key
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

    const maciAddress = args.contract

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    // Check that the contract is ready to accept signups and messages.
    // This command does not support resuming
    const numMessages = Number(await maciContract.numMessages())
    const numSignUps = Number(await maciContract.numSignUps())

    if (numSignUps !== 0 && numMessages !== 0) {
        console.error('Error: the contract must have no signups or messages.')
        return
    }

    // Read the CSV file
    const csv = fs.readFileSync(args.csv_file).toString()

    // Parse the CSV file
    // 0. signer 1. stateIndex 2. nonce 3. voteOptionIndex 4. voteWeight
    const lines: string[][] = []
    for (const l of csv.split('\n').slice(1).map((x) => x.split(','))) {
        if (l.length === 5) {
            lines.push(l)
        }
    }
    const signers = (new Set(
        lines.map((x) => x[0])
    ))

    const keypairs = {}
    const sortedSigners = Array.from(signers)
    sortedSigners.sort()
    for (const signer in sortedSigners) {
        keypairs[Number(signer)] = new Keypair(
            new PrivKey(BigInt(signer))
        )
    }

    const encKeypair = new Keypair(new PrivKey(BigInt(5678)))

    const messages: Message[] = []
    for (const line of lines) {
        const keypair = keypairs[Number(line[0])]
        const signingPubKey = keypair.pubKey
        const stateIndex = BigInt(line[1])
        const nonce = BigInt(line[2])
        const voteOptionIndex = BigInt(line[3])
        const voteWeight = BigInt(line[4])
        const salt = BigInt(0)

        const command = new Command(
            stateIndex,
            signingPubKey,
            voteOptionIndex,
            voteWeight,
            nonce,
            salt,
        )
        const signature = command.sign(keypair.privKey)
        const message = command.encrypt(
            signature,
            Keypair.genEcdhSharedKey(
                encKeypair.privKey,
                coordinatorKeypair.pubKey,
            )
        )
        messages.push(message)
    }

    let i = 1
    for (const signer of sortedSigners) {
        console.log(`Signing up ${i} / ${sortedSigners.length}`)
        const pubKey = keypairs[signer].pubKey
        const voiceCreditBalance = 100
        const tx = await maciContract.signUp(
            pubKey.asContractParam(),
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            ethers.utils.defaultAbiCoder.encode(['uint256'], [voiceCreditBalance]),
            { gasLimit: 2000000 },
        )
        await tx.wait()
        i ++
    }

    i = 1
    for (const message of messages) {
        console.log(`Publishing message ${i} / ${messages.length}`)
        const encPubKey = encKeypair.pubKey

        const tx = await maciContract.publishMessage(
            message.asContractParam(),
            encPubKey.asContractParam(),
            { gasLimit: 1000000 }
        )

        await tx.wait()
        i ++
    }

    const stateRoot = await maciContract.getStateTreeRoot()
    const messageRoot = await maciContract.getMessageTreeRoot()
    console.log('state root:', BigInt(stateRoot).toString(16))
    console.log('message root:', BigInt(messageRoot).toString(16))
}

export {
    replayCsv,
    configureSubparser,
}
