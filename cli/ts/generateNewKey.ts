import {
    getDefaultSigner
} from 'maci-contracts'

import {
    PrivKey,
} from 'maci-domainobjs'

import {
    genRandomSalt,
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

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser('generateNewKey', {
        addHelp: true,
    });

    const maciPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    parser.addArgument(
        ['-x', '--contract'],
        {
            type: 'string',
            help: 'The MACI contract address',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-oldPrivkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized old MACI private key',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-sk', '--oldPrivkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your old serialized MACI private key',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-newPrivkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized new MACI private key',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-sk', '--newPrivkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your new serialized MACI private key',
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
        ['-o', '--poll-id'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The Poll ID',
        }
    )

    parser.addArgument(
        ['-wpd', '--new-key-generation-witnessgen'],
        {
            required: true,
            type: 'string',
            help: 'The path to the NewKeyGenerationMessage witness generation binary',
        }
    )

    parser.addArgument(
        ['-zpd', '--new-kewy-generation-zkey'],
        {
            required: true,
            type: 'string',
            help: 'The path to the NewKeyGenerationMessage .zkey file',
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
        args.new_key_generation,
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
    let serializedOldPrivkey
    if (args.prompt_for_maci_oldPrivkey) {
        serializedOldPrivkey = await promptPwd('Your old MACI private key')
    } else {
        serializedOldPrivkey = args.oldPrivkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedOldPrivkey)) {
        console.error('Error: invalid old MACI private key')
        return 1
    }

    const userMaciOldPrivkey = PrivKey.unserialize(serializedOldPrivkey)

    // The user's new MACI private key
    let serializedNewPrivkey
    if (args.prompt_for_maci_newPrivkey) {
        serializedNewPrivkey = await promptPwd('Your new MACI private key')
    } else {
        serializedNewPrivkey = args.oldPrivkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedNewPrivkey)) {
        console.error('Error: invalid new MACI private key')
        return 1
    }

    const userMaciNewPrivkey = PrivKey.unserialize(serializedNewPrivkey)

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
    if (!(await contractExists(signer.provider, maciAddress))) {
        console.error('Error: there is no MACI contract deployed at the specified address')
        return 1
    }

    const pollId = args.poll_id

    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

    // TODO: add generateNewKey logic
}