/* eslint-disable no-console, no-await-in-loop */
import { G1Point, G2Point, hashLeftRight } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct, Proof } from "../../ts/types";
import type {
  AccQueue,
  MACI,
  MessageProcessor,
  Poll,
  Subsidy,
  Tally,
  TallyNonQv,
  Verifier,
  VkRegistry,
} from "../../typechain-types";
import type { BigNumberish } from "ethers";

import { formatProofForVerifierContract, asHex } from "../../ts/utils";

import { STATE_TREE_ARITY } from "./constants";
import { IProverParams } from "./types";

/**
 * Prover class is designed to prove message processing, tally and subsidy (optional) proofs on-chain.
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
  private vkRegsitryContract: VkRegistry;

  /**
   * Verifier contract typechain wrapper
   */
  private verifierContract: Verifier;

  /**
   * Tally contract typechain wrapper
   */
  private tallyContract: Tally | TallyNonQv;

  /**
   * Subsidy contract typechain wrapper
   */
  private subsidyContract?: Subsidy;

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
    vkRegsitryContract,
    verifierContract,
    subsidyContract,
    tallyContract,
  }: IProverParams) {
    this.pollContract = pollContract;
    this.mpContract = mpContract;
    this.messageAqContract = messageAqContract;
    this.maciContract = maciContract;
    this.vkRegsitryContract = vkRegsitryContract;
    this.verifierContract = verifierContract;
    this.subsidyContract = subsidyContract;
    this.tallyContract = tallyContract;
  }

  /**
   * Prove message processing on-chain
   *
   * @param proofs - proofs
   */
  async proveMessageProcessing(proofs: Proof[]): Promise<void> {
    // retrieve the values we need from the smart contracts
    const [treeDepths, numSignUpsAndMessages, numBatchesProcessed, stateTreeDepth, dd, coordinatorPubKeyHash] =
      await Promise.all([
        this.pollContract.treeDepths(),
        this.pollContract.numSignUpsAndMessages(),
        this.mpContract.numBatchesProcessed().then(Number),
        this.maciContract.stateTreeDepth().then(Number),
        this.pollContract.getDeployTimeAndDuration(),
        this.pollContract.coordinatorPubKeyHash(),
      ]);

    const numSignUps = Number(numSignUpsAndMessages[0]);
    const numMessages = Number(numSignUpsAndMessages[1]);
    const messageBatchSize = STATE_TREE_ARITY ** Number(treeDepths[1]);
    let totalMessageBatches = numMessages <= messageBatchSize ? 1 : Math.floor(numMessages / messageBatchSize);
    let numberBatchesProcessed = numBatchesProcessed;

    if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
      totalMessageBatches += 1;
    }

    const [messageRootOnChain, onChainProcessVk] = await Promise.all([
      this.messageAqContract.getMainRoot(Number(treeDepths[2])),
      this.vkRegsitryContract.getProcessVk(
        stateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
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

      const coordPubKeyHashOnChain = BigInt(coordinatorPubKeyHash);
      const coordPubKeyHashOffChain = hashLeftRight(
        BigInt((circuitInputs.coordPubKey as BigNumberish[])[0]),
        BigInt((circuitInputs.coordPubKey as BigNumberish[])[1]),
      ).toString();

      if (coordPubKeyHashOffChain !== coordPubKeyHashOnChain.toString()) {
        throw new Error("coordPubKey mismatch.");
      }

      const packedValsOnChain = BigInt(
        await this.mpContract.genProcessMessagesPackedVals(
          currentMessageBatchIndex,
          numSignUps,
          numMessages,
          treeDepths.messageTreeSubDepth,
          treeDepths.voteOptionTreeDepth,
        ),
      ).toString();
      this.validatePackedValues(circuitInputs.packedVals as BigNumberish, packedValsOnChain);

      const formattedProof = formatProofForVerifierContract(proof);

      const publicInputHashOnChain = BigInt(
        await this.mpContract.genProcessMessagesPublicInputHash(
          currentMessageBatchIndex,
          messageRootOnChain.toString(),
          numSignUps,
          numMessages,
          circuitInputs.currentSbCommitment as BigNumberish,
          circuitInputs.newSbCommitment as BigNumberish,
          treeDepths.messageTreeSubDepth,
          treeDepths.voteOptionTreeDepth,
        ),
      );
      this.validatePublicInput(publicInputs[0] as BigNumberish, publicInputHashOnChain);

      const vk = new VerifyingKey(
        new G1Point(onChainProcessVk.alpha1[0], onChainProcessVk.alpha1[1]),
        new G2Point(onChainProcessVk.beta2[0], onChainProcessVk.beta2[1]),
        new G2Point(onChainProcessVk.gamma2[0], onChainProcessVk.gamma2[1]),
        new G2Point(onChainProcessVk.delta2[0], onChainProcessVk.delta2[1]),
        onChainProcessVk.ic.map(([x, y]) => new G1Point(x, y)),
      );

      // verify the proof onchain using the verifier contract

      const isValidOnChain = await this.verifierContract.verify(
        formattedProof,
        vk.asContractParam() as IVerifyingKeyStruct,
        publicInputHashOnChain.toString(),
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
   * Prove subsidy on-chain
   *
   * @param proofs - subsidy proofs
   */
  async proveSubsidy(proofs: Proof[]): Promise<void> {
    if (!this.subsidyContract || proofs.length === 0) {
      return;
    }

    const [treeDepths, numSignUpsAndMessages, r, c] = await Promise.all([
      this.pollContract.treeDepths(),
      this.pollContract.numSignUpsAndMessages(),
      this.subsidyContract.rbi(),
      this.subsidyContract.cbi(),
    ]);

    const numSignUps = Number(numSignUpsAndMessages[0]);
    const subsidyBatchSize = STATE_TREE_ARITY ** Number(treeDepths.intStateTreeDepth);
    // subsidy calculations if any subsidy proofs are provided
    let cbi = Number(c);
    let rbi = Number(r);

    const num1DBatches = Math.ceil(numSignUps / subsidyBatchSize);
    let subsidyBatchNum = rbi * num1DBatches + cbi;
    const totalBatchNum = (num1DBatches * (num1DBatches + 1)) / 2;

    console.log(`number of subsidy batch processed: ${subsidyBatchNum}, numleaf=${numSignUps}`);

    // process all batches
    for (let i = subsidyBatchNum; i < totalBatchNum; i += 1) {
      if (i === 0) {
        await this.subsidyContract.updateSbCommitment().then((tx) => tx.wait());
      }

      const { proof, circuitInputs, publicInputs } = proofs[i];

      // ensure the commitment matches
      const subsidyCommitmentOnChain = await this.subsidyContract.subsidyCommitment();
      this.validateCommitment(circuitInputs.currentSubsidyCommitment as BigNumberish, subsidyCommitmentOnChain);

      const packedValsOnChain = BigInt(await this.subsidyContract.genSubsidyPackedVals(numSignUps));
      this.validatePackedValues(circuitInputs.packedVals as BigNumberish, packedValsOnChain);

      // ensure the state and ballot root commitment matches
      const currentSbCommitmentOnChain = await this.subsidyContract.sbCommitment();
      this.validateCommitment(circuitInputs.currentSbCommitment as BigNumberish, currentSbCommitmentOnChain);

      const publicInputHashOnChain = await this.subsidyContract.genSubsidyPublicInputHash(
        numSignUps,
        circuitInputs.newSubsidyCommitment as BigNumberish,
      );

      this.validatePublicInput(publicInputs[0] as BigNumberish, publicInputHashOnChain.toString());

      // format the proof so it can be verify on chain
      const formattedProof = formatProofForVerifierContract(proof);

      // verify the proof on chain and set the new subsidy commitment
      const receipt = await this.subsidyContract
        .updateSubsidy(circuitInputs.newSubsidyCommitment as BigNumberish, formattedProof)
        .then((tx) => tx.wait());

      if (receipt?.status !== 1) {
        throw new Error("updateSubsidy() failed.");
      }

      console.log(`Transaction hash: ${receipt.hash}`);
      console.log(`Progress: ${subsidyBatchNum + 1} / ${totalBatchNum}`);

      const [nrbi, ncbi] = await Promise.all([
        this.subsidyContract.rbi().then(Number),
        this.subsidyContract.cbi().then(Number),
      ]);

      rbi = nrbi;
      cbi = ncbi;
      subsidyBatchNum = rbi * num1DBatches + cbi;
    }

    if (subsidyBatchNum === totalBatchNum) {
      console.log("All subsidy calculation proofs have been submitted.");
    }
  }

  /**
   * Prove tally on-chain
   *
   * @param proofs tally proofs
   */
  async proveTally(proofs: Proof[]): Promise<void> {
    const [treeDepths, numSignUpsAndMessages, tallyBatchNumber] = await Promise.all([
      this.pollContract.treeDepths(),
      this.pollContract.numSignUpsAndMessages(),
      this.tallyContract.tallyBatchNum().then(Number),
    ]);

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

      const packedValsOnChain = BigInt(
        await this.tallyContract.genTallyVotesPackedVals(numSignUps, batchStartIndex, tallyBatchSize),
      );
      this.validatePackedValues(circuitInputs.packedVals as BigNumberish, packedValsOnChain);

      const currentSbCommitmentOnChain = await this.mpContract.sbCommitment();
      console.log(currentSbCommitmentOnChain, circuitInputs);
      this.validateCommitment(circuitInputs.sbCommitment as BigNumberish, currentSbCommitmentOnChain);

      const publicInputHashOnChain = await this.tallyContract.genTallyVotesPublicInputHash(
        numSignUps,
        batchStartIndex,
        tallyBatchSize,
        circuitInputs.newTallyCommitment as BigNumberish,
      );
      this.validatePublicInput(publicInputs[0] as BigNumberish, publicInputHashOnChain);

      // format the tally proof so it can be verified on chain
      const formattedProof = formatProofForVerifierContract(proof);

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
   * Validate packed values
   *
   * @param packedVals - off-chain packed values
   * @param packedValsOnChain - on-chain packed values
   * @throws error if packed values don't match
   */
  private validatePackedValues(packedVals: BigNumberish, packedValsOnChain: BigNumberish) {
    if (packedVals.toString() !== packedValsOnChain.toString()) {
      throw new Error("packedVals mismatch.");
    }
  }

  /**
   * Validate public input hash
   *
   * @param publicInputHash - off-chain public input hash
   * @param publicInputHashOnChain - on-chain public input hash
   * @throws error if public input hashes don't match
   */
  private validatePublicInput(publicInputHash: BigNumberish, publicInputHashOnChain: BigNumberish) {
    if (publicInputHashOnChain.toString() !== publicInputHash.toString()) {
      throw new Error("public input mismatch.");
    }
  }
}
