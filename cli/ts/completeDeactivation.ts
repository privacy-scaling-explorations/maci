const { ethers } = require('hardhat');
import { parseArtifact, getDefaultSigner } from 'maci-contracts';
import { readJSONFile } from 'maci-common';
import { contractExists, validateEthAddress } from './utils';
import { contractFilepath } from './config';

const configureSubparser = (subparsers: any) => {
	const createParser = subparsers.addParser('completeDeactivation', {
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

	createParser.addArgument(['-nsq', '--num-sr-queue-ops'], {
		action: 'store',
		type: 'int',
		help: 'The number of subroot queue operations to merge',
	});
};

const completeDeactivation = async (args: any) => {
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
	if (!pollId || pollId < 0) {
		console.error('Error: the Poll ID should be a positive integer.');
		return 1;
	}

	// Get contract artifacts
	const [maciContractAbi] = parseArtifact('MACI');
	const [pollContractAbi] = parseArtifact('Poll');

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

	const numSrQueueOps = args.num_sr_queue_ops ? args.num_sr_queue_ops : 0;

	try {
		await pollContract.completeDeactivation(numSrQueueOps, pollId);
	} catch (e) {
		console.error(e);
		return 1;
	}
};

export { completeDeactivation, configureSubparser };
