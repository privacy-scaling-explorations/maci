import { getDefaultSigner } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import type { Signer } from "ethers";

import {
  checkVerifyingKeys,
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
import { DeployedContracts, GenProofsArgs, PollContracts } from "../../ts/utils";
import {
  coordinatorPrivKey,
  verifyArgs,
  proveOnChainArgs,
  processMessageTestZkeyPath,
  subsidyTestZkeyPath,
  checkVerifyingKeysArgs,
  mergeMessagesArgs,
  mergeSignupsArgs,
  tallyVotesTestZkeyPath,
  testProcessMessagesWasmPath,
  testProcessMessagesWitnessDatPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testSubsidyFilePath,
  testSubsidyWasmPath,
  testSubsidyWitnessDatPath,
  testSubsidyWitnessPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessDatPath,
  testTallyVotesWitnessPath,
  setVerifyingKeysArgs,
  deployArgs,
  deployPollArgs,
  timeTravelArgs,
} from "../constants";
import { cleanSubsidy, isArm } from "../utils";

describe("e2e with Subsidy tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;
  let vkRegistryContractAddress: string;
  let signer: Signer;

  const subsidyEnabled = true;
  deployPollArgs.subsidyEnabled = subsidyEnabled;

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
    subsidyZkey: subsidyTestZkeyPath,
    subsidyFile: testSubsidyFilePath,
    subsidyWitgen: testSubsidyWitnessPath,
    subsidyDatFile: testSubsidyWitnessDatPath,
    subsidyWasm: testSubsidyWasmPath,
  };

  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    vkRegistryContractAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, subsidyZkeyPath: subsidyTestZkeyPath, signer });
  });

  describe("4 signups, 6 messages", () => {
    after(() => {
      cleanSubsidy();
    });

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair()];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
    });

    it("should publish six messages", async () => {
      await publish({
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
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

      await publish({
        maciContractAddress: maciAddresses.maciAddress,
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 3n,
        nonce: 2n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });

      await publish({
        maciContractAddress: maciAddresses.maciAddress,
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 4n,
        voteOptionIndex: 3n,
        nonce: 3n,
        pollId: 0n,
        newVoteWeight: 9n,
        salt: genRandomSalt(),
        privateKey: users[3].privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...verifyArgs(), signer });
    });
  });

  describe("9 signups, 1 message", () => {
    after(() => {
      cleanSubsidy();
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
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
    });

    it("should signup nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
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
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyData = await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...verifyArgs(), tallyData, signer });
    });
  });

  describe("8 signups (same key), 12 messages (same message)", () => {
    after(() => {
      cleanSubsidy();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
    });

    it("should signup eight users (same pub key)", async () => {
      for (let i = 0; i < 8; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
      }
    });

    it("should publish 12 messages with the same nonce", async () => {
      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await publish({
          pubkey: user.pubKey.serialize(),
          stateIndex: 1n,
          voteOptionIndex: 0n,
          nonce: 1n,
          pollId: 0n,
          newVoteWeight: 9n,
          maciContractAddress: maciAddresses.maciAddress,
          salt: genRandomSalt(),
          privateKey: user.privKey.serialize(),
          signer,
        });
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      const tallyData = await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...verifyArgs(), tallyData, signer });
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

    let secondPollAddresses: PollContracts;

    after(() => {
      cleanSubsidy();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
    });

    it("should run the first poll", async () => {
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
      // signup
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
      }
      // publish
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 0n,
        newVoteWeight: 9n,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[0].privKey.serialize(),
        signer,
      });
      // time travel
      await timeTravel({ ...timeTravelArgs, signer });
      // generate proofs
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...verifyArgs(), signer });
      cleanSubsidy();
    });

    it("should deploy two more polls", async () => {
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
      secondPollAddresses = await deployPoll({ ...deployPollArgs, signer });
    });

    it("should publish messages to the second poll", async () => {
      await publish({
        pubkey: users[0].pubKey.serialize(),
        stateIndex: 1n,
        voteOptionIndex: 0n,
        nonce: 1n,
        pollId: 1n,
        newVoteWeight: 9n,
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[2].privKey.serialize(),
        signer,
      });
    });

    it("should publish messages to the third poll", async () => {
      await publish({
        pubkey: users[3].pubKey.serialize(),
        stateIndex: 3n,
        voteOptionIndex: 5n,
        nonce: 1n,
        pollId: 2n,
        newVoteWeight: 3n,
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
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
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: users[5].privKey.serialize(),
        signer,
      });
    });

    it("should complete the second poll", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ pollId: 1n, signer });
      await mergeSignups({ pollId: 1n, signer });
      const tallyData = await genProofs({
        ...genProofsArgs,
        pollId: 1n,
        signer,
      });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 1n,
        signer,
      });
      await verify({
        ...verifyArgs(),
        pollId: 1n,
        tallyData,
        tallyAddress: pollAddresses.tally,
        signer,
      });
      cleanSubsidy();
    });

    it("should complete the third poll", async () => {
      await mergeMessages({ pollId: 2n, signer });
      await mergeSignups({ pollId: 2n, signer });
      const tallyData = await genProofs({
        ...genProofsArgs,
        pollId: 2n,
        signer,
      });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 2n,
        signer,
      });
      await verify({
        ...verifyArgs(),
        pollId: 2n,
        tallyData,
        tallyAddress: secondPollAddresses.tally,
        signer,
      });
    });
  });

  describe("checkKeys", () => {
    before(async () => {
      // deploy maci as we need the address
      await deploy({ ...deployArgs, signer });
    });

    it("should check if the verifying keys have been set correctly", async () => {
      await checkVerifyingKeys({
        ...checkVerifyingKeysArgs,
        vkRegistry: vkRegistryContractAddress,
        subsidyZkeyPath: subsidyTestZkeyPath,
        signer,
      });
    });
  });
});
