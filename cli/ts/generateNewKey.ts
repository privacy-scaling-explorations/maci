import {
    getDefaultSigner,
    genMaciStateFromContract,
    formatProofForVerifierContract,
    parseArtifact
} from 'maci-contracts'

import {
    PrivKey,
    PubKey
} from 'maci-domainobjs'

import { genProof, verifyProof, extractVk } from 'maci-circuits'

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
import { ethers } from 'ethers'

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
        ['-n', '--new-pub-key'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s new public key in the state tree',
        }
    )


    parser.addArgument(
        ['-o', '--old-pub-key'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'The MACI public key which should replace the user\'s old public key in the state tree',
        }
    )

    parser.addArgument(
        ['-posk', '--prompt-for-maci-old-priv-key'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized old MACI private key',
        }
    )

    parser.addArgument(
        ['-opk', '--old-priv-key'],
        {
            action: 'store',
            required: true,
            type: 'string',
            help: 'Your old serialized MACI private key',
        }
    )

    parser.addArgument(
        ['-pcsk', '--prompt-for-maci-coord-priv-key'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for coordinators serialized MACI private key',
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
            help: 'The path to the NewKeyGenerationMessage witness generation binary',
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
        args.new_key_generation_zkey
        ])

    if (!ok) {
        console.error(`Error: ${path} does not exist.`)
        return 1
    }

    const newKeyGenerationVk = extractVk(args.new_key_generation_zkey)

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
    if (args.prompt_for_maci_old_priv_key) {
        serializedOldPrivKey = await promptPwd('Your old MACI private key')
    } else {
        serializedOldPrivKey = args.old_priv_key
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedOldPrivKey)) {
        console.error('Error: invalid old MACI private key')
        return 1
    }

    const userMaciOldPrivKey = PrivKey.unserialize(serializedOldPrivKey)

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

    const [maciContractAbi] = parseArtifact('MACI');
    const [pollContractAbi] = parseArtifact('Poll');
    const [mpContractAbi] = parseArtifact('MessageProcessor');

    const signer = await getDefaultSigner()
    if (!await contractExists(signer.provider, maciAddress)) {
        console.error('Error: there is no contract deployed at the specified address')
        return 0
    }

    // Initialize MACI contract object
	const maciContractEthers = new ethers.Contract(
		maciAddress,
		maciContractAbi,
		signer
	);

    const pollId = args.poll_id

    if (pollId < 0) {
        console.error('Error: the Poll ID should be a positive integer.')
        return 1
    }

	const pollAddr = await maciContractEthers.getPoll(pollId);
	if (!(await contractExists(signer.provider, pollAddr))) {
		console.error(
			'Error: there is no Poll contract with this poll ID linked to the specified MACI contract.'
		);
		return 1;
	}

	const pollContract = new ethers.Contract(pollAddr, pollContractAbi, signer);

    const mpAddress = contractAddrs['MessageProcessor-' + pollId];
	const mpContract = new ethers.Contract(mpAddress, mpContractAbi, signer);

    const userMaciNewPubKey = PubKey.unserialize(args.new_pub_key)
    const userMaciOldPubKey = PubKey.unserialize(args.old_pub_key)

    const coordinatorPubKeyResult = await pollContract.coordinatorPubKey();

    const coordinatorPubKey = new PubKey([
        BigInt(coordinatorPubKeyResult.x.toString()),
        BigInt(coordinatorPubKeyResult.y.toString()),
    ])

    // Reconstruct MACI state
    const maciState = await genMaciStateFromContract(
        signer.provider,
        maciAddress,
        null,
        pollId,
        fromBlock,
    )

    const { circuitInputs, encPubKey, message } = maciState.polls[pollId].generateCircuitInputsForGenerateNewKey(
        userMaciNewPubKey,
        userMaciOldPrivKey,
        userMaciOldPubKey,
        coordinatorPubKey,
        stateIndex,
        BigInt(salt),
        pollId
    )

    if (!circuitInputs) {
        console.error('Error: Could not prepare cirucit inputs.')
		return 1
    }

    let r
	try {
		r = genProof(
			circuitInputs,
			rapidsnarkExe,
			args.new_key_generation_witnessgen,
			args.new_key_generation_zkey,
		)
	} catch (e) {
		console.error('Error: could not generate proof.')
		console.error(e)
		return 1
	}

	// Verify the proof
	const isValid = verifyProof(
		r.publicInputs,
		r.proof,
		newKeyGenerationVk,
	)

	if (!isValid) {
		console.error('Error: generated an invalid proof')
		return 1
	}
	
	const { proof } = r;
	const formattedProof = formatProofForVerifierContract(proof);

    let tx = null;
    try {
        tx = await mpContract.generateNewKeyFromDeactivated(
            message.asContractParam(),
            coordinatorPubKey.asContractParam(),
            encPubKey.asContractParam(),
            pollContract.address,
            formattedProof
        )
        await tx.wait()

        console.log('generateNewKeyFromDeactivated Transaction hash:', tx.hash)
    } catch(e) {
        if (e.message) {
            console.error('Error: the transaction failed.')
            console.error(e.message)
        }
        return 1;
    }

    return 0;
}

export {
    generateNewKey,
    configureSubparser,
}
