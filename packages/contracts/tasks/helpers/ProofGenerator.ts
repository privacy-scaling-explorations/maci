/* eslint-disable no-console */
import { CircuitInputs, IJsonMaciState, MaciState, Poll } from "@maci-protocol/core";
import { genTreeCommitment, hash3, hashLeftRight } from "@maci-protocol/crypto";

import fs from "fs";
import path from "path";

import type {
  ICircuitFiles,
  IGenerateProofsOptions,
  IPrepareStateParams,
  IProofGeneratorParams,
  TallyData,
} from "./types";
import type { Proof } from "../../ts/types";
import type { IVkObjectParams } from "@maci-protocol/domainobjs";
import type { BigNumberish } from "ethers";

import { logMagenta, info, logGreen, success } from "../../ts/logger";
import { extractVk, genProofSnarkjs, genProofRapidSnark, verifyProof } from "../../ts/proofs";
import { asHex, cleanThreads } from "../../ts/utils";

/**
 * Proof generator class for message processing and tally.
 */
export class ProofGenerator {
  /**
   * Current poll
   */
  private poll: Poll;

  /**
   * MACI contract address
   */
  private maciContractAddress: string;

  /**
   * Tally contract address
   */
  private tallyContractAddress: string;

  /**
   * The directory to store the proofs
   */
  private outputDir: string;

  /**
   * The file to store the tally proof
   */
  private tallyOutputFile: string;

  /**
   * Message processing circuit files
   */
  private mp: ICircuitFiles;

  /**
   * Tally circuit files
   */
  private tally: ICircuitFiles;

  /**
   * Whether to use quadratic voting or not
   */
  private useQuadraticVoting?: boolean;

  /**
   * Whether to use incremental proof generation
   */
  private incremental?: boolean;

  /**
   * Path to the rapidsnark binary
   */
  private rapidsnark?: string;

  /**
   * Whether to use incremental mode
   */
  private incremental?: boolean;

  /**
   * Get maci state from local file or from contract
   *
   * @param {IPrepareStateParams} params - params to prepare maci state
   * @returns {MaciState} maci state
   */
  static async prepareState({
    maciContract,
    pollContract,
    pollId,
    maciPrivateKey,
    coordinatorKeypair,
    signer,
    ipfsMessageBackupFiles,
    outputDir,
    options: { transactionHash, stateFile, startBlock, endBlock, blocksPerBatch },
  }: IPrepareStateParams): Promise<MaciState> {
    const isOutputDirExists = fs.existsSync(path.resolve(outputDir));

    if (!isOutputDirExists) {
      await fs.promises.mkdir(path.resolve(outputDir));
    }

    if (stateFile) {
      const content = await fs.promises
        .readFile(stateFile)
        .then((res) => JSON.parse(res.toString()) as unknown as IJsonMaciState);
      const serializedPrivateKey = maciPrivateKey.serialize();

      const maciState = MaciState.fromJSON(content);

      maciState.polls.forEach((poll) => {
        poll.setCoordinatorKeypair(serializedPrivateKey);
      });

      return maciState;
    }

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

    logMagenta({ text: info(`Starting to fetch logs from block ${fromBlock}`) });

    const maciContractAddress = await maciContract.getAddress();

    return import("../../ts/genMaciState").then(({ genMaciStateFromContract }) =>
      genMaciStateFromContract({
        provider: signer.provider!,
        address: maciContractAddress,
        coordinatorKeypair,
        pollId: BigInt(pollId),
        fromBlock,
        blocksPerRequest: blocksPerBatch,
        endBlock: endBlock || defaultEndBlock,
        ipfsMessageBackupFiles,
      }),
    );
  }

