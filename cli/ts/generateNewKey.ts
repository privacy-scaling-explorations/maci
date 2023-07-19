import {
    getDefaultSigner,
    genMaciStateFromContract
} from 'maci-contracts'

import {
    PrivKey,
    PubKey,
    KCommand,
    Keypair
} from 'maci-domainobjs'

import {
    genRandomSalt,
    elGamalRerandomize,
    hash2
} from 'maci-crypto'

import {
    promptPwd,
    validateEthAddress,
    validateSaltSize,
    validateSaltFormat,
    contractExists,
    isPathExist
} from './utils'

import { readJSONFile } from 'maci-common'
import { contractFilepath } from './config'

const DEFAULT_SALT = genRandomSalt()

// value taken from generateKeyFromDeactivated
const voiceCreditBalance = BigInt(100)

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser('generateNewKey', {
        addHelp: true,
    });

    parser.addArgument(
        ['-x', '--contract'],
        {
            action: 'store',
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    parser.addArgument(
        ['-n', '--newPubKey'],
        {
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s new public key in the state tree',
        }
    )

    parser.addArgument(
        ['-pnsk', '--prompt-for-maci-newPrivKey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized new MACI private key',
        }
    )

    parser.addArgument(
        ['-npk', '--newPrivKey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your new serialized MACI private key',
        }
    )

    parser.addArgument(
        ['-o', '--oldPubKey'],
        {
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s old public key in the state tree',
        }
    )

    parser.addArgument(
        ['-posk', '--prompt-for-maci-oldPrivKey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized old MACI private key',
        }
    )

    parser.addArgument(
        ['-opk', '--oldPrivKey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your old serialized MACI private key',
        }
    )

    parser.addArgument(
        ['-pcsk', '--prompt-for-maci-coordPrivKey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for coordinators serialized MACI private key',
        }
    )

    parser.addArgument(
        ['-cpk', '--coordPrivKey'],
        {
            action: 'store',
            type: 'string',
            help: 'Coordinators serialized MACI private key',
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
        ['-s', '--salt'],
        {
            action: 'store',
            type: 'string',
            help: 'The message salt',
        }
    )

    parser.addArgument(
        ['-po', '--poll-id'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The Poll ID',
        }
    )

    parser.addArgument(
        ['-fb', '--from-block'],
        {
            action: 'store',
            type: 'int',
            required: true,
            help: 'The block number to start listening from',
        }
    );

    parser.addArgument(
        ['-wpd', '--new-key-generation-witnessgen'],
        {
            required: true,
            type: 'string',
            help: 'The path to the NewKeyGenerationM-essage witness generation binary',
        }
    )

    parser.addArgument(
        ['-zpd', '--new-key-generation-zkey'],
        {
            required: true,
            type: 'string',
            help: 'The path to the NewKeyGenerationMessage .zkey file',
        }
    );

    parser.addArgument(
        ['-r', '--rapidsnark'],
        {
            required: true,
            type: 'string',
            help: 'The path to the rapidsnark binary',
        }
    );
};

const generateNewKey = async (args: any) => {
    const rapidsnarkExe = args.rapidsnark
    const newKeyGenerationDatFile = args.new_key_generation_witnessgen + ".dat"

    const [ok, path] = isPathExist([
        rapidsnarkExe,
        args.new_key_generation_witnessgen,
        newKeyGenerationDatFile,
        ])
    if (!ok) {
        console.error(`Error: ${path} does not exist.`)
        return 1
    }

    const contractAddrs = readJSONFile(contractFilepath)
    if ((!contractAddrs || !contractAddrs["MACI"]) && !args.contract) {
        console.error('Error: MACI contract address is empty')
        return 1
    }
    const maciAddress = args.contract ? args.contract : contractAddrs["MACI"]

    // MACI contract
    if (!validateEthAddress(maciAddress)) {
        console.error('Error: invalid MACI contract address')
        return 1
    }

    // The user's old MACI private key
    let serializedOldPrivKey
    if (args.prompt_for_maci_oldPrivKey) {
        serializedOldPrivKey = await promptPwd('Your old MACI private key')
    } else {
        serializedOldPrivKey = args.oldPrivKey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedOldPrivKey)) {
        console.error('Error: invalid old MACI private key')
        return 1
    }

    const userMaciOldPrivKey = PrivKey.unserialize(serializedOldPrivKey)

    // The user's new MACI private key
    let serializedNewPrivKey
    if (args.prompt_for_maci_newPrivKey) {
        serializedNewPrivKey = await promptPwd('Your new MACI private key')
    } else {
        serializedNewPrivKey = args.newPrivKey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedNewPrivKey)) {
        console.error('Error: invalid new MACI private key')
        return 1
    }

    const userMaciNewPrivKey = PrivKey.unserialize(serializedNewPrivKey)

    const fromBlock = args.from_block ? args.from_block : 0;

    // State index
    const stateIndex = BigInt(args.state_index)
    if (stateIndex < 0) {
        console.error('Error: the state index must be greater than 0')
        return 0
    }

    // The salt
    let salt
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

    const signer = await getDefaultSigner()
    if (!await contractExists(signer.provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return 0
    }

    const pollId = args.poll_id

    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

    const userMaciNewPubKey = PubKey.unserialize(args.newPubKey)
    const userMaciOldPubKey = PubKey.unserialize(args.oldpubkey)

    let serializedCoordPrivKey
    if (args.prompt_for_coord_privkey) {
        serializedCoordPrivKey = await promptPwd('Coordinators MACI private key')
    } else {
        serializedCoordPrivKey = args.coordPrivKey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedCoordPrivKey)) {
        console.error('Error: invalid coordinators MACI private key')
        return 1
    }

    const maciCoordPrivKey = PrivKey.unserialize(serializedCoordPrivKey)
    const coordinatorKeypair = new Keypair(maciCoordPrivKey)

    // get c1 and c2 from MaciState
    const c1 = [BigInt(1), BigInt(1)];
    const c2 = [BigInt(2), BigInt(2)];

    // z represents random value we use for c1 and c2 rerandomizing
    const z = BigInt(42);

    // serialized or unserialized key?
    const [c1r, c2r] = elGamalRerandomize(
        args.newPubKey,
        z,
        c1,
        c2,
    );

    const nullifier = hash2([BigInt(args.oldPrivkey.asCircuitInputs()), salt]);

    const command: KCommand = new KCommand(
        args.newPubKey,
        voiceCreditBalance,
        nullifier,
        c1r,
        c2r,
        pollId,
    )

    // Reconstruct MACI state
    const maciState = await genMaciStateFromContract(
        signer.provider,
        maciAddress,
        coordinatorKeypair,
        pollId,
        fromBlock,
    )

    const circomInputs = maciState.generateCircuitInputsForGenerateNewKey(
        command,
        userMaciOldPrivKey,
        userMaciOldPubKey,
        stateIndex,
        BigInt(salt),
        z
    )

    return 0;
}

export {
    generateNewKey,
    configureSubparser,
}