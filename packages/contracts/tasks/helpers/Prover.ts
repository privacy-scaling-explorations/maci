/* eslint-disable no-console, no-await-in-loop */
import { STATE_TREE_ARITY } from "maci-core";
import { G1Point, G2Point, genTreeProof } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct, Proof } from "../../ts/types";
import type { MACI, MessageProcessor, Poll, Tally, Verifier, VkRegistry } from "../../typechain-types";
import type { BigNumberish } from "ethers";

import { asHex, formatProofForVerifierContract } from "../../ts/utils";

import { IProverParams, TallyData } from "./types";

/**
 * Prover class is designed to prove message processing and tally proofs on-chain.
 */
export class Prover {
  /**
   * Poll contract typechain wrapper
   */
  private pollContract: Poll;

  /**
   * MessageProcessor contract typechain wrapper
   */
  private mpContract: MessageProcessor;

  /**
   * MACI contract typechain wrapper
   */
  private maciContract: MACI;

  /**
   * VkRegistry contract typechain wrapper
   */
  private vkRegistryContract: VkRegistry;

  /**
   * Verifier contract typechain wrapper
   */
  private verifierContract: Verifier;

  /**
   * Tally contract typechain wrapper
   */
  private tallyContract: Tally;

  /**
   * Initialize class properties
   *
   * @param {IProverParams} params - constructor params
   */
  constructor({
    pollContract,
    mpContract,
    maciContract,
    vkRegistryContract,
    verifierContract,
    tallyContract,
  }: IProverParams) {
    this.pollContract = pollContract;
    this.mpContract = mpContract;
    this.maciContract = maciContract;
    this.vkRegistryContract = vkRegistryContract;
    this.verifierContract = verifierContract;
    this.tallyContract = tallyContract;
  }

  /**
   * Prove message processing on-chain
   *
   * @param proofs - proofs
   */
  async proveMessageProcessing(proofs: Proof[]): Promise<void> {
    // retrieve the values we need from the smart contracts
    const [
      treeDepths,
      messageBatchSize,
      numSignUpsAndMessages,
      numBatchesProcessed,
      stateTreeDepth,
      coordinatorPubKeyHash,
      mode,
      batchHashes,
      lastChainHash,
    ] = await Promise.all([
      this.pollContract.treeDepths(),
      this.pollContract.messageBatchSize().then(Number),
      this.pollContract.numSignUpsAndMessages(),
      this.mpContract.numBatchesProcessed().then(Number),
      this.maciContract.stateTreeDepth().then(Number),
      this.pollContract.coordinatorPubKeyHash(),
      this.mpContract.mode(),
      this.pollContract.getBatchHashes().then((res) => [...res]),
      this.pollContract.chainHash(),
    ]);

    const numMessages = Number(numSignUpsAndMessages[1]);
    const totalMessageBatches = batchHashes.length;
    let numberBatchesProcessed = numBatchesProcessed;

    const onChainProcessVk = await this.vkRegistryContract.getProcessVk(
      stateTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize,
      mode,
    );

    if (numberBatchesProcessed < totalMessageBatches) {
      console.log("Submitting proofs of message processing...");
    }

    // process all batches left
    for (let i = numberBatchesProcessed; i < totalMessageBatches; i += 1) {
      let currentMessageBatchIndex: number;

      if (numberBatchesProcessed === 0) {
        const chainHash = lastChainHash;

        if (numMessages % messageBatchSize !== 0) {
          batchHashes.push(chainHash);
        }

        currentMessageBatchIndex = batchHashes.length;

        if (currentMessageBatchIndex > 0) {
          currentMessageBatchIndex -= 1;
        }
      } else {
        currentMessageBatchIndex = (totalMessageBatches - numberBatchesProcessed) * messageBatchSize;
      }

      if (numberBatchesProcessed > 0 && currentMessageBatchIndex > 0) {
        currentMessageBatchIndex -= messageBatchSize;
      }

      const { proof, circuitInputs, publicInputs } = proofs[i];

      const inputBatchHash = batchHashes[currentMessageBatchIndex - 1];

      if (BigInt(circuitInputs.inputBatchHash as BigNumberish).toString() !== inputBatchHash.toString()) {
        throw new Error("input batch hash mismatch.");
      }

      const outputBatchHash = batchHashes[currentMessageBatchIndex];

      if (BigInt(circuitInputs.outputBatchHash as BigNumberish).toString() !== outputBatchHash.toString()) {
        throw new Error("output batch hash mismatch.");
      }

      let currentSbCommitmentOnChain: bigint;

      if (numberBatchesProcessed === 0) {
        currentSbCommitmentOnChain = BigInt(await this.pollContract.currentSbCommitment());
      } else {
        currentSbCommitmentOnChain = BigInt(await this.mpContract.sbCommitment());
      }

      this.validateCommitment(circuitInputs.currentSbCommitment as BigNumberish, currentSbCommitmentOnChain);

      if (circuitInputs.coordinatorPublicKeyHash.toString() !== coordinatorPubKeyHash.toString()) {
        throw new Error("coordPubKey mismatch.");
      }

      const formattedProof = formatProofForVerifierContract(proof);

      const publicInputsOnChain = await this.mpContract
        .getPublicCircuitInputs(
          currentMessageBatchIndex,
          asHex(circuitInputs.newSbCommitment as BigNumberish),
          outputBatchHash.toString(),
        )
        .then((value) => [...value]);
      this.validatePublicInput(publicInputs, publicInputsOnChain);

      const vk = new VerifyingKey(
        new G1Point(onChainProcessVk.alpha1[0], onChainProcessVk.alpha1[1]),
        new G2Point(onChainProcessVk.beta2[0], onChainProcessVk.beta2[1]),
        new G2Point(onChainProcessVk.gamma2[0], onChainProcessVk.gamma2[1]),
        new G2Point(onChainProcessVk.delta2[0], onChainProcessVk.delta2[1]),
        onChainProcessVk.ic.map(([x, y]) => new G1Point(x, y)),
      );

      // verify the proof on chain using the verifier contract
      const isValidOnChain = await this.verifierContract.verify(
        formattedProof,
        vk.asContractParam() as IVerifyingKeyStruct,
        [...publicInputsOnChain],
      );

      if (!isValidOnChain) {
        throw new Error("The verifier contract found the proof invalid.");
      }

      try {
        // validate process messaging proof and store the new state and ballot root commitment
        const receipt = await this.mpContract
          .processMessages(asHex(circuitInputs.newSbCommitment as BigNumberish), formattedProof)
          .then((tx) => tx.wait());

        if (receipt?.status !== 1) {
          throw new Error("processMessages() failed.");
        }

        console.log(`Transaction hash: ${receipt.hash}`);

        // Wait for the node to catch up

        numberBatchesProcessed = await this.mpContract.numBatchesProcessed().then(Number);

        console.log(`Progress: ${numberBatchesProcessed} / ${totalMessageBatches}`);
      } catch (err) {
        throw new Error(`processMessages() failed: ${(err as Error).message}`);
      }
    }

    if (numberBatchesProcessed === totalMessageBatches) {
      console.log("All message processing proofs have been submitted.");
    }
  }