  /**
   * Initialize class properties
   *
   * @param {IProofGeneratorParams} params - initialization params
   */
  constructor({
    poll,
    mp,
    tally,
    rapidsnark,
    maciContractAddress,
    tallyContractAddress,
    outputDir,
    tallyOutputFile,
    useQuadraticVoting,
    incremental,
  }: IProofGeneratorParams) {
    this.poll = poll;
    this.maciContractAddress = maciContractAddress;
    this.tallyContractAddress = tallyContractAddress;
    this.outputDir = outputDir;
    this.tallyOutputFile = tallyOutputFile;
    this.mp = mp;
    this.tally = tally;
    this.rapidsnark = rapidsnark;
    this.useQuadraticVoting = useQuadraticVoting;
    this.incremental = incremental;
  }

  /**
   * Generate message processing proofs
   *
   * @returns message processing proofs
   */
  async generateMpProofs(options?: IGenerateProofsOptions): Promise<Proof[]> {
    logMagenta({ text: info(`Generating proofs of message processing...`) });
    performance.mark("mp-proofs-start");

    const { messageBatchSize } = this.poll.batchSizes;
    const numMessages: number = this.poll.messages.length;
    let totalMessageBatches: number = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize);
    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
      totalMessageBatches += 1;
    }

    try {
      let mpCircuitInputs: CircuitInputs;
      const inputs: CircuitInputs[] = [];
      const proofs: Proof[] = [];

      // while we have unprocessed messages, process them
      while (this.poll.hasUnprocessedMessages()) {
        const batchIndex = this.poll.numBatchesProcessed;
        const proofPath = path.join(this.outputDir, `process_${batchIndex}.json`);
        
        let shouldGenerateNewProof = true;

        // Check if proof exists and incremental flag is set
        if (this.incremental) {
          try {
            // Use a synchronous approach to avoid await in loop
            const exists = fs.existsSync(proofPath);
            if (exists) {
              // Read file synchronously to avoid await in loop
              const existingProof = JSON.parse(fs.readFileSync(proofPath, "utf8")) as Proof;
              proofs.push(existingProof);
              this.poll.numBatchesProcessed += 1;
              shouldGenerateNewProof = false;
            }
          } catch (error) {
            logMagenta({ text: info(`Error reading existing proof at ${proofPath}, regenerating...`) });
          }
        }

        if (shouldGenerateNewProof) {
          // process messages in batches with the incremental flag
          const circuitInputs = this.poll.processMessages(
            BigInt(this.poll.pollId),
            this.useQuadraticVoting,
            this.incremental
          );

          // generate the proof for this batch
          inputs.push(circuitInputs as unknown as CircuitInputs);

          logMagenta({ text: info(`Progress: ${this.poll.numBatchesProcessed} / ${totalMessageBatches}`) });
        }
      }

      logMagenta({ text: info("Wait until proof generation is finished") });

      const processZkey = await extractVk(this.mp.zkey, false);

      const newProofs = await Promise.all(
        inputs.map((circuitInputs, index) =>
          this.generateProofs(circuitInputs, this.mp, `process_${index}.json`, processZkey).then((data) => {
            options?.onBatchComplete?.({ current: index, total: totalMessageBatches, proofs: data });
            return data;
          }),
        ),
      ).then((data) => data.reduce((acc, x) => acc.concat(x), []));

      // Combine existing proofs with new ones
      const allProofs = [...proofs, ...newProofs];

      logGreen({ text: success("Proof generation is finished") });

      // cleanup threads
      await cleanThreads();

      performance.mark("mp-proofs-end");
      performance.measure("Generate message processor proofs", "mp-proofs-start", "mp-proofs-end");

      options?.onComplete?.(allProofs);

      return allProofs;
    } catch (error) {
      options?.onFail?.(error as Error);

      throw error;
    }
  }

  /**
   * Generate tally proofs
   *
   * @param networkName - current network name
   * @param chainId - current chain id
   * @returns tally proofs
   */
  async generateTallyProofs(
    networkName: string,
    chainId?: string,
    options?: IGenerateProofsOptions,
  ): Promise<{ proofs: Proof[]; tallyData: TallyData }> {
    logMagenta({ text: info(`Generating proofs of vote tallying...`) });
    performance.mark("tally-proofs-start");

    const { tallyBatchSize } = this.poll.batchSizes;
    const numStateLeaves: number = this.poll.pollStateLeaves.length;
    let totalTallyBatches: number = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize);
    if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
      totalTallyBatches += 1;
    }

    try {
      let tallyCircuitInputs: CircuitInputs | undefined;
      const inputs: CircuitInputs[] = [];
      const proofs: Proof[] = [];

      // Load existing salts if in incremental mode
      if (this.incremental) {
        await this.loadSalts();
      }

      while (this.poll.hasUntalliedBallots()) {
        const batchIndex = this.poll.numBatchesTallied;
        const proofPath = path.join(this.outputDir, `tally_${batchIndex}.json`);

        let shouldGenerateNewProof = true;

        // Check if proof exists and incremental flag is set
        if (this.incremental) {
          try {
            // Use a synchronous approach to avoid await in loop
            const exists = fs.existsSync(proofPath);
            if (exists) {
              // Read file synchronously to avoid await in loop
              const existingProof = JSON.parse(fs.readFileSync(proofPath, "utf8")) as Proof;
              proofs.push(existingProof);
              this.poll.numBatchesTallied += 1;
              shouldGenerateNewProof = false;
            }
          } catch (error) {
            logMagenta({ text: info(`Error reading existing proof at ${proofPath}, regenerating...`) });
          }
        }

        if (shouldGenerateNewProof) {
          // Use the updated interface with the incremental flag
          const circuitInputs = this.useQuadraticVoting
            ? this.poll.tallyVotes(this.incremental)
            : this.poll.tallyVotesNonQv();

          tallyCircuitInputs = circuitInputs as unknown as CircuitInputs;
          inputs.push(tallyCircuitInputs);

          logMagenta({ text: info(`Progress: ${this.poll.numBatchesTallied} / ${totalTallyBatches}`) });
        }
      }

      // Make sure we have at least one set of circuit inputs for validation
      if (!tallyCircuitInputs && inputs.length > 0) {
        tallyCircuitInputs = inputs[inputs.length - 1];
      }

      logMagenta({ text: info("Wait until proof generation is finished") });

      const tallyVk = await extractVk(this.tally.zkey, false);

      const newProofs = await Promise.all(
        inputs.map((circuitInputs, index) =>
          this.generateProofs(circuitInputs, this.tally, `tally_${index}.json`, tallyVk).then((data) => {
            options?.onBatchComplete?.({ current: index, total: totalTallyBatches, proofs: data });
            return data;
          }),
        ),
      ).then((data) => data.reduce((acc, x) => acc.concat(x), []));

      // Combine existing proofs with new ones
      const allProofs = [...proofs, ...newProofs];

      logGreen({ text: success("Proof generation is finished") });

      // cleanup threads
      await cleanThreads();

      // If no circuit inputs were generated (all from cache), we need to get the tally results from the Poll
      if (!tallyCircuitInputs) {
        const statePath = path.join(this.outputDir, `poll_state.json`);
        if (fs.existsSync(statePath)) {
          await this.poll.loadState(statePath);
        }
      }

      // For validation purposes, we need to compute the various commitments
      // The rest of the code remains the same
      const newResultsCommitment = genTreeCommitment(
        this.poll.tallyResult,
        BigInt(asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish)),
        this.poll.treeDepths.voteOptionTreeDepth,
      );

      // compute newSpentVoiceCreditsCommitment
      const newSpentVoiceCreditsCommitment = hashLeftRight(
        this.poll.totalSpentVoiceCredits,
        BigInt(asHex(tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish)),
      );

      let newPerVOSpentVoiceCreditsCommitment: bigint | undefined;
      let newTallyCommitment: bigint;

      // create the tally file data to store for verification later
      const tallyFileData: TallyData = {
        maci: this.maciContractAddress,
        pollId: this.poll.pollId.toString(),
        network: networkName,
        chainId,
        isQuadratic: Boolean(this.useQuadraticVoting),
        tallyAddress: this.tallyContractAddress,
        newTallyCommitment: asHex(tallyCircuitInputs!.newTallyCommitment as BigNumberish),
        results: {
          tally: this.poll.tallyResult.map((x) => x.toString()),
          salt: asHex(tallyCircuitInputs!.newResultsRootSalt as BigNumberish),
          commitment: asHex(newResultsCommitment),
        },
        totalSpentVoiceCredits: {
          spent: this.poll.totalSpentVoiceCredits.toString(),
          salt: asHex(tallyCircuitInputs!.newSpentVoiceCreditSubtotalSalt as BigNumberish),
          commitment: asHex(newSpentVoiceCreditsCommitment),
        },
      };

      if (this.useQuadraticVoting) {
        // Compute newPerVOSpentVoiceCreditsCommitment
        newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
          this.poll.perVOSpentVoiceCredits,
          BigInt(asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish)),
          this.poll.treeDepths.voteOptionTreeDepth,
        );

        // Compute newTallyCommitment
        newTallyCommitment = hash3([
          newResultsCommitment,
          newSpentVoiceCreditsCommitment,
          newPerVOSpentVoiceCreditsCommitment,
        ]);

        // update perVOSpentVoiceCredits in the tally file data
        tallyFileData.perVOSpentVoiceCredits = {
          tally: this.poll.perVOSpentVoiceCredits.map((x) => x.toString()),
          salt: asHex(tallyCircuitInputs!.newPerVOSpentVoiceCreditsRootSalt as BigNumberish),
          commitment: asHex(newPerVOSpentVoiceCreditsCommitment),
        };
      } else {
        newTallyCommitment = hashLeftRight(newResultsCommitment, newSpentVoiceCreditsCommitment);
      }

      await fs.promises.writeFile(this.tallyOutputFile, JSON.stringify(tallyFileData, null, 4));

      logGreen({ text: success(`Tally file:\n${JSON.stringify(tallyFileData, null, 4)}\n`) });

      // compare the commitments
      if (asHex(newTallyCommitment) === tallyFileData.newTallyCommitment) {
        logGreen({ text: success("The tally commitment is correct") });
      } else {
        throw new Error("Error: the newTallyCommitment is invalid.");
      }

      performance.mark("tally-proofs-end");
      performance.measure("Generate tally proofs", "tally-proofs-start", "tally-proofs-end");

      options?.onComplete?.(allProofs, tallyFileData);

      return { proofs: allProofs, tallyData: tallyFileData };
    } catch (error) {
      options?.onFail?.(error as Error);

      throw error;
    }
  }

  /**
   * Generic function for proofs generation
   *
   * @param {CircuitInputs} circuitInputs - circuit inputs
   * @param {ICircuitFiles} circuitFiles - circuit files (zkey, witgen, wasm)
   * @param outputFile - output file
   * @returns proofs
   */
  private async generateProofs(
    circuitInputs: CircuitInputs,
    circuitFiles: ICircuitFiles,
    outputFile: string,
    vk: IVkObjectParams,
  ): Promise<Proof[]> {
    const proofs: Proof[] = [];

    const { proof, publicSignals } = circuitFiles.wasm
      ? await genProofSnarkjs({
          inputs: circuitInputs,
          zkeyPath: circuitFiles.zkey,
          silent: true,
          wasmPath: circuitFiles.wasm,
        })
      : await genProofRapidSnark({
          inputs: circuitInputs,
          zkeyPath: circuitFiles.zkey,
          rapidsnarkExePath: this.rapidsnark,
          witnessExePath: circuitFiles.witgen,
        });

    // verify it
    // eslint-disable-next-line no-await-in-loop
    const isValid = await verifyProof(publicSignals, proof, vk, false);

    if (!isValid) {
      throw new Error("Error: generated an invalid proof");
    }

    proofs.push({
      circuitInputs,
      proof,
      publicInputs: publicSignals,
    });

    await fs.promises.writeFile(
      path.resolve(this.outputDir, outputFile),
      JSON.stringify(proofs[proofs.length - 1], null, 4),
    );

    return proofs;
  }

  /**
   * Generate a proof for processing messages
   * @param pollId - The ID of the poll
   * @param incremental - Whether to use incremental proof generation
   * @returns The proof for processing messages
   */
  async generateProcessMessagesProof(pollId: bigint, incremental = false): Promise<Proof> {
    const poll = this.poll as unknown as MaciState;
    const foundPoll = poll.polls.get(pollId);
    if (!foundPoll) {
      throw new Error(`Poll ${pollId} not found`);
    }

    // Load state if incremental mode is enabled
    if (incremental) {
      const statePath = path.join(this.outputDir, `poll_${pollId}_state.json`);
      if (fs.existsSync(statePath)) {
        await foundPoll.loadState(statePath);
      }
    }

    // Process messages
    foundPoll.processMessages(pollId, this.useQuadraticVoting, incremental);

    // Save state if incremental mode is enabled
    if (incremental) {
      const statePath = path.join(this.outputDir, `poll_${pollId}_state.json`);
      await foundPoll.saveState(statePath);
    }

    // Generate proof
    const proofPath = path.join(this.outputDir, `processMessages_${pollId}.json`);
    if (incremental && fs.existsSync(proofPath)) {
      const existingProof = JSON.parse(await fs.promises.readFile(proofPath, "utf8")) as Proof;
      return existingProof;
    }

    const circuitInputs = foundPoll.processMessages(pollId, this.useQuadraticVoting, incremental);
    const proofs = await this.generateProofs(
      circuitInputs as unknown as CircuitInputs, 
      this.mp, 
      `processMessages_${pollId}.json`, 
      await extractVk(this.mp.zkey, false)
    );
    const proof = proofs[0];
    await fs.promises.writeFile(proofPath, JSON.stringify(proof, null, 2));
    return proof;
  }

  /**
   * Generate a proof for tallying votes
   * @param pollId - The ID of the poll
   * @param incremental - Whether to use incremental proof generation
   * @returns The proof for tallying votes
   */
  async generateTallyProof(pollId: bigint, incremental = false): Promise<Proof> {
    const poll = this.poll as unknown as MaciState;
    const foundPoll = poll.polls.get(pollId);
    if (!foundPoll) {
      throw new Error(`Poll ${pollId} not found`);
    }

    // Load state if incremental mode is enabled
    if (incremental) {
      const statePath = path.join(this.outputDir, `poll_${pollId}_state.json`);
      if (fs.existsSync(statePath)) {
        await foundPoll.loadState(statePath);
      }
    }

    // Tally votes
    const circuitInputs = foundPoll.tallyVotes(incremental);

    // Save state if incremental mode is enabled
    if (incremental) {
      const statePath = path.join(this.outputDir, `poll_${pollId}_state.json`);
      await foundPoll.saveState(statePath);
    }

    // Generate proof
    const proofPath = path.join(this.outputDir, `tally_${pollId}.json`);
    if (incremental && fs.existsSync(proofPath)) {
      const existingProof = JSON.parse(await fs.promises.readFile(proofPath, "utf8")) as Proof;
      return existingProof;
    }

    const proofs = await this.generateProofs(
      circuitInputs as unknown as CircuitInputs, 
      this.tally, 
      `tally_${pollId}.json`, 
      await extractVk(this.tally.zkey, false)
    );
    const proof = proofs[0];
    await fs.promises.writeFile(proofPath, JSON.stringify(proof, null, 2));
    return proof;
  }
}
