const { ethers } = require('hardhat');
import { parseArtifact, getDefaultSigner, genMaciStateFromContract } from 'maci-contracts';
import { genProof, verifyProof, extractVk } from 'maci-circuits'
import { readJSONFile, promptPwd } from 'maci-common';
import { contractExists, validateEthAddress, isPathExist } from './utils';
import { Keypair, PrivKey } from 'maci-domainobjs';
import { contractFilepath } from './config';

const configureSubparser = (subparsers: any) => {
	const createParser = subparsers.addParser('completeDeactivation', {
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

	createParser.addArgument(['-snsq', '--state-num-sr-queue-ops'], {
		action: 'store',
		type: 'int',
		required: true,
		help: 'The number of subroot queue operations to merge for the MACI state tree',
	});

	createParser.addArgument(['-dnsq', '--deactivated-keys-num-sr-queue-ops'], {
		action: 'store',
		type: 'int',
		required: true,
		help: 'The number of subroot queue operations to merge for the deactivated keys tree',
	});

	createParser.addArgument(['-fb', '--from-block'], {
		action: 'store',
		type: 'int',
		required: true,
		help: 'The block number to start listening from',
	});

	createParser.addArgument(
        ['-wpd', '--process-deactivation-witnessgen'],
        {
            required: true,
            type: 'string',
            help: 'The path to the ProcessDeactivationMessages witness generation binary',
        }
    )

	createParser.addArgument(
        ['-zpd', '--process-zkey'],
        {
            required: true,
            type: 'string',
            help: 'The path to the ProcessDeactivationMessages .zkey file',
        }
    )

	createParser.addArgument(
        ['-r', '--rapidsnark'],
        {
            required: true,
            type: 'string',
            help: 'The path to the rapidsnark binary',
        }
    )
};

const completeDeactivation = async (args: any) => {
	const rapidsnarkExe = args.rapidsnark
    const processDeactivationDatFile = args.process_deactivation_witnessgen + ".dat"

	const [ok, path] = isPathExist([
        rapidsnarkExe,
        args.process_deactivation_witnessgen,
        processDeactivationDatFile,
        args.process_deactivation_zkey,
        ])
    if (!ok) {
        console.error(`Error: ${path} does not exist.`)
        return 1
    }

	// Extract the verifying keys
    const processVk = extractVk(args.process_zkey)

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

	// TODO: Check if state and deactivated keys trees are merged

	const { circuitInputs, deactivatedLeaves } = maciState.deactivatedKeysTree.processDeactivationMessages();
	
	let r
        try {
            r = genProof(
                circuitInputs,
                rapidsnarkExe,
                args.process_deactivation_witnessgen,
                args.process_deactivation_zkey,
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
            processVk,
        )

        if (!isValid) {
            console.error('Error: generated an invalid proof')
            return 1
        }
        
		const { proof } = r;

		// TODO: Submit proof to complete deactivation SC method
		// TODO: Verify proof in smart contract
		

	// const stateNumSrQueueOps = args.state_num_sr_queue_ops
	// 	? args.state_num_sr_queue_ops
	// 	: 0;

	// const deactivatedKeysNumSrQueueOps = args.deactivated_keys_num_sr_queue_ops
	// 	? args.deactivated_keys_num_sr_queue_ops
	// 	: 0;

	// 	// TODO: Merge deactivated keys tree
	// try {
	// 	await pollContract.completeDeactivation(
	// 		stateNumSrQueueOps,
	// 		deactivatedKeysNumSrQueueOps,
	// 		pollId
	// 	);
	// } catch (e) {
	// 	console.error(e);
	// 	return 1;
	}

	return 0;
};

export { completeDeactivation, configureSubparser };
