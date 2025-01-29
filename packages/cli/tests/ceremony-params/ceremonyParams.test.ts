import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import { getDefaultSigner } from "maci-sdk";

import type { Signer } from "ethers";

import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
} from "../../ts/commands";
import { DeployArgs, DeployPollArgs, DeployedContracts, GenProofsArgs, SetVerifyingKeysArgs } from "../../ts/utils";
import {
  coordinatorPrivKey,
  coordinatorPubKey,
  ceremonyProcessMessagesZkeyPath,
  ceremonyTallyVotesZkeyPath,
  ceremonyProcessMessagesWasmPath,
  ceremonyProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  ceremonyTallyVotesWasmPath,
  ceremonyTallyVotesWitnessPath,
  mergeSignupsArgs,
  proveOnChainArgs,
  verifyArgs,
  ceremonyProcessMessagesDatPath,
  ceremonyTallyVotesDatPath,
  ceremonyProcessMessagesNonQvWitnessPath,
  ceremonyProcessMessagesNonQvDatPath,
  ceremonyTallyVotesNonQvWitnessPath,
  ceremonyTallyVotesNonQvDatPath,
  ceremonyProcessMessagesNonQvZkeyPath,
  ceremonyTallyVotesNonQvZkeyPath,
  ceremonyProcessMessagesNonQvWasmPath,
  ceremonyTallyVotesNonQvWasmPath,
  ceremonyPollJoiningZkeyPath,
  ceremonyPollJoinedZkeyPath,
} from "../constants";
import { clean, isArm } from "../utils";

