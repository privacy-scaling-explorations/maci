/* eslint-disable no-console */
import { Network } from "hardhat/types";
import { cleanThreads, extractVk, genProof, verifyProof } from "maci-circuits";
import { CircuitInputs, IJsonMaciState, MaciState, Poll } from "maci-core";
import { genTreeCommitment, hash3, hashLeftRight } from "maci-crypto";

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
import type { BigNumberish } from "ethers";
import type { IVkObjectParams } from "maci-domainobjs";

import { asHex } from "../../ts/utils";

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
    messageAq,
    pollId,
    maciPrivateKey,
    coordinatorKeypair,
    signer,
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
    const [defaultStartBlockSignup, defaultStartBlockPoll, { messageTreeDepth }, stateRoot, numSignups] =
      await Promise.all([
        maciContract
          .queryFilter(maciContract.filters.SignUp(), startBlock)
          .then((events) => events[0]?.blockNumber ?? 0),
        maciContract
          .queryFilter(maciContract.filters.DeployPoll(), startBlock)
          .then((events) => events[0]?.blockNumber ?? 0),
        pollContract.treeDepths(),
        maciContract.getStateTreeRoot(),
        maciContract.numSignUps(),
      ]);
    const defaultStartBlock = Math.min(defaultStartBlockPoll, defaultStartBlockSignup);
    let fromBlock = startBlock ? Number(startBlock) : defaultStartBlock;

    const messageRoot = await messageAq.getMainRoot(messageTreeDepth);
    const defaultEndBlock = await Promise.all([
      pollContract
        .queryFilter(pollContract.filters.MergeMessageAq(messageRoot), fromBlock)
        .then((events) => events[events.length - 1]?.blockNumber),
      pollContract
        .queryFilter(pollContract.filters.MergeMaciState(stateRoot, numSignups), fromBlock)
        .then((events) => events[events.length - 1]?.blockNumber),
    ]).then((blocks) => Math.max(...blocks));

    if (transactionHash) {
      const tx = await signer.provider!.getTransaction(transactionHash);
      fromBlock = tx?.blockNumber ?? defaultStartBlock;
    }

    console.log(`starting to fetch logs from block ${fromBlock}`);

    const maciContractAddress = await maciContract.getAddress();

    return import("../../ts/genMaciState").then(({ genMaciStateFromContract }) =>
      genMaciStateFromContract(
        signer.provider!,
        maciContractAddress,
        coordinatorKeypair,
        BigInt(pollId),
        fromBlock,
        blocksPerBatch,
        endBlock || defaultEndBlock,
      ),
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
  }

  /**
   * Generate message processing proofs
   *
   * @returns message processing proofs
   */
  async generateMpProofs(options?: IGenerateProofsOptions): Promise<Proof[]> {
    performance.mark("mp-proofs-start");

    console.log(`Generating proofs of message processing...`);
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

        console.log(`Progress: ${this.poll.numBatchesProcessed} / ${totalMessageBatches}`);
      }

      console.log("Wait until proof generation is finished");

      const processZkey = await extractVk(this.mp.zkey, false);

      const proofs = await Promise.all(
        inputs.map((circuitInputs, index) =>
          this.generateProofs(circuitInputs, this.mp, `process_${index}.json`, processZkey).then((data) => {
            options?.onBatchComplete?.({ current: index, total: totalMessageBatches, proofs: data });
            return data;
          }),
        ),
      ).then((data) => data.reduce((acc, x) => acc.concat(x), []));

      console.log("Proof generation is finished");

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
   * @param network - current network
   * @returns tally proofs
   */
  async generateTallyProofs(
    network: Network,
    options?: IGenerateProofsOptions,
  ): Promise<{ proofs: Proof[]; tallyData: TallyData }> {
    performance.mark("tally-proofs-start");

    console.log(`Generating proofs of vote tallying...`);
    const { tallyBatchSize } = this.poll.batchSizes;
    const numStateLeaves = this.poll.stateLeaves.length;
    let totalTallyBatches = numStateLeaves <= tallyBatchSize ? 1 : Math.floor(numStateLeaves / tallyBatchSize);
    if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
      totalTallyBatches += 1;
    }

    try {
      let tallyCircuitInputs: CircuitInputs;
      const inputs: CircuitInputs[] = [];

      while (this.poll.hasUntalliedBallots()) {
        tallyCircuitInputs = (this.useQuadraticVoting
          ? this.poll.tallyVotes()
          : this.poll.tallyVotesNonQv()) as unknown as CircuitInputs;

        inputs.push(tallyCircuitInputs);

        console.log(`Progress: ${this.poll.numBatchesTallied} / ${totalTallyBatches}`);
      }

      console.log("Wait until proof generation is finished");

      const tallyVk = await extractVk(this.tally.zkey, false);

      const proofs = await Promise.all(
        inputs.map((circuitInputs, index) =>
          this.generateProofs(circuitInputs, this.tally, `tally_${index}.json`, tallyVk).then((data) => {
            options?.onBatchComplete?.({ current: index, total: totalTallyBatches, proofs: data });
            return data;
          }),
        ),
      ).then((data) => data.reduce((acc, x) => acc.concat(x), []));

      console.log("Proof generation is finished");

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
        network: network.name,
        chainId: network.config.chainId?.toString(),
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

      console.log(`Tally file:\n${JSON.stringify(tallyFileData, null, 4)}\n`);

      // compare the commitments
      if (asHex(newTallyCommitment) === tallyFileData.newTallyCommitment) {
        console.log("The tally commitment is correct");
      } else {
        throw new Error("Error: the newTallyCommitment is invalid.");
      }

      performance.mark("tally-proofs-end");
      performance.measure("Generate tally proofs", "tally-proofs-start", "tally-proofs-end");

      options?.onComplete?.(proofs, tallyFileData);

      return { proofs, tallyData: tallyFileData };
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

    const { proof, publicSignals } = await genProof({
      inputs: circuitInputs,
      useWasm: Boolean(circuitFiles.wasm),
      zkeyPath: circuitFiles.zkey,
      rapidsnarkExePath: this.rapidsnark,
      witnessExePath: circuitFiles.witgen,
      wasmPath: circuitFiles.wasm,
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
