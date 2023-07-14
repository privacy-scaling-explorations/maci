import {
    getDefaultSigner
} from 'maci-contracts'

import {
    PrivKey,
    PubKey,
    KCommand
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
// TODO: check thi value
const H0 = BigInt('8370432830353022751713833565135785980866757267633941821328460903436894336785')
// TODO: check thi value
const DEACT_TREE_ARITY = 5;


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
        ['-p', '--newpubkey'],
        {
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s new public key in the state tree',
        }
    )

    parser.addArgument(
        ['-posk', '--prompt-for-maci-oldPrivkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized old MACI private key',
        }
    )

    parser.addArgument(
        ['-opk', '--oldPrivkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your old serialized MACI private key',
        }
    )

    parser.addArgument(
        ['-pnsk', '--prompt-for-maci-newPrivkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized new MACI private key',
        }
    )

    parser.addArgument(
        ['-npk', '--newPrivkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your new serialized MACI private key',
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
        ['-o', '--poll-id'],
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

    const userMaciNewPubKey = PubKey.unserialize(args.newpubkey)

    // c1 annd c2 represend status of previous key deactivation. Hardcoded for now. Should get it from event DeactivateKey
    const c1 = [BigInt(1), BigInt(1)];
    const c2 = [BigInt(2), BigInt(2)];
    // z represents random value we use for 
    const z = BigInt(42);

    // serialized or unserialized key?
    const [c1r, c2r] = elGamalRerandomize(
        args.newpubkey,
        z,
        c1,
        c2,
    );

    const nullifier = hash2([BigInt(args.oldPrivkey.asCircuitInputs()), salt]);

    const command: KCommand = new KCommand(
        args.newpubkey,
        voiceCreditBalance,
        nullifier,
        c1r,
        c2r,
        pollId,
    )

    return 0;
}

export {
    generateNewKey,
    configureSubparser,
}