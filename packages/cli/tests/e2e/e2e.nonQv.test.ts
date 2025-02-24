import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import { generateVote, getBlockTimestamp, getDefaultSigner, signup, mergeSignups } from "maci-sdk";

import type { Signer } from "ethers";

import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  proveOnChain,
  publish,
  setVerifyingKeysCli,
  timeTravel,
  verify,
} from "../../ts/commands";
import { DEFAULT_SG_DATA, DeployedContracts, GenProofsArgs } from "../../ts/utils";
import {
  deployPollArgs,
  coordinatorPrivKey,
  pollDuration,
  proveOnChainArgs,
  verifyArgs,
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
  coordinatorKeypair,
} from "../constants";
import { clean, getBackupFilenames, isArm, relayTestMessages } from "../utils";

/**
 Test scenarios:
    1 signup, 1 message with quadratic voting disabled
    1 signup, 1 relayed message
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
    await setVerifyingKeysCli({ ...setVerifyingKeysNonQvArgs, useQuadraticVoting: false, signer });
  });

  describe("1 signup, 1 message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        useQuadraticVoting: false,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
      });
    });

    it("should signup one user", async () => {
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: user.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
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

  describe("1 signup, 1 relayed message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        useQuadraticVoting: false,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup one user", async () => {
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: user.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
    });

    it("should relay one message", async () => {
      const { message, ephemeralKeypair } = generateVote({
        pollId: 0n,
        voteOptionIndex: 0n,
        salt: genRandomSalt(),
        nonce: 1n,
        privateKey: user.privKey,
        stateIndex: 1n,
        voteWeight: 9n,
        coordinatorPubKey: coordinatorKeypair.pubKey,
        maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
        newPubKey: user.pubKey,
      });

      const messages = [
        {
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        },
      ];

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const tallyFileData = await genProofs({
        ...genProofsArgs,
        signer,
        ipfsMessageBackupFiles,
        useQuadraticVoting: false,
      });
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
