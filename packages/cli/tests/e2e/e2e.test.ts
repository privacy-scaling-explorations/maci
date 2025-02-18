import { expect } from "chai";
import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import { generateVote, getBlockTimestamp, getDefaultSigner } from "maci-sdk";

import fs from "fs";

import type { Signer } from "ethers";

import {
  checkVerifyingKeys,
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genLocalState,
  genProofs,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
  isRegisteredUser,
  getGatekeeperTrait,
  joinPoll,
  isJoinedUser,
} from "../../ts/commands";
import { DeployedContracts, GatekeeperTrait, GenProofsArgs } from "../../ts/utils";
import {
  deployPollArgs,
  checkVerifyingKeysArgs,
  coordinatorPrivKey,
  pollDuration,
  proveOnChainArgs,
  verifyArgs,
  mergeSignupsArgs,
  pollJoiningTestZkeyPath,
  processMessageTestZkeyPath,
  setVerifyingKeysArgs,
  tallyVotesTestZkeyPath,
  testPollJoiningWasmPath,
  testProcessMessagesWasmPath,
  testPollJoiningWitnessPath,
  testProcessMessagesWitnessDatPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessDatPath,
  testTallyVotesWitnessPath,
  deployArgs,
  timeTravelArgs,
  coordinatorKeypair,
} from "../constants";
import { clean, getBackupFilenames, isArm, relayTestMessages } from "../utils";

/**
 Test scenarios:
    1 signup, 1 message
    1 signup, 1 relayed message
    1 signup, 1 message, 1 relayed message
    4 signups, 8 messages
    4 signups, 8 messages, 16 relayed messages
    9 signups, 1 message
    9 signups, 1 message, 2 relayed messages
    8 signups (same key), 12 messages (same message), 12 relayed messages (same message)
    30 signups (31 ballots), 4 messages
    30 signups (31 ballots), 4 messages, 3 relayed messages
    test if keys are set correctly given a set of files
    multiple polls tests
 */
