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
    const numMessages = this.poll.messages.length;
    let totalMessageBatches = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize);

    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
      totalMessageBatches += 1;
    }

    try {
      const inputs: CircuitInputs[] = [];

      // while we have unprocessed messages, process them
      while (this.poll.hasUnprocessedMessages()) {
        // process messages in batches
        const circuitInputs = this.poll.processMessages(
          BigInt(this.poll.pollId),
          this.useQuadraticVoting,
        ) as unknown as CircuitInputs;

        // generate the proof for this batch
        inputs.push(circuitInputs);

        logMagenta({ text: info(`Progress: ${this.poll.numBatchesProcessed} / ${totalMessageBatches}`) });
      }

      logMagenta({ text: info("Wait until proof generation is finished") });

      const processZkey = await extractVk(this.mp.zkey, false);

      const proofs = await Promise.all(
        inputs.map((circuitInputs, index) =>
          this.generateProofs(circuitInputs, this.mp, `process_${index}.json`, processZkey).then((data) => {
            options?.onBatchComplete?.({ current: index, total: totalMessageBatches, proofs: data });
            return data;
          }),
        ),
      ).then((data) => data.reduce((acc, x) => acc.concat(x), []));

      logGreen({ text: success("Proof generation is finished") });

      // cleanup threads
      await cleanThreads();

      performance.mark("mp-proofs-end");
      performance.measure("Generate message processor proofs", "mp-proofs-start", "mp-proofs-end");

      options?.onComplete?.(proofs);

      return proofs;
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
    const numStateLeaves = this.poll.pollStateLeaves.length;
    let totalTallyBatches = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize);
    if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
      totalTallyBatches += 1;
    }

    try {
      let tallyCircuitInputs: CircuitInputs;
      const inputs: CircuitInputs[] = [];
      const proofs: Proof[] = [];

      while (this.poll.hasUntalliedBallots()) {
        const batchIndex = this.poll.numBatchesTallied;
        const proofPath = path.join(this.outputDir, `tally_${batchIndex}.json`);

        // Check if proof exists and incremental flag is set
        if (this.incremental && fs.existsSync(proofPath)) {
          try {
            const existingProof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
            proofs.push(existingProof);
            this.poll.numBatchesTallied += 1;
            continue;
          } catch (error) {
            logMagenta({ text: info(`Error reading existing proof at ${proofPath}, regenerating...`) });
          }
        }

        tallyCircuitInputs = (this.useQuadraticVoting
          ? this.poll.tallyVotes()
          : this.poll.tallyVotesNonQv()) as unknown as CircuitInputs;

        inputs.push(tallyCircuitInputs);

        logMagenta({ text: info(`Progress: ${this.poll.numBatchesTallied} / ${totalTallyBatches}`) });
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

      // verify the results
      // Compute newResultsCommitment
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
}