describe("Stress tests with ceremony params (6,3,2,20)", function test() {
  const stateTreeDepth = 6;
  const voteOptionTreeDepth = 3;
  const intStateTreeDepth = 2;
  const messageBatchSize = 20;

  const pollDuration = 60000;

  const useWasm = isArm();
  this.timeout(90000000);

  let maciAddresses: DeployedContracts;
  let signer: Signer;

  const verifyingKeysArgs: Omit<SetVerifyingKeysArgs, "signer"> = {
    quiet: true,
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    pollJoiningZkeyPath: ceremonyPollJoiningZkeyPath,
    pollJoinedZkeyPath: ceremonyPollJoinedZkeyPath,
    processMessagesZkeyPathQv: ceremonyProcessMessagesZkeyPath,
    tallyVotesZkeyPathQv: ceremonyTallyVotesZkeyPath,
    processMessagesZkeyPathNonQv: ceremonyProcessMessagesNonQvZkeyPath,
    tallyVotesZkeyPathNonQv: ceremonyTallyVotesNonQvZkeyPath,
    useQuadraticVoting: true,
  };

  const ceremonyDeployArgs: Omit<DeployArgs, "signer"> = {
    stateTreeDepth,
  };

  const deployPollArgs: Omit<DeployPollArgs, "signer"> = {
    pollDuration,
    intStateTreeDepth,
    messageBatchSize,
    voteOptionTreeDepth,
    coordinatorPubkey: coordinatorPubKey,
    useQuadraticVoting: true,
  };

  const genProofsCeremonyArgs: Omit<GenProofsArgs, "signer"> = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: ceremonyTallyVotesZkeyPath,
    processZkey: ceremonyProcessMessagesZkeyPath,
    pollId: 0n,
    useWasm,
    coordinatorPrivKey,
    rapidsnark: testRapidsnarkPath,
    processWitgen: ceremonyProcessMessagesWitnessPath,
    tallyWitgen: ceremonyTallyVotesWitnessPath,
    processWasm: ceremonyProcessMessagesWasmPath,
    tallyWasm: ceremonyTallyVotesWasmPath,
    processDatFile: ceremonyProcessMessagesDatPath,
    tallyDatFile: ceremonyTallyVotesDatPath,
    useQuadraticVoting: true,
  };

  const users = Array<Keypair>(100).fill(new Keypair());

  describe("quadratic voting", () => {
    // before all tests we deploy the vk registry contract and set the verifying keys
    before(async () => {
      signer = await getDefaultSigner();

      // we deploy the vk registry contract
      await deployVkRegistryContract({ signer });
      // we set the verifying keys
      await setVerifyingKeys({ ...verifyingKeysArgs, signer });
    });

    describe("1 user, 2 messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deploy({ ...ceremonyDeployArgs, signer });
        // deploy a poll contract
        await deployPoll({ ...deployPollArgs, signer });
      });

      it("should signup 1 user", async () => {
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[0].pubKey.serialize(), signer });
      });

      it("should publish 2 messages", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < 2; i += 1) {
          const randomVoteOption = BigInt(Math.floor(Math.random() * 126));
          const randomVoteWeight = BigInt(Math.floor(Math.random() * 10));
          // eslint-disable-next-line no-await-in-loop
          await publish({
            pubkey: users[0].pubKey.serialize(),
            stateIndex: BigInt(i) + 1n,
            voteOptionIndex: randomVoteOption,
            nonce: 1n,
            newVoteWeight: randomVoteWeight,
            maciAddress: maciAddresses.maciAddress,
            salt: genRandomSalt(),
            privateKey: users[0].privKey.serialize(),
            pollId: 0n,
            signer,
          });
        }
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, signer });
        await genProofs({ ...genProofsCeremonyArgs, signer });
        await proveOnChain({ ...proveOnChainArgs, signer });
        await verify({ ...(await verifyArgs()), signer });
      });
    });

    describe("25 signups, 100 messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deploy({ ...ceremonyDeployArgs, signer });
        // deploy a poll contract
        await deployPoll({ ...deployPollArgs, signer });
      });

      it("should signup 25 users", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < 25; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
        }
      });

      it("should publish 100 messages", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < users.length; i += 1) {
          const randomVoteOption = BigInt(Math.floor(Math.random() * 126));
          const randomVoteWeight = BigInt(Math.floor(Math.random() * 10));
          // eslint-disable-next-line no-await-in-loop
          await publish({
            pubkey: users[i].pubKey.serialize(),
            stateIndex: BigInt(i) + 1n,
            voteOptionIndex: randomVoteOption,
            nonce: 1n,
            pollId: 0n,
            newVoteWeight: randomVoteWeight,
            maciAddress: maciAddresses.maciAddress,
            salt: genRandomSalt(),
            privateKey: users[i].privKey.serialize(),
            signer,
          });
        }
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, signer });
        await genProofs({ ...genProofsCeremonyArgs, signer });
        await proveOnChain({ ...proveOnChainArgs, signer });
        await verify({ ...(await verifyArgs()), signer });
      });
    });
  });

  describe("non quadratic voting", () => {
    const genProofsArgs: Omit<GenProofsArgs, "signer"> = {
      outputDir: testProofsDirPath,
      tallyFile: testTallyFilePath,
      tallyZkey: ceremonyTallyVotesNonQvZkeyPath,
      processZkey: ceremonyProcessMessagesNonQvZkeyPath,
      pollId: 0n,
      rapidsnark: testRapidsnarkPath,
      processWitgen: ceremonyProcessMessagesNonQvWitnessPath,
      processDatFile: ceremonyProcessMessagesNonQvDatPath,
      tallyWitgen: ceremonyTallyVotesNonQvWitnessPath,
      tallyDatFile: ceremonyTallyVotesNonQvDatPath,
      coordinatorPrivKey,
      processWasm: ceremonyProcessMessagesNonQvWasmPath,
      tallyWasm: ceremonyTallyVotesNonQvWasmPath,
      useWasm,
      useQuadraticVoting: false,
    };

    // before all tests we deploy the vk registry contract and set the verifying keys
    before(async () => {
      signer = await getDefaultSigner();

      // we deploy the vk registry contract
      await deployVkRegistryContract({ signer });
      // we set the verifying keys
      await setVerifyingKeys({ ...verifyingKeysArgs, signer });
    });

    describe("1 signup, 1 message", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deploy({ ...ceremonyDeployArgs, signer });
        // deploy a poll contract
        await deployPoll({ ...deployPollArgs, signer, useQuadraticVoting: false });
      });

      it("should signup one user", async () => {
        await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[0].pubKey.serialize(), signer });
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
        await timeTravel({ seconds: pollDuration, signer });
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

    describe("25 signups, 100 messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deploy({ ...ceremonyDeployArgs, signer });
        // deploy a poll contract
        await deployPoll({ ...deployPollArgs, signer, useQuadraticVoting: false });
      });

      it("should signup 25 users", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < 25; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: users[i].pubKey.serialize(), signer });
        }
      });

      it("should publish 100 messages", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < users.length; i += 1) {
          const randomVoteOption = BigInt(Math.floor(Math.random() * 126));
          const randomVoteWeight = BigInt(Math.floor(Math.random() * 10));
          // eslint-disable-next-line no-await-in-loop
          await publish({
            pubkey: users[i].pubKey.serialize(),
            stateIndex: BigInt(i) + 1n,
            voteOptionIndex: randomVoteOption,
            nonce: 1n,
            pollId: 0n,
            newVoteWeight: randomVoteWeight,
            maciAddress: maciAddresses.maciAddress,
            salt: genRandomSalt(),
            privateKey: users[i].privKey.serialize(),
            signer,
          });
        }
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        await timeTravel({ seconds: pollDuration, signer });
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
});
