import { BaseContract, type BigNumberish } from "ethers";
import { extractVk, genProof, verifyProof } from "maci-circuits";
import {
  type MACI,
  type AccQueue,
  type Poll,
  genMaciStateFromContract,
  getDefaultSigner,
  parseArtifact,
} from "maci-contracts";
import { type CircuitInputs, type IJsonMaciState, MaciState } from "maci-core";
import { hash3, hashLeftRight, genTreeCommitment } from "maci-crypto";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";
import path from "path";

import type { ISnarkJSVerificationKey } from "../utils/interfaces";

import {
  DEFAULT_ETH_PROVIDER,
  asHex,
  banner,
  contractExists,
  doesPathExist,
  info,
  logError,
  logGreen,
  logYellow,
  promptSensitiveValue,
  readContractAddress,
  success,
} from "../utils";
import { Proof, TallyData } from "../utils/interfaces";

/**
 * Generate proofs for the message processing, tally and subsidy calculations
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param outputDir - the directory to store the proofs
 * @param tallyFile - the file to store the tally proof
 * @param tallyZkey - the path to the tally zkey file
 * @param processZkey - the path to the process zkey file
 * @param pollId - the id of the poll
 * @param subsidyFile - the file to store the subsidy proof
 * @param subsidyZkey - the path to the subsidy zkey file
 * @param rapidsnark - the path to the rapidsnark binary
 * @param processWitgen - the path to the process witnessgen binary
 * @param tallyWitgen - the path to the tally witnessgen binary
 * @param subsidyWitgen - the path to the subsidy witnessgen binary
 * @param coordinatorPrivKey - the coordinator's private key
 * @param maciAddress - the address of the MACI contract
 * @param transactionHash - the transaction hash of the first transaction
 * @param processWasm - the path to the process wasm file
 * @param tallyWasm - the path to the tally wasm file
 * @param subsidyWasm - the path to the subsidy wasm file
 * @param useWasm - whether to use wasm or rapidsnark
 * @param stateFile - the file with the serialized maci state
 * @param startBlock - the block number to start fetching logs from
 * @param blocksPerBatch - the number of blocks to fetch logs from
 * @param endBlock - the block number to stop fetching logs from
 * @param quiet - whether to log the output
 * @returns the tally data
 */
