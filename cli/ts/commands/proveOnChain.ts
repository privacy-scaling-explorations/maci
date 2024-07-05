/* eslint-disable no-await-in-loop */
import { type BigNumberish } from "ethers";
import {
  MACI__factory as MACIFactory,
  Tally__factory as TallyFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Poll__factory as PollFactory,
  VkRegistry__factory as VkRegistryFactory,
  Verifier__factory as VerifierFactory,
  formatProofForVerifierContract,
  type IVerifyingKeyStruct,
} from "maci-contracts";
import { STATE_TREE_ARITY } from "maci-core";
import { G1Point, G2Point, hashLeftRight } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";
import path from "path";

import {
  asHex,
  banner,
  contractExists,
  error,
  info,
  logError,
  logGreen,
  logRed,
  logYellow,
  readContractAddress,
  success,
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
  messageProcessorAddress,
  tallyAddress,
  signer,
  quiet = true,
}: ProveOnChainArgs): Promise<void> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // check existence of contract addresses
  if (!readContractAddress("MACI", network?.name) && !maciAddress) {
    logError("MACI contract address is empty");
  }
  if (!readContractAddress(`MessageProcessor-${pollId}`, network?.name) && !messageProcessorAddress) {
    logError("MessageProcessor contract address is empty");
  }
  if (!readContractAddress(`Tally-${pollId}`, network?.name) && !tallyAddress) {
    logError("Tally contract address is empty");
  }

  // check validity of contract addresses
  const maciContractAddress = maciAddress || readContractAddress("MACI", network?.name);
  const messageProcessorContractAddress =
    messageProcessorAddress || readContractAddress(`MessageProcessor-${pollId}`, network?.name);
  const tallyContractAddress = tallyAddress || readContractAddress(`Tally-${pollId}`, network?.name);

  // check contracts are deployed on chain
  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  if (!(await contractExists(signer.provider!, messageProcessorContractAddress))) {
    logError("MessageProcessor contract does not exist");
  }

  if (!(await contractExists(signer.provider!, tallyContractAddress))) {
    logError("Tally contract does not exist");
  }

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollAddr = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollAddr))) {
    logError("There is no Poll contract with this poll ID linked to the specified MACI contract.");
  }

  const pollContract = PollFactory.connect(pollAddr, signer);

  const mpContract = MessageProcessorFactory.connect(messageProcessorContractAddress, signer);
  const tallyContract = TallyFactory.connect(tallyContractAddress, signer);

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
  const filenames = fs.readdirSync(proofDir);
  // extract all the proofs data
  filenames.forEach((filename) => {
    const filepath = path.resolve(proofDir, filename);
    let match = filename.match(/process_(\d+)/);

    if (match) {
      data.processProofs[Number(match[1])] = JSON.parse(fs.readFileSync(filepath).toString()) as Proof;
      numProcessProofs += 1;
      return;
    }

    match = filename.match(/tally_(\d+)/);
    if (match) {
      data.tallyProofs[Number(match[1])] = JSON.parse(fs.readFileSync(filepath).toString()) as Proof;
    }
  });

  // retrieve the values we need from the smart contracts
  const treeDepths = await pollContract.treeDepths();
  const numSignUpsAndMessages = await pollContract.numSignUpsAndMessages();
  const numSignUps = Number(numSignUpsAndMessages[0]);
  const numMessages = Number(numSignUpsAndMessages[1]);
  const messageBatchSize = Number(await pollContract.batchSizes());
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
    let currentMessageBatchIndex = totalMessageBatches;
    if (numberBatchesProcessed === 0) {
      const chainHash = lastChainHash;
      if (numMessages % messageBatchSize !== 0) {
        batchHashes.push(chainHash);
      }
      currentMessageBatchIndex = batchHashes.length;

      if (currentMessageBatchIndex > 0) {
        currentMessageBatchIndex -= 1;
      }
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

    const coordPubKeyHashOnChain = BigInt(await pollContract.coordinatorPubKeyHash());
    if (
      hashLeftRight(
        BigInt((circuitInputs.coordPubKey as BigNumberish[])[0]),
        BigInt((circuitInputs.coordPubKey as BigNumberish[])[1]),
      ).toString() !== coordPubKeyHashOnChain.toString()
    ) {
      logError("coordPubKey mismatch.");
    }

    const packedValsOnChain = BigInt(
      await mpContract.genProcessMessagesPackedVals(
        currentMessageBatchIndex,
        numSignUps,
        numMessages,
        messageBatchSize,
        treeDepths.voteOptionTreeDepth,
      ),
    ).toString();

    if (circuitInputs.packedVals !== packedValsOnChain) {
      logError("packedVals mismatch.");
    }

    const formattedProof = formatProofForVerifierContract(proof);

    const publicInputHashOnChain = BigInt(
      await mpContract.genProcessMessagesPublicInputHash(
        currentMessageBatchIndex,
        outputBatchHash.toString(),
        numSignUps,
        numMessages,
        circuitInputs.currentSbCommitment as BigNumberish,
        circuitInputs.newSbCommitment as BigNumberish,
        messageBatchSize as BigNumberish,
        treeDepths.voteOptionTreeDepth,
      ),
    );

    if (publicInputHashOnChain.toString() !== publicInputs[0].toString()) {
      logError("Public input mismatch.");
    }

    const vk = new VerifyingKey(
      new G1Point(onChainProcessVk.alpha1[0], onChainProcessVk.alpha1[1]),
      new G2Point(onChainProcessVk.beta2[0], onChainProcessVk.beta2[1]),
      new G2Point(onChainProcessVk.gamma2[0], onChainProcessVk.gamma2[1]),
      new G2Point(onChainProcessVk.delta2[0], onChainProcessVk.delta2[1]),
      onChainProcessVk.ic.map(([x, y]) => new G1Point(x, y)),
    );

    // verify the proof onchain using the verifier contract

    const isValidOnChain = await verifierContract.verify(
      formattedProof,
      vk.asContractParam() as IVerifyingKeyStruct,
      publicInputHashOnChain.toString(),
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

    const packedValsOnChain = BigInt(
      await tallyContract.genTallyVotesPackedVals(numSignUps, batchStartIndex, tallyBatchSize),
    );

    if (circuitInputs.packedVals !== packedValsOnChain.toString()) {
      logError("packedVals mismatch.");
    }

    const currentSbCommitmentOnChain = await mpContract.sbCommitment();

    if (currentSbCommitmentOnChain.toString() !== circuitInputs.sbCommitment) {
      logError("currentSbCommitment mismatch.");
    }

    const publicInputHashOnChain = await tallyContract.genTallyVotesPublicInputHash(
      numSignUps,
      batchStartIndex,
      tallyBatchSize,
      circuitInputs.newTallyCommitment as BigNumberish,
    );

    if (publicInputHashOnChain.toString() !== publicInputs[0]) {
      logError(
        `public input mismatch. tallyBatchNum=${i}, onchain=${publicInputHashOnChain.toString()}, offchain=${publicInputs[0].toString()}`,
      );
    }

    // format the tally proof so it can be verified on chain
    const formattedProof = formatProofForVerifierContract(proof);
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
};
