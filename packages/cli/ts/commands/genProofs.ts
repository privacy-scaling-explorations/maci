import { type BigNumberish } from "ethers";
import { type CircuitInputs, type IJsonMaciState, MaciState } from "maci-core";
import { hash3, hashLeftRight, genTreeCommitment } from "maci-crypto";
import { Keypair, PrivKey } from "maci-domainobjs";
import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
  contractExists,
  genMaciStateFromContract,
} from "maci-sdk";
import { extractVk, genProofSnarkjs, genProofRapidSnark, verifyProof, type FullProveResult } from "maci-sdk";

import fs from "fs";
import path from "path";

import {
  asHex,
  banner,
  doesPathExist,
  info,
  logError,
  logGreen,
  logYellow,
  promptSensitiveValue,
  readContractAddress,
  success,
  type Proof,
  type TallyData,
  type GenProofsArgs,
} from "../utils";

/**
 * Generate proofs for the message processing and tally calculations
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param GenProofsArgs - The arguments for the genProofs command
 * @returns The tally data
 */
export const genProofs = async ({
  outputDir,
  tallyFile,
  tallyZkey,
  processZkey,
  pollId,
  rapidsnark,
  processWitgen,
  processDatFile,
  tallyWitgen,
  tallyDatFile,
  coordinatorPrivKey,
  maciAddress,
  transactionHash,
  processWasm,
  tallyWasm,
  useWasm,
  stateFile,
  startBlock,
  blocksPerBatch,
  endBlock,
  signer,
  ipfsMessageBackupFiles,
  useQuadraticVoting = true,
  quiet = true,
}: GenProofsArgs): Promise<TallyData> => {
  banner(quiet);

  // if we do not have the output directory just create it
  const isOutputDirExists = fs.existsSync(outputDir);

  if (!isOutputDirExists) {
    // Create the directory
    await fs.promises.mkdir(outputDir);
  }

  // differentiate whether we are using wasm or rapidsnark
  if (useWasm) {
    // if no rapidsnark then we assume we go with wasm
    // so we expect those arguments
    if (!processWasm) {
      logError("Please specify the process wasm file location");
    }

    if (!tallyWasm) {
      logError("Please specify the tally wasm file location");
    }

    const wasmResult = doesPathExist([processWasm!, tallyWasm!]);

    if (!wasmResult[0]) {
      logError(`Could not find ${wasmResult[1]}.`);
    }
  } else {
    if (!rapidsnark) {
      logError("Please specify the rapidsnark file location");
    }

    if (!processWitgen) {
      logError("Please specify the process witgen file location");
    }

    if (!tallyWitgen) {
      logError("Please specify the tally witgen file location");
    }

    const witgenResult = doesPathExist([rapidsnark!, processWitgen!, tallyWitgen!, processDatFile!, tallyDatFile!]);

    if (!witgenResult[0]) {
      logError(`Could not find ${witgenResult[1]}.`);
    }
  }

  // check if zkeys were provided
  const zkResult = doesPathExist([processZkey, tallyZkey]);

  if (!zkResult[0]) {
    logError(`Could not find ${zkResult[1]}.`);
  }

  // extract the rest of the verifying keys
  const processVk = await extractVk(processZkey);
  const tallyVk = await extractVk(tallyZkey);

  // the coordinator's MACI private key
  const privateKey = coordinatorPrivKey || (await promptSensitiveValue("Insert your MACI private key"));
  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    logError("Invalid MACI private key");
  }
  const maciPrivKey = PrivKey.deserialize(privateKey);
  const coordinatorKeypair = new Keypair(maciPrivKey);

  const network = await signer.provider?.getNetwork();

  // contracts
  const maciContractAddress = maciAddress || (await readContractAddress("MACI", network?.name));

  if (!maciContractAddress) {
    logError("MACI contract address is empty");
  }

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollContracts.poll))) {
    logError("Poll contract does not exist");
  }
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  // Check that the state and message trees have been merged
  if (!(await pollContract.stateMerged())) {
    logError("The state tree has not been merged yet. Please use the mergeSignups subcommand to do so.");
  }

  let maciState: MaciState | undefined;
  if (stateFile) {
    const content = JSON.parse(
      await fs.promises.readFile(stateFile).then((res) => res.toString()),
    ) as unknown as IJsonMaciState;
    const serializedPrivateKey = maciPrivKey.serialize();

    try {
      maciState = MaciState.fromJSON(content);

      maciState.polls.forEach((poll) => {
        poll.setCoordinatorKeypair(serializedPrivateKey);
      });
    } catch (error) {
      logError((error as Error).message);
    }
  } else {
    // build an off-chain representation of the MACI contract using data in the contract storage
    const [defaultStartBlockSignup, defaultStartBlockPoll, stateRoot, numSignups] = await Promise.all([
      maciContract.queryFilter(maciContract.filters.SignUp(), startBlock).then((events) => events[0]?.blockNumber ?? 0),
      maciContract
        .queryFilter(maciContract.filters.DeployPoll(), startBlock)
        .then((events) => events[0]?.blockNumber ?? 0),
      maciContract.getStateTreeRoot(),
      maciContract.numSignUps(),
    ]);
    const defaultStartBlock = Math.min(defaultStartBlockPoll, defaultStartBlockSignup);
    let fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

    const defaultEndBlock = await Promise.all([
      pollContract
        .queryFilter(pollContract.filters.MergeState(stateRoot, numSignups), fromBlock)
        .then((events) => events[events.length - 1]?.blockNumber),
    ]).then((blocks) => Math.max(...blocks));

    if (transactionHash) {
      const tx = await signer.provider!.getTransaction(transactionHash);
      fromBlock = tx?.blockNumber ?? defaultStartBlock;
    }

    logYellow(quiet, info(`starting to fetch logs from block ${fromBlock}`));
    maciState = await genMaciStateFromContract({
      provider: signer.provider!,
      address: await maciContract.getAddress(),
      coordinatorKeypair,
      pollId,
      fromBlock,
      blocksPerRequest: blocksPerBatch,
      endBlock: endBlock || defaultEndBlock,
      ipfsMessageBackupFiles,
    });
  }

  const poll = maciState!.polls.get(pollId)!;

  const processProofs: Proof[] = [];
  const tallyProofs: Proof[] = [];

  // time how long it takes
  const startTime = Date.now();

  logYellow(quiet, info(`Generating proofs of message processing...`));
  const { messageBatchSize } = poll.batchSizes;
  const numMessages = poll.messages.length;
  let totalMessageBatches = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize);
  if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
    totalMessageBatches += 1;
  }

  // while we have unprocessed messages, process them
  while (poll.hasUnprocessedMessages()) {
    // process messages in batches
    const circuitInputs = poll.processMessages(pollId, useQuadraticVoting, quiet) as unknown as CircuitInputs;

    try {
      // generate the proof for this batch
      let r: FullProveResult;
      if (useWasm === true || useWasm === undefined) {
        // eslint-disable-next-line no-await-in-loop
        r = await genProofSnarkjs({
          inputs: circuitInputs,
          zkeyPath: processZkey,
          wasmPath: processWasm,
        });
      } else {
        // eslint-disable-next-line no-await-in-loop
        r = await genProofRapidSnark({
          inputs: circuitInputs,
          zkeyPath: processZkey,
          rapidsnarkExePath: rapidsnark,
          witnessExePath: processWitgen,
          wasmPath: processWasm,
        });
      }

      // verify it
      // eslint-disable-next-line no-await-in-loop
      const isValid = await verifyProof(r.publicSignals, r.proof, processVk);
      if (!isValid) {
        throw new Error("Generated an invalid proof");
      }

      const thisProof = {
        circuitInputs,
        proof: r.proof,
        publicInputs: r.publicSignals,
      };
      // save the proof
      processProofs.push(thisProof);
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.writeFile(
        path.resolve(outputDir, `process_${poll.numBatchesProcessed - 1}.json`),
        JSON.stringify(thisProof, null, 4),
      );

      logYellow(quiet, info(`Progress: ${poll.numBatchesProcessed} / ${totalMessageBatches}`));
    } catch (error) {
      logError((error as Error).message);
    }
  }

  const endTime = Date.now();

  logYellow(quiet, info(`gen processMessage proof took ${(endTime - startTime) / 1000} seconds\n`));

  // tallying proofs
  logYellow(quiet, info(`Generating proofs of vote tallying...`));
  const tallyStartTime = Date.now();

  const { tallyBatchSize } = poll.batchSizes;
  const numStateLeaves = poll.pubKeys.length;
  let totalTallyBatches = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize);
  if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
    totalTallyBatches += 1;
  }

  let tallyCircuitInputs: CircuitInputs;
  // tally all ballots for this poll
  while (poll.hasUntalliedBallots()) {
    // tally votes in batches
    tallyCircuitInputs = useQuadraticVoting
      ? (poll.tallyVotes() as unknown as CircuitInputs)
      : (poll.tallyVotesNonQv() as unknown as CircuitInputs);

    try {
      // generate the proof
      let r: FullProveResult;
      if (useWasm === true || useWasm === undefined) {
        // eslint-disable-next-line no-await-in-loop
        r = await genProofSnarkjs({
          inputs: tallyCircuitInputs,
          zkeyPath: tallyZkey,
          wasmPath: tallyWasm,
        });
      } else {
        // eslint-disable-next-line no-await-in-loop
        r = await genProofRapidSnark({
          inputs: tallyCircuitInputs,
          zkeyPath: tallyZkey,
          rapidsnarkExePath: rapidsnark,
          witnessExePath: tallyWitgen,
          wasmPath: tallyWasm,
        });
      }

      // verify it
      // eslint-disable-next-line no-await-in-loop
      const isValid = await verifyProof(r.publicSignals, r.proof, tallyVk);

      if (!isValid) {
        logError("Generated an invalid tally proof");
      }

      const thisProof = {
        circuitInputs: tallyCircuitInputs,
        proof: r.proof,
        publicInputs: r.publicSignals,
      };

      // save it
      tallyProofs.push(thisProof);
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.writeFile(
        path.resolve(outputDir, `tally_${poll.numBatchesTallied - 1}.json`),
        JSON.stringify(thisProof, null, 4),
      );

      logYellow(quiet, info(`Progress: ${poll.numBatchesTallied} / ${totalTallyBatches}`));
    } catch (error) {
      logError((error as Error).message);
    }
  }

  // verify the results
  // Compute newResultsCommitment
  const newResultsCommitment = genTreeCommitment(
    poll.tallyResult,
    BigInt(asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish)),
    poll.treeDepths.voteOptionTreeDepth,
  );

  // compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hashLeftRight(
    poll.totalSpentVoiceCredits,
    BigInt(asHex(tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish)),
  );

  let newPerVOSpentVoiceCreditsCommitment: bigint | undefined;
  let newTallyCommitment: bigint;

  // create the tally file data to store for verification later
  const tallyFileData: TallyData = {
    maci: maciContractAddress,
    pollId: pollId.toString(),
    network: network?.name,
    chainId: network?.chainId.toString(),
    isQuadratic: useQuadraticVoting,
    tallyAddress: pollContracts.tally,
    newTallyCommitment: asHex(tallyCircuitInputs!.newTallyCommitment as BigNumberish),
    results: {
      tally: poll.tallyResult.map((x) => x.toString()),
      salt: asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish),
      commitment: asHex(newResultsCommitment),
    },
    totalSpentVoiceCredits: {
      spent: poll.totalSpentVoiceCredits.toString(),
      salt: asHex(tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish),
      commitment: asHex(newSpentVoiceCreditsCommitment),
    },
  };

  if (useQuadraticVoting) {
    // Compute newPerVOSpentVoiceCreditsCommitment
    newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
      poll.perVOSpentVoiceCredits,
      BigInt(asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish)),
      poll.treeDepths.voteOptionTreeDepth,
    );

    // Compute newTallyCommitment
    newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);

    // update perVOSpentVoiceCredits in the tally file data
    tallyFileData.perVOSpentVoiceCredits = {
      tally: poll.perVOSpentVoiceCredits.map((x) => x.toString()),
      salt: asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish),
      commitment: asHex(newPerVOSpentVoiceCreditsCommitment),
    };
  } else {
    newTallyCommitment = hashLeftRight(newResultsCommitment, newSpentVoiceCreditsCommitment);
  }

  await fs.promises.writeFile(tallyFile, JSON.stringify(tallyFileData, null, 4));

  logYellow(quiet, info(`Tally file:\n${JSON.stringify(tallyFileData, null, 4)}\n`));

  // compare the commitments
  if (asHex(newTallyCommitment) === tallyFileData.newTallyCommitment) {
    logGreen(quiet, success("The tally commitment is correct"));
  } else {
    logError("Error: the newTallyCommitment is invalid.");
  }

  const tallyEndTime = Date.now();

  logYellow(quiet, info(`gen tally proof took ${(tallyEndTime - tallyStartTime) / 1000} seconds\n`));

  return tallyFileData;
};