export const genProofs = async (
  outputDir: string,
  tallyFile: string,
  tallyZkey: string,
  processZkey: string,
  pollId: number,
  subsidyFile?: string,
  subsidyZkey?: string,
  rapidsnark?: string,
  processWitgen?: string,
  processDatFile?: string,
  tallyWitgen?: string,
  tallyDatFile?: string,
  subsidyWitgen?: string,
  subsidyDatFile?: string,
  coordinatorPrivKey?: string,
  maciAddress?: string,
  transactionHash?: string,
  processWasm?: string,
  tallyWasm?: string,
  subsidyWasm?: string,
  useWasm?: boolean,
  stateFile?: string,
  startBlock?: number,
  blocksPerBatch?: number,
  endBlock?: number,
  quiet = true,
): Promise<TallyData> => {
  banner(quiet);

  // if we do not have the output directory just create it
  if (!fs.existsSync(outputDir)) {
    // Create the directory
    fs.mkdirSync(outputDir);
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

  // the vk for the subsidy contract (optional)
  let subsidyVk: ISnarkJSVerificationKey;
  if (subsidyFile) {
    if (fs.existsSync(subsidyFile)) {
      logError(`${subsidyFile} exists. Please specify a different filepath.`);
    }

    if (!subsidyZkey) {
      logError("Please specify the subsidy zkey file location");
    }

    if (!subsidyWitgen) {
      logError("Please specify the subsidy witnessgen file location");
    }

    // we need different artifacts if using wasm or rapidsnark
    if (!useWasm) {
      if (!subsidyWitgen) {
        logError("Please specify the subsidy witnessgen file location");
      }

      const subsidyWitgenResult = doesPathExist([subsidyWitgen!, subsidyDatFile!]);

      if (!subsidyWitgenResult[0]) {
        logError(`Could not find ${subsidyWitgenResult[1]}.`);
      }
    } else {
      // we expect to have the wasm file
      if (!subsidyWasm) {
        logError("Please specify the subsidy wasm file location");
      }

      const subsidyWasmResult = doesPathExist([subsidyWasm!]);

      if (!subsidyWasmResult[0]) {
        logError(`Could not find ${subsidyWasmResult[1]}.`);
      }
    }

    // either way we check the subsidy zkey
    const subsidyZkeyResult = doesPathExist([subsidyZkey!]);

    if (!subsidyZkeyResult[0]) {
      logError(`Could not find ${subsidyZkeyResult[1]}.`);
    }

    subsidyVk = await extractVk(subsidyZkey!);
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

  const signer = await getDefaultSigner();
  // contracts
  if (!readContractAddress("MACI") && !maciAddress) {
    logError("MACI contract address is empty");
  }
  const maciContractAddress = maciAddress || readContractAddress("MACI");

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = new BaseContract(maciContractAddress, parseArtifact("MACI")[0], signer) as MACI;

  const pollAddr = await maciContract.polls(pollId);
  if (!(await contractExists(signer.provider!, pollAddr))) {
    logError("Poll contract does not exist");
  }
  const pollContract = new BaseContract(pollAddr, parseArtifact("Poll")[0], signer) as Poll;

  const extContracts = await pollContract.extContracts();
  const messageAqContractAddr = extContracts.messageAq;
  const messageAqContract = new BaseContract(messageAqContractAddr, parseArtifact("AccQueue")[0], signer) as AccQueue;

  // Check that the state and message trees have been merged for at least the first poll
  if (!(await pollContract.stateAqMerged()) && pollId.toString() === "0") {
    logError("The state tree has not been merged yet. Please use the mergeSignups subcommmand to do so.");
  }

  const messageTreeDepth = Number((await pollContract.treeDepths()).messageTreeDepth);

  // check that the main root is set
  const mainRoot = (await messageAqContract.getMainRoot(messageTreeDepth.toString())).toString();
  if (mainRoot === "0") {
    logError("The message tree has not been merged yet. Please use the mergeMessages subcommmand to do so.");
  }

  let maciState: MaciState | undefined;
  if (stateFile) {
    const content = JSON.parse(fs.readFileSync(stateFile).toString()) as unknown as IJsonMaciState;
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
    let fromBlock = startBlock ? Number(startBlock) : 0;
    if (transactionHash) {
      const tx = await signer.provider!.getTransaction(transactionHash);
      fromBlock = tx?.blockNumber ?? 0;
    }

    logYellow(quiet, info(`starting to fetch logs from block ${fromBlock}`));
    maciState = await genMaciStateFromContract(
      signer.provider!,
      await maciContract.getAddress(),
      coordinatorKeypair,
      pollId,
      fromBlock,
      blocksPerBatch,
      endBlock,
    );
  }

  const poll = maciState!.polls[pollId];

  const processProofs: Proof[] = [];
  const tallyProofs: Proof[] = [];
  const subsidyProofs: Proof[] = [];

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
    const circuitInputs = poll.processMessages(pollId) as unknown as CircuitInputs;
    try {
      // generate the proof for this batch
      // eslint-disable-next-line no-await-in-loop
      const r = await genProof({
        inputs: circuitInputs,
        zkeyPath: processZkey,
        useWasm,
        rapidsnarkExePath: rapidsnark,
        witnessExePath: processWitgen,
        wasmPath: processWasm,
      });
      // verify it
      // eslint-disable-next-line no-await-in-loop
      const isValid = await verifyProof(r.publicSignals, r.proof, processVk);
      if (!isValid) {
        logError("Error: generated an invalid proof");
      }

      const thisProof = {
        circuitInputs,
        proof: r.proof,
        publicInputs: r.publicSignals,
      };
      // save the proof
      processProofs.push(thisProof);
      fs.writeFileSync(
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

  // subsidy calculations are not mandatory
  if (subsidyFile) {
    const subsidyStartTime = Date.now();

    logYellow(quiet, info(`Generating proofs of subsidy calculation...`));

    const { subsidyBatchSize } = poll.batchSizes;
    const numLeaves = poll.stateLeaves.length;
    const totalSubsidyBatches = Math.ceil(numLeaves / subsidyBatchSize) ** 2;

    logYellow(
      quiet,
      info(`subsidyBatchSize=${subsidyBatchSize}, numLeaves=${numLeaves}, totalSubsidyBatch=${totalSubsidyBatches}`),
    );

    let numBatchesCalulated = 0;

    let subsidyCircuitInputs: CircuitInputs;
    // calculate the subsidy for each batch
    while (poll.hasUnfinishedSubsidyCalculation()) {
      // calculate subsidy in batches
      subsidyCircuitInputs = poll.subsidyPerBatch() as unknown as CircuitInputs;
      try {
        // generate proof for this batch
        // eslint-disable-next-line no-await-in-loop
        const r = await genProof({
          inputs: subsidyCircuitInputs,
          zkeyPath: subsidyZkey!,
          useWasm,
          rapidsnarkExePath: rapidsnark,
          witnessExePath: subsidyWitgen,
          wasmPath: subsidyWasm,
        });
        // check validity of it
        // eslint-disable-next-line no-await-in-loop
        const isValid = await verifyProof(r.publicSignals, r.proof, subsidyVk!);
        if (!isValid) {
          logError("Error: generated an invalid subsidy calc proof");
        }

        const thisProof = {
          circuitInputs: subsidyCircuitInputs,
          proof: r.proof,
          publicInputs: r.publicSignals,
        };
        subsidyProofs.push(thisProof);
        fs.writeFileSync(
          path.resolve(outputDir, `subsidy_${numBatchesCalulated}.json`),
          JSON.stringify(thisProof, null, 4),
        );
        numBatchesCalulated += 1;

        logYellow(quiet, info(`Progress: ${numBatchesCalulated} / ${totalSubsidyBatches}`));
      } catch (error) {
        logError((error as Error).message);
      }
    }

    const subsidyFileData = {
      provider: process.env.ETH_PROVIDER || DEFAULT_ETH_PROVIDER,
      maci: maciAddress,
      pollId,
      newSubsidyCommitment: asHex(subsidyCircuitInputs!.newSubsidyCommitment as BigNumberish),
      results: {
        subsidy: poll.subsidy.map((x) => x.toString()),
        salt: asHex(subsidyCircuitInputs!.newSubsidySalt as BigNumberish),
      },
    };

    // store it
    fs.writeFileSync(subsidyFile, JSON.stringify(subsidyFileData, null, 4));
    logYellow(quiet, info(`Subsidy file:\n${JSON.stringify(subsidyFileData, null, 4)}\n`));

    const susbsidyEndTime = Date.now();

    logYellow(quiet, info(`gen subsidy proof took ${(susbsidyEndTime - subsidyStartTime) / 1000} seconds\n`));
  }

  // tallying proofs
  logYellow(quiet, info(`Generating proofs of vote tallying...`));
  const tallyStartTime = Date.now();

  const { tallyBatchSize } = poll.batchSizes;
  const numStateLeaves = poll.stateLeaves.length;
  let totalTallyBatches = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize);
  if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
    totalTallyBatches += 1;
  }

  let tallyCircuitInputs: CircuitInputs;
  // tally all ballots for this poll
  while (poll.hasUntalliedBallots()) {
    // tally votes in batches
    tallyCircuitInputs = poll.tallyVotes() as unknown as CircuitInputs;

    try {
      // generate the proof
      // eslint-disable-next-line no-await-in-loop
      const r = await genProof({
        inputs: tallyCircuitInputs,
        zkeyPath: tallyZkey,
        useWasm,
        rapidsnarkExePath: rapidsnark,
        witnessExePath: tallyWitgen,
        wasmPath: tallyWasm,
      });

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
      fs.writeFileSync(
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

  // Compute newPerVOSpentVoiceCreditsCommitment
  const newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
    poll.perVOSpentVoiceCredits,
    BigInt(asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish)),
    poll.treeDepths.voteOptionTreeDepth,
  );

  // Compute newTallyCommitment
  const newTallyCommitment = hash3([
    newResultsCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  ]);

  // create the tally file data to store for verification later
  const tallyFileData: TallyData = {
    maci: maciAddress!,
    pollId,
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
    perVOSpentVoiceCredits: {
      tally: poll.perVOSpentVoiceCredits.map((x) => x.toString()),
      salt: asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish),
      commitment: asHex(newPerVOSpentVoiceCreditsCommitment),
    },
  };

  fs.writeFileSync(tallyFile, JSON.stringify(tallyFileData, null, 4));

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
