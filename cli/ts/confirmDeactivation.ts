const { ethers } = require('hardhat');
import { parseArtifact, getDefaultSigner, genMaciStateFromContract } from 'maci-contracts';
import { readJSONFile, promptPwd } from 'maci-common';
import { contractExists, validateEthAddress } from './utils';
import { contractFilepath } from './config';
import { Keypair, PrivKey} from 'maci-domainobjs';

const configureSubparser = (subparsers: any) => {
	const createParser = subparsers.addParser('confirmDeactivation', {
		addHelp: true,
	});

	createParser.addArgument(['-x', '--maci-address'], {
		action: 'store',
		type: 'string',
		help: 'The MACI contract address',
	});

	createParser.addArgument(['-pi', '--poll-id'], {
		action: 'store',
		type: 'int',
		required: true,
		help: 'The poll ID',
	});

	const maciPrivkeyGroup = createParser.addMutuallyExclusiveGroup({ required: true })

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

	createParser.addArgument(['-ep', '--eth-provider'], {
		action: 'store',
		type: 'string',
		help: 'The Ethereum provider to use for listening to events. Default: http://localhost:8545',
	});

	createParser.addArgument(['-fb', '--from-block'], {
		action: 'store',
		type: 'int',
		required: true,
		help: 'The block number to start listening from',
	});

	createParser.addArgument(['-bs', '--batch-size'], {
		action: 'store',
		type: 'int',
		help: 'The capacity of the subroot of the deactivated keys tree to be merged. Default: 1',
	});

	createParser.addArgument(['-sd', '--seed'], {
		action: 'store',
		type: 'int',
		help: 'Random generator seed value',
	});
};

const confirmDeactivation = async (args: any) => {
	// MACI contract address
	const contractAddrs = readJSONFile(contractFilepath);
	if ((!contractAddrs || !contractAddrs['MACI']) && !args.maci_address) {
		console.error('Error: MACI contract address is empty');
		return 1;
	}
	const maciAddress = args.maci_address
		? args.maci_address
		: contractAddrs['MACI'];

	// Verify that MACI contract exists
	if (!validateEthAddress(maciAddress)) {
		console.error('Error: invalid MACI contract address');
		return 1;
	}

	// Verify poll ID
	const pollId = args.poll_id;
	if (pollId < 0) {
		console.error('Error: the Poll ID should be a positive integer.');
		return 1;
	}

	// Get contract artifacts
	const [maciContractAbi] = parseArtifact('MACI');
	const [pollContractAbi] = parseArtifact('Poll');
	const [mpContractAbi] = parseArtifact('MessageProcessor');

	// Verify that MACI contract address is deployed at the given address
	const signer = await getDefaultSigner();
	if (!(await contractExists(signer.provider, maciAddress))) {
		console.error(
			'Error: there is no MACI contract deployed at the specified address'
		);
		return 1;
	}

	// Initialize MACI contract object
	const maciContractEthers = new ethers.Contract(
		maciAddress,
		maciContractAbi,
		signer
	);

	// Verify that Poll contract address is deployed at the given address
	const pollAddr = await maciContractEthers.getPoll(pollId);
	if (!(await contractExists(signer.provider, pollAddr))) {
		console.error(
			'Error: there is no Poll contract with this poll ID linked to the specified MACI contract.'
		);
		return 1;
	}

	// Initialize Poll contract object
	const pollContract = new ethers.Contract(pollAddr, pollContractAbi, signer);
	const batchSize = args.batch_size ? args.batch_size : 1;
	let serializedPrivkey;

    if (args.prompt_for_maci_privkey) {
        serializedPrivkey = await promptPwd('Your MACI private key')
    } else {
        serializedPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedPrivkey)) {
        console.error('Error: invalid MACI private key')
        return 1
    }

	const fromBlock = args.from_block ? args.from_block : 0;

	const maciPrivkey = PrivKey.unserialize(serializedPrivkey)
    const coordinatorKeypair = new Keypair(maciPrivkey)

	// Reconstruct MACI state
	const maciState = await genMaciStateFromContract(
        signer.provider,
        maciAddress,
        coordinatorKeypair,
        pollId,
        fromBlock,
    )

	// TODO: reschuffle - add mp param to command
	// const mpAddress = args.mp
	// 	? args.mp
	// 	: contractAddrs['MessageProcessor-' + pollId];

	const mpAddress = contractAddrs['MessageProcessor-' + pollId];

	const mpContract = new ethers.Contract(mpAddress, mpContractAbi, signer);

	const seed = args.seed ? BigInt(args.seed) : BigInt(42);
	const { circuitInputs, deactivatedLeaves } = maciState.polls[pollId].processDeactivationMessages(seed);
	const numBatches = Math.ceil(deactivatedLeaves.length / batchSize);

	for (let i = 0; i < numBatches; i++ ) {
		const batch = deactivatedLeaves
			.slice(batchSize * i, batchSize * (i + 1))
			.map(leaf => leaf.asArray());

		try {
			await mpContract.confirmDeactivation(
				batch, 
				batch.length,
				pollContract.address,
			);
		} catch (e) {
			console.error(e);
			return 1;
		}
	}

	return 0;
};

export { confirmDeactivation, configureSubparser };
