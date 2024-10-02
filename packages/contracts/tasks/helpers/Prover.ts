/* eslint-disable no-console, no-await-in-loop */
import { STATE_TREE_ARITY, MESSAGE_TREE_ARITY } from "maci-core";
import { G1Point, G2Point, genTreeProof } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct, Proof } from "../../ts/types";
import type { AccQueue, MACI, MessageProcessor, Poll, Tally, Verifier, VkRegistry } from "../../typechain-types";
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
   * AccQueue contract typechain wrapper (messages)
   */
  private messageAqContract: AccQueue;

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
    messageAqContract,
    maciContract,
    vkRegistryContract,
    verifierContract,
    tallyContract,
  }: IProverParams) {
    this.pollContract = pollContract;
    this.mpContract = mpContract;
    this.messageAqContract = messageAqContract;
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
    const [treeDepths, numSignUpsAndMessages, numBatchesProcessed, stateTreeDepth, dd, coordinatorPubKeyHash, mode] =
      await Promise.all([
        this.pollContract.treeDepths(),
        this.pollContract.numSignUpsAndMessages(),
        this.mpContract.numBatchesProcessed().then(Number),
        this.maciContract.stateTreeDepth().then(Number),
        this.pollContract.getDeployTimeAndDuration(),
        this.pollContract.coordinatorPubKeyHash(),
        this.mpContract.mode(),
      ]);

    const numMessages = Number(numSignUpsAndMessages[1]);
    const messageBatchSize = MESSAGE_TREE_ARITY ** Number(treeDepths[1]);
    let totalMessageBatches = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize);
    let numberBatchesProcessed = numBatchesProcessed;

    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
      totalMessageBatches += 1;
    }

    const [messageRootOnChain, onChainProcessVk] = await Promise.all([
      this.messageAqContract.getMainRoot(Number(treeDepths[2])),
      this.vkRegistryContract.getProcessVk(
        stateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        mode,
      ),
    ]);

    const pollEndTimestampOnChain = BigInt(dd[0]) + BigInt(dd[1]);

    if (numberBatchesProcessed < totalMessageBatches) {
      console.log("Submitting proofs of message processing...");
    }

    // process all batches left
    for (let i = numberBatchesProcessed; i < totalMessageBatches; i += 1) {
      let currentMessageBatchIndex: number;
      if (numberBatchesProcessed === 0) {
        const r = numMessages % messageBatchSize;

        currentMessageBatchIndex = numMessages;

        if (currentMessageBatchIndex > 0) {
          if (r === 0) {
            currentMessageBatchIndex -= messageBatchSize;
          } else {
            currentMessageBatchIndex -= r;
          }
        }
      } else {
        currentMessageBatchIndex = (totalMessageBatches - numberBatchesProcessed) * messageBatchSize;
      }

      if (numberBatchesProcessed > 0 && currentMessageBatchIndex > 0) {
        currentMessageBatchIndex -= messageBatchSize;
      }

      const { proof, circuitInputs, publicInputs } = proofs[i];

      // validation
      this.validatePollDuration(circuitInputs.pollEndTimestamp as BigNumberish, pollEndTimestampOnChain);
      this.validateMessageRoot(circuitInputs.msgRoot as BigNumberish, messageRootOnChain);

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

      const publicInputsOnChain = await this.mpContract.getPublicCircuitInputs(
        currentMessageBatchIndex,
        asHex(circuitInputs.newSbCommitment as BigNumberish),
      );
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
  async proveTally(proofs: Proof[], tallyData: TallyData): Promise<void> {
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
      console.log(currentSbCommitmentOnChain, circuitInputs);
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

    const tallyResults = tallyData.results.tally.map((t) => BigInt(t));
    const tallyResultProofs = tallyData.results.tally.map((_, index) =>
      genTreeProof(index, tallyResults, Number(treeDepths.voteOptionTreeDepth)),
    );

    await this.tallyContract
      .addTallyResults(
        tallyData.results.tally.map((_, index) => index),
        tallyResults,
        tallyResultProofs,
        tallyData.results.salt,
        tallyData.totalSpentVoiceCredits.commitment,
        tallyData.perVOSpentVoiceCredits?.commitment ?? 0n,
      )
      .then((tx) => tx.wait());
  }

  /**
   * Validate poll end timestamp
   *
   * @param pollEndTimestamp - off-chain poll end timestamp
   * @param pollEndTimestampOnChain - on-chain poll end timestamp
   * @throws error if timestamps don't match
   */
  private validatePollDuration(pollEndTimestamp: BigNumberish, pollEndTimestampOnChain: BigNumberish) {
    if (pollEndTimestamp.toString() !== pollEndTimestampOnChain.toString()) {
      throw new Error("poll end timestamp mismatch");
    }
  }

  /**
   * Validate message root
   *
   * @param messageRoot - off-chain message root
   * @param messageRootOnChain - on-chain message root
   * @throws error if roots don't match
   */
  private validateMessageRoot(messageRoot: BigNumberish, messageRootOnChain: BigNumberish) {
    if (BigInt(messageRoot).toString() !== messageRootOnChain.toString()) {
      throw new Error("message root mismatch");
    }
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