describe("e2e tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let signer: Signer;

  const genProofsArgs: Omit<GenProofsArgs, "signer"> = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: tallyVotesTestZkeyPath,
    processZkey: processMessageTestZkeyPath,
    pollId: 0n,
    rapidsnark: testRapidsnarkPath,
    processWitgen: testProcessMessagesWitnessPath,
    processDatFile: testProcessMessagesWitnessDatPath,
    tallyWitgen: testTallyVotesWitnessPath,
    tallyDatFile: testTallyVotesWitnessDatPath,
    coordinatorPrivKey,
    processWasm: testProcessMessagesWasmPath,
    tallyWasm: testTallyVotesWasmPath,
    useWasm,
    useQuadraticVoting: true,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
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
        useQuadraticVoting: true,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
      });
    });

    it("should get the correct gatekeeper trait", async () => {
      const gatekeeperTrait = await getGatekeeperTrait({ maciAddress: maciAddresses.maciAddress, signer });
      expect(gatekeeperTrait).to.eq(GatekeeperTrait.FreeForAll);
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should join one user", async () => {
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
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
      const tallyFileData = await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({
        ...(await verifyArgs()),
        tallyData: tallyFileData,
        signer,
      });
    });
  });

  describe("2 signups (1 after stateAq is merged and logs are fetched), 1 message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer, pollStartDate: startDate, pollEndDate: startDate + pollDuration });
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should join one user", async () => {
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
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
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer });
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
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
        useQuadraticVoting: true,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should join one user", async () => {
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
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
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({
        ...(await verifyArgs()),
        tallyData: tallyFileData,
        signer,
      });
    });
  });

  describe("1 signup, 1 message, 1 relayed message", () => {
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
        useQuadraticVoting: true,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should join one user", async () => {
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
    });

    it("should relay one message and publish one message", async () => {
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
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({
        ...(await verifyArgs()),
        tallyData: tallyFileData,
        signer,
      });
    });
  });

  describe("4 signups, 8 messages", () => {
    after(async () => {
      await clean();
    });

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair()];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer, pollStartDate: startDate, pollEndDate: startDate + pollDuration });
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish eight messages", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 4n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 2n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[2].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 2n,
        nonce: 3n,
        pollId: 0n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 2n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 2n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 1n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });
  });

  describe("4 signups, 8 messages, 16 relayed messages", () => {
    after(async () => {
      await clean();
    });

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair()];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish eight messages", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 4n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 2n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[2].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 2n,
        nonce: 3n,
        pollId: 0n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 2n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 2n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 1n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
    });

    it("should relay sixteen messages", async () => {
      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 2n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 4n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 2n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 3n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[1].privKey,
          stateIndex: 2n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[1].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[2].privKey,
          stateIndex: 3n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[2].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 3n,
          privateKey: users[3].privKey,
          stateIndex: 4n,
          voteWeight: 3n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[3].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 2n,
          privateKey: users[3].privKey,
          stateIndex: 4n,
          voteWeight: 2n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[3].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[3].privKey,
          stateIndex: 4n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[3].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });
  });

  describe("9 signups, 1 message", () => {
    after(async () => {
      await clean();
    });

    const users = [
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
    ];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer, pollStartDate: startDate, pollEndDate: startDate + pollDuration });
    });

    it("should signup nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish one message", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
    });
  });

  describe("9 signups, 1 message, 2 relayed messages", () => {
    after(async () => {
      await clean();
    });

    const users = [
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
    ];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish one message", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
    });

    it("should relay two messages", async () => {
      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 2n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 4n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 3n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
    });
  });

  describe("8 signups (same key), 12 messages (same message), 12 relayed messages (same message)", () => {
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
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup eight users (same pub key)", async () => {
      for (let i = 0; i < 8; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      }
    });

    it("should join user", async () => {
      // eslint-disable-next-line no-await-in-loop
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
    });

    it("should publish and relay 12 messages with the same nonce", async () => {
      const messages = new Array(12)
        .fill(0)
        .map(() =>
          generateVote({
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
          }),
        )
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });

      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
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
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });
  });

  describe("30 signups (31 ballots), 4 messages", () => {
    after(async () => {
      await clean();
    });

    const users = Array.from({ length: 30 }, () => new Keypair());

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer, pollStartDate: startDate, pollEndDate: startDate + pollDuration });
    });

    it("should signup thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish 4 messages", async () => {
      // publish four different messages
      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 2n,
        voteOptionIndex: 1n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[2].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 3n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
    });
  });

  describe("30 signups (31 ballots), 4 messages, 3 relayed messages", () => {
    after(async () => {
      await clean();
    });

    const users = Array.from({ length: 30 }, () => new Keypair());

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should join thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
      }
    });

    it("should publish 4 messages", async () => {
      // publish four different messages
      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 2n,
        voteOptionIndex: 1n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[2].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 2n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });

      await publish({
        maciAddress: maciAddresses.maciAddress,
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 3n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
    });

    it("should relay 3 messages", async () => {
      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 2n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 5n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 2n,
          salt: genRandomSalt(),
          nonce: 3n,
          privateKey: users[2].privKey,
          stateIndex: 3n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[2].pubKey,
        },
        {
          pollId: 0n,
          voteOptionIndex: 3n,
          salt: genRandomSalt(),
          nonce: 3n,
          privateKey: users[3].privKey,
          stateIndex: 4n,
          voteWeight: 7n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[3].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
    });
  });

  describe("checkKeys", () => {
    before(async () => {
      // deploy maci as we need the address
      await deploy({ ...deployArgs, signer });
    });

    it("should check if the verifying keys have been set correctly", async () => {
      await checkVerifyingKeys({ ...checkVerifyingKeysArgs, signer });
    });
  });

  describe("multiplePolls1", () => {
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
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
      // signup
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });

      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: user.privKey,
          stateIndex: 1n,
          voteWeight: 5n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: user.pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });

      // publish
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
      const ipfsMessageBackupFiles = await getBackupFilenames();
      // time travel
      await timeTravel({ ...timeTravelArgs, signer });
      // generate proofs
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
      await clean();
    });

    it("should deploy a new poll", async () => {
      const startDate = await getBlockTimestamp(signer);

      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should join to new poll", async () => {
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 1n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
    });

    it("should publish a new message", async () => {
      await publish({
        pubkey: user.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 7n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    it("should relay a new message", async () => {
      const votes = [
        {
          pollId: 1n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: user.privKey,
          stateIndex: 1n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: user.pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 1,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 1, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ pollId: 1n, signer });
      await genProofs({ ...genProofsArgs, pollId: 1n, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, pollId: 1n, signer });
      await verify({ ...(await verifyArgs()), pollId: 1n, signer });
    });
  });

  describe("multiplePolls with new signups", () => {
    after(async () => {
      await clean();
    });

    const users = Array.from({ length: 4 }, () => new Keypair());

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
      // signup
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[0].pubKey.serialize(), signer });
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: users[0].privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });

      // publish
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[1].pubKey.serialize(), signer });

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[1].pubKey.serialize(), signer });

      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: users[1].privKey.serialize(),
        stateIndex: 2n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });

      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[1].privKey,
          stateIndex: 2n,
          voteWeight: 2n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[1].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });

      const ipfsMessageBackupFiles = await getBackupFilenames();
      // time travel
      await timeTravel({ ...timeTravelArgs, signer });
      // generate proofs
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyFileData = await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), tallyData: tallyFileData, signer });
      await clean();
    });

    it("should deploy a new poll", async () => {
      const startDate = await getBlockTimestamp(signer);

      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup four new users", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[2].pubKey.serialize(), signer });
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[3].pubKey.serialize(), signer });
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[3].pubKey.serialize(), signer });
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[3].pubKey.serialize(), signer });
    });

    it("should join users", async () => {
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: users[2].privKey.serialize(),
        stateIndex: 4n,
        pollId: 1n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: users[3].privKey.serialize(),
        stateIndex: 5n,
        pollId: 1n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
    });

    it("should relay new messages", async () => {
      const votes = [
        {
          pollId: 1n,
          voteOptionIndex: 1n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 9n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
        {
          pollId: 1n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[1].privKey,
          stateIndex: 1n,
          voteWeight: 5n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[1].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 1,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 1, maciAddress: maciAddresses.maciAddress });
    });

    it("should publish a new message from the first poll voter", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 7n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
    });

    it("should publish a new message by the new poll voters", async () => {
      await publish({
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 7n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });
    });

    it("should generate proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ pollId: 1n, signer });
      await genProofs({ ...genProofsArgs, pollId: 1n, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, pollId: 1n, signer });
      await verify({ ...(await verifyArgs()), pollId: 1n, signer });
    });
  });

  describe("multiplePolls2", () => {
    const users = [
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
    ];

    after(async () => {
      await clean();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
    });

    it("should run the first poll", async () => {
      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });

      // signup
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });

        // eslint-disable-next-line no-await-in-loop
        const { isRegistered, stateIndex } = await isRegisteredUser({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: users[i].pubKey.serialize(),
          signer,
        });

        expect(isRegistered).to.eq(true);
        expect(stateIndex).to.not.eq(undefined);
      }

      // join the first poll
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await joinPoll({
          maciAddress: maciAddresses.maciAddress,
          privateKey: users[i].privKey.serialize(),
          stateIndex: BigInt(i + 1),
          pollId: 0n,
          pollJoiningZkey: pollJoiningTestZkeyPath,
          useWasm: true,
          pollWasm: testPollJoiningWasmPath,
          pollWitgen: testPollJoiningWitnessPath,
          rapidsnark: testRapidsnarkPath,
          signer,
          quiet: true,
        });
        // eslint-disable-next-line no-await-in-loop
        const { isJoined, pollStateIndex } = await isJoinedUser({
          maciAddress: maciAddresses.maciAddress,
          pollId: 0n,
          pollPubKey: users[i].pubKey.serialize(),
          signer,
          startBlock: 0,
          quiet: true,
        });

        expect(isJoined).to.eq(true);
        expect(pollStateIndex).to.not.eq(undefined);
      }

      // publish
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 5n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });

      const ipfsMessageBackupFiles = await getBackupFilenames();
      // time travel
      await timeTravel({ ...timeTravelArgs, signer });
      // generate proofs
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
      await clean();
    });

    it("should deploy two more polls", async () => {
      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("join the second and third polls", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let p = 1; p <= 2; p += 1) {
        for (let i = 0; i < users.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await joinPoll({
            maciAddress: maciAddresses.maciAddress,
            privateKey: users[i].privKey.serialize(),
            stateIndex: BigInt(i + 1),
            pollId: BigInt(p),
            pollJoiningZkey: pollJoiningTestZkeyPath,
            useWasm: true,
            pollWasm: testPollJoiningWasmPath,
            pollWitgen: testPollJoiningWitnessPath,
            rapidsnark: testRapidsnarkPath,
            signer,
            quiet: true,
          });
          // eslint-disable-next-line no-await-in-loop
          const { isJoined, pollStateIndex } = await isJoinedUser({
            maciAddress: maciAddresses.maciAddress,
            pollId: BigInt(p),
            pollPubKey: users[i].pubKey.serialize(),
            signer,
            startBlock: 0,
            quiet: true,
          });

          expect(isJoined).to.eq(true);
          expect(pollStateIndex).to.not.eq(undefined);
        }
      }
    });

    it("should publish messages to the second poll", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[1].pubKey.serialize(),
        stateIndex: 2n,
        voteOptionIndex: 3n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 1n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[1].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[2].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 5n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });
    });

    it("should relay a message to the second poll", async () => {
      const votes = [
        {
          pollId: 1n,
          voteOptionIndex: 0n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[0].privKey,
          stateIndex: 1n,
          voteWeight: 3n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[0].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 1,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 1, maciAddress: maciAddresses.maciAddress });
    });

    it("should relay two messages to the third poll", async () => {
      const votes = [
        {
          pollId: 2n,
          voteOptionIndex: 7n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[4].privKey,
          stateIndex: 4n,
          voteWeight: 3n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[4].pubKey,
        },
        {
          pollId: 2n,
          voteOptionIndex: 5n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: users[5].privKey,
          stateIndex: 5n,
          voteWeight: 4n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: users[5].pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 2,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 2, maciAddress: maciAddresses.maciAddress });
    });

    it("should publish messages to the third poll", async () => {
      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 5n,
        nonce: 1n,
        pollId: 2n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[4].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 7n,
        nonce: 1n,
        pollId: 2n,
        newVoteWeight: 2n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[4].privKey.serialize(),
        signer,
      });

      await publish({
        pubkey: users[5].pubKey.serialize(),
        stateIndex: 5n,
        voteOptionIndex: 5n,
        nonce: 1n,
        pollId: 2n,
        newVoteWeight: 9n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[5].privKey.serialize(),
        signer,
      });
    });

    it("should complete the second poll", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ pollId: 1n, signer });
      const tallyData = await genProofs({ ...genProofsArgs, pollId: 1n, signer, ipfsMessageBackupFiles });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 1n,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await verify({
        ...(await verifyArgs()),
        pollId: 1n,
        tallyData,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await clean(false);
    });

    it("should complete the third poll", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await mergeSignups({ pollId: 2n, signer });
      const tallyData = await genProofs({ ...genProofsArgs, pollId: 2n, signer, ipfsMessageBackupFiles });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 2n,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await verify({
        ...(await verifyArgs()),
        pollId: 2n,
        tallyData,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
    });
  });

  describe("pre fetch logs", () => {
    const stateOutPath = "./state.json";

    const user = new Keypair();

    after(async () => {
      await clean();

      if (fs.existsSync(stateOutPath)) {
        await fs.promises.unlink(stateOutPath);
      }
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartDate: startDate,
        pollEndDate: startDate + pollDuration,
        relayers: [await signer.getAddress()],
      });
    });

    it("should signup one user", async () => {
      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should join one user", async () => {
      // joinPoll
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user.privKey.serialize(),
        stateIndex: 1n,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
    });

    it("should publish one message", async () => {
      await publish({
        pubkey: user.pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 5n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    it("should relay one message", async () => {
      const votes = [
        {
          pollId: 0n,
          voteOptionIndex: 5n,
          salt: genRandomSalt(),
          nonce: 1n,
          privateKey: user.privKey,
          stateIndex: 1n,
          voteWeight: 5n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: user.pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genLocalState({
        outputPath: stateOutPath,
        coordinatorPrivateKey: coordinatorPrivKey,
        blockPerBatch: 50,
        pollId: 0n,
        signer,
        ipfsMessageBackupFiles,
      });
      await genProofs({
        ...genProofsArgs,
        stateFile: stateOutPath,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });
  });
});
