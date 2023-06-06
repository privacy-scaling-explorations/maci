const { ethers } = require('hardhat');
import { parseArtifact, getDefaultSigner } from 'maci-contracts';
import { readJSONFile } from 'maci-common';
import { contractExists, validateEthAddress } from './utils';
import { contractFilepath } from './config';
import { DEFAULT_ETH_PROVIDER } from './defaults';
import { elGamalEncryptBit } from '../../crypto/ts';
import * as assert from 'assert';

const configureSubparser = (subparsers: any) => {
	const createParser = subparsers.addParser('joinPoll', { addHelp: true });

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

	createParser.addArgument(['-ep', '--eth-provider'], {
		action: 'store',
		type: 'string',
		help: 'The Ethereum provider to use for listening to events',
	});

	createParser.addArgument(['-fb', '--from-block'], {
		action: 'store',
		type: 'int',
		help: 'The block number to start listening from',
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

	const pollIface = new ethers.utils.Interface(pollContractAbi);

	// Ethereum provider
	const ethProvider = args.eth_provider
		? args.eth_provider
		: DEFAULT_ETH_PROVIDER;

	// Block number to start listening from
	const fromBlock = args.from_block ? args.from_block : 0;

	const deactivationAttemptsLogs = await ethProvider.getLogs({
		// event AttemptKeyDeactivation(address indexed _sender, PubKey indexed _sendersPubKey);
		...pollContract.filters.AttemptKeyDeactivation(),
		fromBlock: fromBlock,
	});

	for (const log of deactivationAttemptsLogs) {
		assert(log != undefined);
		const event = pollIface.parseLog(log);
		const sendersPubKey = event.args._sendersPubKey;
		const elGamalEncryptedMessage = await elGamalEncryptBit(
			sendersPubKey,
			BigInt(0),
			BigInt(0)
		);

		await pollContract.confirmDeactivation(
			sendersPubKey,
			elGamalEncryptedMessage
		);
	}
};

export { confirmDeactivation, configureSubparser };