  /**
   * Prove tally on-chain
   *
   * @param proofs tally proofs
   */
  async proveTally(proofs: Proof[]): Promise<void> {
    const [treeDepths, numSignUpsAndMessages, tallyBatchNumber, mode, stateTreeDepth] = await Promise.all([
      this.pollContract.treeDepths(),
      this.pollContract.numSignUpsAndMessages(),
      this.tallyContract.tallyBatchNum().then(Number),
      this.tallyContract.mode(),
      this.maciContract.stateTreeDepth().then(Number),
    ]);

    const onChainTallyVk = await this.vkRegistryContract.getTallyVk(
      stateTreeDepth,
      treeDepths.intStateTreeDepth,
      treeDepths.voteOptionTreeDepth,
      mode,
    );

    const numSignUps = Number(numSignUpsAndMessages[0]);
    const tallyBatchSize = STATE_TREE_ARITY ** Number(treeDepths.intStateTreeDepth);

    // vote tallying proofs
    const totalTallyBatches =
      numSignUps % tallyBatchSize === 0
        ? Math.floor(numSignUps / tallyBatchSize)
        : Math.floor(numSignUps / tallyBatchSize) + 1;

    let tallyBatchNum = tallyBatchNumber;

    if (tallyBatchNum < totalTallyBatches) {
      console.log("Submitting proofs of vote tallying...");
    }

    for (let i = tallyBatchNum; i < totalTallyBatches; i += 1) {
      if (i === 0) {
        await this.tallyContract.updateSbCommitment().then((tx) => tx.wait());
      }

      const batchStartIndex = i * tallyBatchSize;
      const { proof, circuitInputs, publicInputs } = proofs[i];

      const currentTallyCommitmentOnChain = await this.tallyContract.tallyCommitment();
      this.validateCommitment(circuitInputs.currentTallyCommitment as BigNumberish, currentTallyCommitmentOnChain);

      const currentSbCommitmentOnChain = await this.mpContract.sbCommitment();
      this.validateCommitment(circuitInputs.sbCommitment as BigNumberish, currentSbCommitmentOnChain);

      const publicInputsOnChain = await this.tallyContract.getPublicCircuitInputs(
        batchStartIndex,
        asHex(circuitInputs.newTallyCommitment as BigNumberish),
      );
      this.validatePublicInput(publicInputs, publicInputsOnChain);

      // format the tally proof so it can be verified on chain
      const formattedProof = formatProofForVerifierContract(proof);

      const vk = new VerifyingKey(
        new G1Point(onChainTallyVk.alpha1[0], onChainTallyVk.alpha1[1]),
        new G2Point(onChainTallyVk.beta2[0], onChainTallyVk.beta2[1]),
        new G2Point(onChainTallyVk.gamma2[0], onChainTallyVk.gamma2[1]),
        new G2Point(onChainTallyVk.delta2[0], onChainTallyVk.delta2[1]),
        onChainTallyVk.ic.map(([x, y]) => new G1Point(x, y)),
      );

      const isValidOnChain = await this.verifierContract.verify(
        formattedProof,
        vk.asContractParam() as IVerifyingKeyStruct,
        [...publicInputsOnChain],
      );

      if (!isValidOnChain) {
        throw new Error("The verifier contract found the proof invalid.");
      }

      // verify the proof on chain
      const receipt = await this.tallyContract
        .tallyVotes(asHex(circuitInputs.newTallyCommitment as BigNumberish), formattedProof)
        .then((tx) => tx.wait());

      if (receipt?.status !== 1) {
        throw new Error("tallyVotes() failed");
      }

      console.log(`Progress: ${tallyBatchNum + 1} / ${totalTallyBatches}`);
      console.log(`Transaction hash: ${receipt.hash}`);

      tallyBatchNum = Number(await this.tallyContract.tallyBatchNum());
    }

    if (tallyBatchNum === totalTallyBatches) {
      console.log("All vote tallying proofs have been submitted.");
    }
  }

