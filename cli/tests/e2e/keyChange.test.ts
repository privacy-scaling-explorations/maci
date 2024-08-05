import { expect } from "chai";
import { getDefaultSigner } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import fs from "fs";

import type { Signer } from "ethers";

import { DeployedContracts, TallyData } from "../../ts";
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
import { GenProofsArgs } from "../../ts/utils";
import {
  coordinatorPrivKey,
  deployArgs,
  deployPollArgs,
  processMessageTestZkeyPath,
  mergeMessagesArgs,
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
} from "../constants";
import { clean, isArm } from "../utils";

describe("keyChange tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let signer: Signer;

  deployPollArgs.pollDuration = 90;

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

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
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
      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer });
      stateIndex = BigInt(
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: keypair1.pubKey.serialize(), signer }).then(
          (result) => result.stateIndex,
        ),
      );
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
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

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
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
      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer });
      stateIndex = BigInt(
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: keypair1.pubKey.serialize(), signer }).then(
          (result) => result.stateIndex,
        ),
      );
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 1n,
        nonce: initialNonce + 1n,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
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

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
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
      // deploy a poll contract
      await deployPoll({ ...deployPollArgs, signer });
      stateIndex = BigInt(
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: keypair1.pubKey.serialize(), signer }).then(
          (result) => result.stateIndex,
        ),
      );
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should publish a message to change the user maci key, and a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 2n,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 3n,
        maciAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsArgs, signer });
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
