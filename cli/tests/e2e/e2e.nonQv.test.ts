import { getDefaultSigner } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import type { Signer } from "ethers";

import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  mergeMessages,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
} from "../../ts/commands";
import { DeployedContracts, GenProofsArgs } from "../../ts/utils";
import {
  deployPollArgs,
  coordinatorPrivKey,
  pollDuration,
  proveOnChainArgs,
  verifyArgs,
  mergeMessagesArgs,
  mergeSignupsArgs,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  deployArgs,
  setVerifyingKeysNonQvArgs,
  testProcessMessagesNonQvWitnessPath,
  testProcessMessagesNonQvWitnessDatPath,
  testTallyVotesNonQvWitnessPath,
  testTallyVotesNonQvWitnessDatPath,
  testProcessMessagesNonQvWasmPath,
  testTallyVotesNonQvWasmPath,
  processMessageTestNonQvZkeyPath,
  tallyVotesTestNonQvZkeyPath,
} from "../constants";
import { clean, isArm } from "../utils";

/**
 Test scenarios:
    1 signup, 1 message with quadratic voting disabled
 */
describe("e2e tests with non quadratic voting", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let signer: Signer;

  const genProofsArgs: Omit<GenProofsArgs, "signer"> = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: tallyVotesTestNonQvZkeyPath,
    processZkey: processMessageTestNonQvZkeyPath,
    pollId: 0n,
    rapidsnark: testRapidsnarkPath,
    processWitgen: testProcessMessagesNonQvWitnessPath,
    processDatFile: testProcessMessagesNonQvWitnessDatPath,
    tallyWitgen: testTallyVotesNonQvWitnessPath,
    tallyDatFile: testTallyVotesNonQvWitnessDatPath,
    coordinatorPrivKey,
    processWasm: testProcessMessagesNonQvWasmPath,
    tallyWasm: testTallyVotesNonQvWasmPath,
    useWasm,
    useQuadraticVoting: false,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysNonQvArgs, useQuadraticVoting: false, signer });
  });

  describe("1 signup, 1 message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer, useQuadraticVoting: false });
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should publish one message", async () => {
      await publish({
        pubkey: user.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ seconds: pollDuration, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, useQuadraticVoting: false });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({
        ...(await verifyArgs()),
        tallyData: tallyFileData,
        maciAddress: tallyFileData.maci,
        signer,
      });
    });
  });
});