  /**
   * Submit tally results on chain
   *
   * @param tallyData - tally data
   * @param recipients - number of recipients
   */
  async submitResults(tallyData: TallyData, recipients?: number): Promise<void> {
    console.log("Submitting results...");

    const tallyResults = tallyData.results.tally.map((t) => BigInt(t));
    const resultLength = recipients ?? tallyResults.length;

    // slice in case we are submitting partial results
    const partialResults = tallyResults.slice(0, resultLength);

    const [treeDepths] = await Promise.all([this.pollContract.treeDepths()]);

    const tallyResultProofs = partialResults.map((_, index) =>
      genTreeProof(index, tallyResults, Number(treeDepths.voteOptionTreeDepth)),
    );

    await this.tallyContract
      .addTallyResults({
        voteOptionIndices: partialResults.map((_, index) => index),
        tallyResults: partialResults,
        tallyResultProofs,
        totalSpent: tallyData.totalSpentVoiceCredits.spent,
        totalSpentSalt: tallyData.totalSpentVoiceCredits.salt,
        tallyResultSalt: tallyData.results.salt,
        newResultsCommitment: tallyData.results.commitment,
        spentVoiceCreditsHash: tallyData.totalSpentVoiceCredits.commitment,
        perVOSpentVoiceCreditsHash: tallyData.perVOSpentVoiceCredits?.commitment ?? 0n,
      })
      .then((tx) => tx.wait());

    console.log("Results have been submitted.");
  }

  /**
   * Validate commitment
   *
   * @param commitment - off-chain commitment
   * @param commitmentOnChain - on-chain commitment
   * @throws error if commitments don't match
   */
  private validateCommitment(currentSbCommitment: BigNumberish, currentSbCommitmentOnChain: BigNumberish) {
    if (currentSbCommitmentOnChain.toString() !== currentSbCommitment.toString()) {
      throw new Error("commitment mismatch");
    }
  }

  /**
   * Validate public input hash
   *
   * @param publicInputs - off-chain public input hash
   * @param publicInputsOnChain - on-chain public input hash
   * @throws error if public input hashes don't match
   */
  private validatePublicInput(publicInputs: BigNumberish[], publicInputsOnChain: BigNumberish[]) {
    if (!publicInputsOnChain.every((value, index) => value.toString() === publicInputs[index].toString())) {
      throw new Error("public input mismatch.");
    }
  }
}
