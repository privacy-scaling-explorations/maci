import { expect } from "chai";
import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import { generateVote, getBlockTimestamp, getDefaultSigner } from "maci-sdk";

import fs from "fs";

import type { Signer } from "ethers";

import { DeployedContracts, TallyData } from "../../ts";
import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  joinPoll,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
} from "../../ts/commands";
import { GenProofsArgs } from "../../ts/utils";
import {
  coordinatorPrivKey,
  deployArgs,
  deployPollArgs,
  processMessageTestZkeyPath,
  mergeSignupsArgs,
  setVerifyingKeysArgs,
  tallyVotesTestZkeyPath,
  testProcessMessagesWasmPath,
  testProcessMessagesWitnessDatPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessDatPath,
  testTallyVotesWitnessPath,
  proveOnChainArgs,
  verifyArgs,
  timeTravelArgs,
  pollJoiningTestZkeyPath,
  testPollJoiningWasmPath,
  testPollJoiningWitnessPath,
  pollDuration,
  coordinatorKeypair,
} from "../constants";
import { clean, getBackupFilenames, isArm, relayTestMessages } from "../utils";

describe("keyChange tests", function test() {
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
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
  });

  describe("keyChange and new vote (new vote has same nonce)", () => {
    after(async () => {
      await clean();
    });

    const user1Keypair = new Keypair();
    const { privKey: pollPrivKey1, pubKey: pollPubKey1 } = user1Keypair;
    const { pubKey: pollPubKey2 } = new Keypair();

    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount - 1n;
    const expectedPerVoteOptionTally = (initialVoteAmount - 1n) ** 2n;

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
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });
      await publish({
        pubkey: pollPubKey1.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: pollPrivKey1.serialize(),
        signer,
      });
    });

    it("should publish relay a message to change the poll key and cast a new vote", async () => {
      const votes = [
        {
          pollId,
          voteOptionIndex: initialVoteOption,
          salt: genRandomSalt(),
          nonce: initialNonce,
          privateKey: pollPrivKey1,
          stateIndex,
          voteWeight: initialVoteAmount - 2n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: pollPubKey2,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: Number(pollId), maciAddress: maciAddresses.maciAddress });
    });

    it("should publish a message to change the poll key and cast a new vote", async () => {
      await publish({
        pubkey: pollPubKey2.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: pollPrivKey1.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as TallyData;
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits?.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has greater nonce and different vote option)", () => {
    after(async () => {
      await clean();
    });

    const user1Keypair = new Keypair();
    const { pubKey: pollPubKey2 } = new Keypair();

    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount;
    const expectedPerVoteOptionTally = initialVoteAmount ** 2n;

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
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
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
          pollId,
          voteOptionIndex: initialVoteOption,
          salt: genRandomSalt(),
          nonce: initialNonce,
          privateKey: user1Keypair.privKey,
          stateIndex,
          voteWeight: initialVoteAmount,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: user1Keypair.pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: Number(pollId), maciAddress: maciAddresses.maciAddress });
    });

    it("should publish a message to change the key and cast a new vote", async () => {
      await publish({
        pubkey: pollPubKey2.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 1n,
        nonce: initialNonce + 1n,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user1Keypair.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as TallyData;
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits?.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has same nonce and different vote option)", () => {
    after(async () => {
      await clean();
    });

    const user1Keypair = new Keypair();
    const secondKeypair = new Keypair();

    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount - 3n;
    const expectedPerVoteOptionTally = (initialVoteAmount - 3n) ** 2n;

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
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        signer,
        quiet: true,
      });

      await publish({
        pubkey: user1Keypair.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user1Keypair.privKey.serialize(),
        signer,
      });
    });

    it("should relay a message to change the poll key, and a new vote", async () => {
      const votes = [
        {
          pollId,
          voteOptionIndex: initialVoteOption + 2n,
          salt: genRandomSalt(),
          nonce: initialNonce,
          privateKey: user1Keypair.privKey,
          stateIndex,
          voteWeight: initialVoteAmount - 2n,
          coordinatorPubKey: coordinatorKeypair.pubKey,
          maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
          newPubKey: secondKeypair.pubKey,
        },
      ];

      const messages = votes
        .map((vote) => generateVote(vote))
        .map(({ message, ephemeralKeypair }) => ({
          maciContractAddress: maciAddresses.maciAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({ messages, signer, pollId: Number(pollId), maciAddress: maciAddresses.maciAddress });
    });

    it("should publish a message to change the poll key, and a new vote", async () => {
      await publish({
        pubkey: secondKeypair.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 2n,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: user1Keypair.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer, ipfsMessageBackupFiles });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...(await verifyArgs()), signer });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as TallyData;
      expect(tallyData.results.tally[2]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits?.tally[2]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });
});
