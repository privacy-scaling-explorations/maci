const { ethers } = require('hardhat');
import { parseArtifact, getDefaultSigner, genMaciStateFromContract } from 'maci-contracts';
import { readJSONFile, promptPwd } from 'maci-common';
import { contractExists, validateEthAddress } from './utils';
import { contractFilepath } from './config';
import { DEFAULT_ETH_PROVIDER } from './defaults';
import { IncrementalQuinTree, elGamalEncryptBit } from '../../crypto/ts';
import * as assert from 'assert';
import { PubKey, DeactivatedKeyLeaf, Keypair, PrivKey} from 'maci-domainobjs';
import { hash5 } from 'maci-crypto';

const configureSubparser = (subparsers: any) => {
	const createParser = subparsers.addParser('confirmDeactivation', {
		addHelp: true,
	});

	createParser.addArgument(['-x', '--maci-address'], {
		action: 'store',
		type: 'string',
		required: true,
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
		// required: true, // TODO: Why required when default given bellow?
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
		// required: true, // TODO: Why required when default given bellow?
		help: 'The capacity of the subroot of the deactivated keys tree to be merged. Default: 1',
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

	// // Block number to start listening from
	// const fromBlock = args.from_block ? args.from_block : 0;

	// const deactivationAttemptsLogs = await ethProvider.getLogs({
	// 	// event AttemptKeyDeactivation(address indexed _sender, uint256 indexed _sendersPubKeyX, uint256 indexed _sendersPubKeyY);
	// 	...pollContract.filters.AttemptKeyDeactivation(),
	// 	fromBlock: fromBlock,
	// });

	// const coordinatorPubKey = await pollContract.coordinatorPubKey();
	// const batchSize = args.batch_size ? args.batch_size : 1;
	// const HASH_LENGTH = 5;
	// const zeroValue = BigInt(0);
	// const H0 = BigInt(
	// 	'8370432830353022751713833565135785980866757267633941821328460903436894336785'
	// );

	const batchSize = args.batch_size ? args.batch_size : 1;
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

	const { circuitInputs, deactivatedLeaves } = maciState.polls[pollId].processDeactivationMessages();
	const numBatches = Math.ceil(deactivatedLeaves.length / batchSize);

	for (let i = 0; i < numBatches; i++ ) {
		const batch = deactivatedLeaves.slice(batchSize * i, batchSize * (i + 1)).map(leaf => leaf.asArray());

		// TODO: Submit batch
		try {
			console.log('Batch', i+1);
			console.log(batch);
			console.log('Batch length:', batch.length);
			
			await pollContract.confirmDeactivation(
				batch, 
				batch.length,
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}


	/*
	const numSubTrees = Math.floor(deactivationAttemptsLogs.length / batchSize);
	const lastSubTree = deactivationAttemptsLogs.length % batchSize;

	for (let i = 0; i < numSubTrees; i++) {
		const subTree = new IncrementalQuinTree(batchSize, H0, HASH_LENGTH, hash5);
		let encryptedPublicKeys = [];

		for (let j = 0; j < batchSize; j++) {
			const log = deactivationAttemptsLogs[i * batchSize + j];
			assert(log != undefined);

			const event = pollIface.parseLog(log);

			const sendersPubKeyX = event.args._sendersPubKeyX;
			const sendersPubKeyY = event.args._sendersPubKeyY;
			const sendersRawPubKey = [sendersPubKeyX, sendersPubKeyY];
			const sendersPubKey = new PubKey(sendersRawPubKey);

			const salt = new Keypair().privKey.rawPrivKey;
			const mask = BigInt(Math.ceil(Math.random() * 1000));
			const status = BigInt(1);
			const [c1, c2] = elGamalEncryptBit(coordinatorPubKey, status, mask);

			const leaf = new DeactivatedKeyLeaf(sendersPubKey, c1, c2, salt).hash();
			subTree.insert(leaf);

			encryptedPublicKeys.push(sendersPubKey.asCircuitInputs());
		}

		try {
			await pollContract.confirmDeactivation(
				subTree.root,
				batchSize,
				encryptedPublicKeys
			);
		} catch (e) {
			console.error(e);
			return 1;
		}
	}

	// last sub tree
	if (lastSubTree > 0) {
		const subTree = new IncrementalQuinTree(batchSize, H0, HASH_LENGTH, hash5);
		let encryptedPublicKeys = [];

		for (let j = 0; j < lastSubTree; j++) {
			const log = deactivationAttemptsLogs[numSubTrees * batchSize + j];
			assert(log != undefined);

			const event = pollIface.parseLog(log);

			const sendersPubKeyX = event.args._sendersPubKeyX;
			const sendersPubKeyY = event.args._sendersPubKeyY;
			const sendersRawPubKey = [sendersPubKeyX, sendersPubKeyY];
			const sendersPubKey = new PubKey(sendersRawPubKey);

			const salt = new Keypair().privKey.rawPrivKey;
			const mask = BigInt(Math.ceil(Math.random() * 1000));
			const status = BigInt(1);
			const [c1, c2] = elGamalEncryptBit(coordinatorPubKey, status, mask);

			const leaf = new DeactivatedKeyLeaf(sendersPubKey, c1, c2, salt).hash();
			subTree.insert(leaf);

			encryptedPublicKeys.push(sendersPubKey.asCircuitInputs());
		}

		if (HASH_LENGTH - lastSubTree > 0) {
			// fill with zeros
			for (let k = 0; k < HASH_LENGTH - lastSubTree; k++) {
				subTree.insert(zeroValue);
				encryptedPublicKeys.push(
					new PubKey([zeroValue, zeroValue]).asCircuitInputs()
				);
			}
		}

		try {
			await pollContract.confirmDeactivation(
				subTree.root,
				lastSubTree,
				encryptedPublicKeys
			);
		} catch (e) {
			console.error(e);
			return 1;
		}
		*/
	// }

	return 0;
};

export { confirmDeactivation, configureSubparser };
