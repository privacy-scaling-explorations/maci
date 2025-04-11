/* eslint-disable no-underscore-dangle */
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "@maci-protocol/contracts/typechain-types";
import { poseidon } from "@maci-protocol/crypto";
import { Keypair, PrivKey } from "@maci-protocol/domainobjs";

import type { IJoinPollData, IJoinPollArgs } from "./types";
import type { CircuitInputs } from "../utils/types";

import { contractExists } from "../utils/contracts";
import { generateAndVerifyProof } from "../utils/proofs";

import { getPollJoiningCircuitEvents, getPollJoiningCircuitInputsFromStateFile, hasUserJoinedPoll } from "./utils";

/**
 * Join Poll user to the Poll contract
 * @param {IJoinPollArgs} args - The arguments for the join poll command
 * @returns {IJoinPollData} The poll state index of the joined user and transaction hash
 */
export const joinPoll = async ({
  maciAddress,
  privateKey,
  stateFile,
  pollId,
  signer,
  startBlock,
  endBlock,
  blocksPerBatch,
  pollJoiningZkey,
  useWasm,
  rapidsnark,
  pollWitgen,
  pollWasm,
  sgDataArg,
  ivcpDataArg,
}: IJoinPollArgs): Promise<IJoinPollData> => {
  const validContract = await contractExists(signer.provider!, maciAddress);

  if (!validContract) {
    throw new Error("MACI contract does not exist");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid MACI private key");
  }

  if (pollId < 0) {
    throw new Error("Invalid poll id");
  }

  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const userMaciPubKey = new Keypair(userMaciPrivKey).pubKey;
  const nullifier = poseidon([BigInt(userMaciPrivKey.asCircuitInputs()), pollId]);

  // check if the user has already joined the poll based on the nullifier
  const hasUserJoinedAlready = await hasUserJoinedPoll({
    maciAddress,
    pollId,
    nullifier,
    signer,
  });

  if (hasUserJoinedAlready) {
    throw new Error("User has already joined");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  // get the state index from the MACI contract
  const stateIndex = await maciContract.getStateIndex(userMaciPubKey.hash()).catch(() => -1n);

  let circuitInputs: CircuitInputs;

  if (stateFile) {
    circuitInputs = await getPollJoiningCircuitInputsFromStateFile({
      stateFile,
      pollId,
      stateIndex,
      userMaciPrivKey,
    });
  } else {
    circuitInputs = await getPollJoiningCircuitEvents({
      maciContract,
      stateIndex,
      pollId,
      userMaciPrivKey,
      signer,
      startBlock,
      endBlock,
      blocksPerBatch,
    });
  }

  const currentStateRootIndex = Number.parseInt((await maciContract.numSignUps()).toString(), 10) - 1;

  // generate the proof for this batch
  const proof = await generateAndVerifyProof(circuitInputs, pollJoiningZkey, useWasm, rapidsnark, pollWitgen, pollWasm);

  // submit the message onchain as well as the encryption public key
  const tx = await pollContract.joinPoll(
    nullifier,
    userMaciPubKey.asContractParam(),
    currentStateRootIndex,
    proof,
    sgDataArg,
    ivcpDataArg,
  );
  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Transaction failed");
  }

  const [{ args }] = await pollContract.queryFilter(
    pollContract.filters.PollJoined,
    receipt.blockNumber,
    receipt.blockNumber,
  );

  return {
    pollStateIndex: args._pollStateIndex.toString(),
    voiceCredits: args._voiceCreditBalance.toString(),
    nullifier: nullifier.toString(),
    hash: receipt.hash,
  };
};
