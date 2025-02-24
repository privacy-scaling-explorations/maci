/* eslint-disable no-await-in-loop */
import { type BigNumberish } from "ethers";
import { STATE_TREE_ARITY } from "maci-core";
import { G1Point, G2Point, genTreeProof } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";
import {
  MACI__factory as MACIFactory,
  Tally__factory as TallyFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Poll__factory as PollFactory,
  VkRegistry__factory as VkRegistryFactory,
  Verifier__factory as VerifierFactory,
  formatProofForVerifierContract,
  type IVerifyingKeyStruct,
  contractExists,
} from "maci-sdk";

import fs from "fs";
import path from "path";

import {
  asHex,
  banner,
  error,
  info,
  logError,
  logGreen,
  logRed,
  logYellow,
  readContractAddress,
  success,
  type TallyData,
  type Proof,
  type ProveOnChainArgs,
} from "../utils";

/**
 * Command to prove the result of a poll on-chain
 * @param ProveOnChainArgs - The arguments for the proveOnChain command
 */
export const proveOnChain = async ({
  pollId,
  proofDir,
  maciAddress,
  tallyFile,
  signer,
  quiet = true,
}: ProveOnChainArgs): Promise<void> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  const maciContractAddress = maciAddress || (await readContractAddress("MACI", network?.name));

  // check existence of contract addresses
  if (!maciContractAddress) {
    logError("MACI contract address is empty");
  }

  // check contracts are deployed on chain
  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollContracts.poll))) {
    logError("There is no Poll contract with this poll ID linked to the specified MACI contract.");
  }

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const mpContract = MessageProcessorFactory.connect(pollContracts.messageProcessor, signer);
  const tallyContract = TallyFactory.connect(pollContracts.tally, signer);

  const vkRegistryContractAddress = await tallyContract.vkRegistry();

  if (!(await contractExists(signer.provider!, vkRegistryContractAddress))) {
    logError("There is no VkRegistry contract linked to the specified MACI contract.");
  }

  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryContractAddress, signer);
  const verifierContractAddress = await mpContract.verifier();

  if (!(await contractExists(signer.provider!, verifierContractAddress))) {
    logError("There is no Verifier contract linked to the specified MACI contract.");
  }

  const verifierContract = VerifierFactory.connect(verifierContractAddress, signer);

  const data = {
    processProofs: [] as Proof[],
    tallyProofs: [] as Proof[],
  };

  let numProcessProofs = 0;

  // read the proof directory
  const filenames = await fs.promises.readdir(proofDir);
  const proofs = await Promise.all(
    filenames.map((filepath) =>
      fs.promises.readFile(path.resolve(proofDir, filepath)).then((res) => JSON.parse(res.toString()) as Proof),
    ),
  );
  // extract all the proofs data
  filenames.forEach((filename, index) => {
    let match = filename.match(/process_(\d+)/);

    if (match) {
      data.processProofs[Number(match[1])] = proofs[index];
      numProcessProofs += 1;
      return;
    }

    match = filename.match(/tally_(\d+)/);
    if (match) {
      data.tallyProofs[Number(match[1])] = proofs[index];
    }
  });

  // retrieve the values we need from the smart contracts
  const treeDepths = await pollContract.treeDepths();
  const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages();
  const numSignUps = Number(numSignUpsAndMessages[0]);
  const numMessages = Number(numSignUpsAndMessages[1]);
  const messageBatchSize = Number(await pollContract.messageBatchSize());
  const tallyBatchSize = STATE_TREE_ARITY ** Number(treeDepths.intStateTreeDepth);
  const pollBatchHashes = await pollContract.getBatchHashes();
  const batchHashes = [...pollBatchHashes];
  const totalMessageBatches = batchHashes.length;
  const lastChainHash = await pollContract.chainHash();

  // perform validation
  if (numProcessProofs !== totalMessageBatches) {
    logRed(
      quiet,
      error(
        `The proof files inside ${proofDir} do not have the correct number of message processing proofs` +
          `(expected ${totalMessageBatches}, got ${numProcessProofs}).`,
      ),
    );
  }

  let numberBatchesProcessed = Number(await mpContract.numBatchesProcessed());
  const tallyMode = await tallyContract.mode();
  const mpMode = await mpContract.mode();

  if (tallyMode !== mpMode) {
    logError("Tally and MessageProcessor modes are not compatible");
  }

  const stateTreeDepth = Number(await maciContract.stateTreeDepth());
  const onChainProcessVk = await vkRegistryContract.getProcessVk(
    stateTreeDepth,
    treeDepths.voteOptionTreeDepth,
    messageBatchSize,
    mpMode,
  );

  if (numberBatchesProcessed < totalMessageBatches) {
    logYellow(quiet, info("Submitting proofs of message processing..."));
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
      currentMessageBatchIndex /= messageBatchSize;
    }

    const { proof, circuitInputs, publicInputs } = data.processProofs[i];

    // validation

    const inputBatchHash = batchHashes[currentMessageBatchIndex - 1];

    if (BigInt(circuitInputs.inputBatchHash as BigNumberish).toString() !== inputBatchHash.toString()) {
      logError("input batch hash mismatch.");
    }

    const outputBatchHash = batchHashes[currentMessageBatchIndex];

    if (BigInt(circuitInputs.outputBatchHash as BigNumberish).toString() !== outputBatchHash.toString()) {
      logError("output batch hash mismatch.");
    }

    let currentSbCommitmentOnChain: bigint;

    if (numberBatchesProcessed === 0) {
      currentSbCommitmentOnChain = BigInt(await pollContract.currentSbCommitment());
    } else {
      currentSbCommitmentOnChain = BigInt(await mpContract.sbCommitment());
    }

    if (currentSbCommitmentOnChain.toString() !== circuitInputs.currentSbCommitment) {
      logError("currentSbCommitment mismatch.");
    }

    const coordPubKeyHashOnChain = await pollContract.coordinatorPubKeyHash();

    if (circuitInputs.coordinatorPublicKeyHash.toString() !== coordPubKeyHashOnChain.toString()) {
      logError("coordPubKey mismatch.");
    }

    const publicInputsOnChain = await mpContract
      .getPublicCircuitInputs(
        currentMessageBatchIndex,
        asHex(circuitInputs.newSbCommitment as BigNumberish),
        outputBatchHash.toString(),
      )
      .then((value) => [...value]);

    if (!publicInputsOnChain.every((value, index) => value.toString() === publicInputs[index].toString())) {
      logError("Public input mismatch.");
    }

    const vk = new VerifyingKey(
      new G1Point(onChainProcessVk.alpha1[0], onChainProcessVk.alpha1[1]),
      new G2Point(onChainProcessVk.beta2[0], onChainProcessVk.beta2[1]),
      new G2Point(onChainProcessVk.gamma2[0], onChainProcessVk.gamma2[1]),
      new G2Point(onChainProcessVk.delta2[0], onChainProcessVk.delta2[1]),
      onChainProcessVk.ic.map(([x, y]) => new G1Point(x, y)),
    );

    const formattedProof = formatProofForVerifierContract(proof);

    const isValidOnChain = await verifierContract.verify(
      formattedProof,
      vk.asContractParam() as IVerifyingKeyStruct,
      publicInputsOnChain,
    );

    if (!isValidOnChain) {
      logError("The verifier contract found the proof invalid.");
    }

    try {
      // validate process messaging proof and store the new state and ballot root commitment
      const tx = await mpContract.processMessages(asHex(circuitInputs.newSbCommitment as BigNumberish), formattedProof);
      const receipt = await tx.wait();

      if (receipt?.status !== 1) {
        logError("processMessages() failed.");
      }

      logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

      numberBatchesProcessed = Number(await mpContract.numBatchesProcessed());

      logYellow(quiet, info(`Progress: ${numberBatchesProcessed} / ${totalMessageBatches}`));
    } catch (err) {
      logError(`processMessages() failed: ${(err as Error).message}`);
    }
  }

  if (numberBatchesProcessed === totalMessageBatches) {
    logGreen(quiet, success("All message processing proofs have been submitted."));
  }

  // vote tallying proofs
  const totalTallyBatches =
    numSignUps % tallyBatchSize === 0
      ? Math.floor(numSignUps / tallyBatchSize)
      : Math.floor(numSignUps / tallyBatchSize) + 1;

  let tallyBatchNum = Number(await tallyContract.tallyBatchNum());

  if (tallyBatchNum < totalTallyBatches) {
    logYellow(quiet, info("Submitting proofs of vote tallying..."));
  }

  for (let i = tallyBatchNum; i < totalTallyBatches; i += 1) {
    if (i === 0) {
      await tallyContract.updateSbCommitment().then((tx) => tx.wait());
    }

    const batchStartIndex = i * tallyBatchSize;
    const { proof, circuitInputs, publicInputs } = data.tallyProofs[i];

    const currentTallyCommitmentOnChain = await tallyContract.tallyCommitment();

    if (currentTallyCommitmentOnChain.toString() !== circuitInputs.currentTallyCommitment) {
      logError("currentTallyCommitment mismatch.");
    }

    const currentSbCommitmentOnChain = await mpContract.sbCommitment();

    if (currentSbCommitmentOnChain.toString() !== circuitInputs.sbCommitment) {
      logError("currentSbCommitment mismatch.");
    }

    const publicInputsOnChain = await tallyContract
      .getPublicCircuitInputs(batchStartIndex, asHex(circuitInputs.newTallyCommitment as BigNumberish))
      .then((value) => [...value]);

    if (!publicInputsOnChain.every((value, index) => value.toString() === publicInputs[index].toString())) {
      logError(
        `public input mismatch. tallyBatchNum=${i}, onchain=${publicInputsOnChain.toString()}, offchain=${publicInputs.toString()}`,
      );
    }

    const onChainTallyVk = await vkRegistryContract.getTallyVk(
      stateTreeDepth,
      treeDepths.intStateTreeDepth,
      treeDepths.voteOptionTreeDepth,
      tallyMode,
    );

    const vk = new VerifyingKey(
      new G1Point(onChainTallyVk.alpha1[0], onChainTallyVk.alpha1[1]),
      new G2Point(onChainTallyVk.beta2[0], onChainTallyVk.beta2[1]),
      new G2Point(onChainTallyVk.gamma2[0], onChainTallyVk.gamma2[1]),
      new G2Point(onChainTallyVk.delta2[0], onChainTallyVk.delta2[1]),
      onChainTallyVk.ic.map(([x, y]) => new G1Point(x, y)),
    );

    // format the tally proof so it can be verified on chain
    const formattedProof = formatProofForVerifierContract(proof);

    const isValidOnChain = await verifierContract.verify(
      formattedProof,
      vk.asContractParam() as IVerifyingKeyStruct,
      publicInputsOnChain,
    );

    if (!isValidOnChain) {
      logError("The verifier contract found the proof invalid.");
    }

    try {
      // verify the proof on chain
      const tx = await tallyContract.tallyVotes(
        asHex(circuitInputs.newTallyCommitment as BigNumberish),
        formattedProof,
      );
      const receipt = await tx.wait();

      if (receipt?.status !== 1) {
        logError("tallyVotes() failed");
      }

      logYellow(quiet, info(`Progress: ${tallyBatchNum + 1} / ${totalTallyBatches}`));
      logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

      tallyBatchNum = Number(await tallyContract.tallyBatchNum());
    } catch (err) {
      logError((err as Error).message);
    }
  }

  if (tallyBatchNum === totalTallyBatches) {
    logGreen(quiet, success("All vote tallying proofs have been submitted."));
  }

  if (tallyFile) {
    const tallyData = await fs.promises.readFile(tallyFile).then((res) => JSON.parse(res.toString()) as TallyData);

    const tallyResults = tallyData.results.tally.map((t) => BigInt(t));
    const tallyResultProofs = tallyData.results.tally.map((_, index) =>
      genTreeProof(index, tallyResults, Number(treeDepths.voteOptionTreeDepth)),
    );

    await tallyContract
      .addTallyResults({
        voteOptionIndices: tallyData.results.tally.map((_, index) => index),
        tallyResults,
        tallyResultProofs,
        totalSpent: tallyData.totalSpentVoiceCredits.spent,
        totalSpentSalt: tallyData.totalSpentVoiceCredits.salt,
        tallyResultSalt: tallyData.results.salt,
        newResultsCommitment: tallyData.results.commitment,
        spentVoiceCreditsHash: tallyData.totalSpentVoiceCredits.commitment,
        perVOSpentVoiceCreditsHash: tallyData.perVOSpentVoiceCredits?.commitment ?? 0n,
      })
      .then((tx) => tx.wait());
  }
};
