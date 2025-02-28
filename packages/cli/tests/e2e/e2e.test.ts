import { expect } from "chai";
import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import {
  generateVote,
  getBlockTimestamp,
  getDefaultSigner,
  getSignedupUserData,
  signup,
  mergeSignups,
  verify,
  setVerifyingKeys,
  generateMaciState,
  joinPoll,
  getJoinedUserData,
  proveOnChain,
  publish,
  deployPoll,
  generateProofs,
  deployVkRegistryContract,
  timeTravel,
  type IGenerateProofsArgs,
} from "maci-sdk";

import fs from "fs";

import type { Signer } from "ethers";

import { deploy } from "../../ts/commands";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA, DeployedContracts } from "../../ts/utils";
import {
  deployPollArgs,
  coordinatorPrivKey,
  pollDuration,
  proveOnChainArgs,
  verifyArgs,
  mergeSignupsArgs,
  pollJoiningTestZkeyPath,
  processMessageTestZkeyPath,
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
  verifyingKeysArgs,
} from "../constants";
import { clean, getBackupFilenames, isArm, relayTestMessages } from "../utils";

/**
 Test scenarios:
    4 signups, 8 messages, 16 relayed messages
    8 signups (same key), 12 messages (same message), 12 relayed messages (same message)
    30 signups (31 ballots), 4 messages
    30 signups (31 ballots), 4 messages, 3 relayed messages
    multiple polls tests
    2 signups (1 after stateAq is merged and logs are fetched), 1 message
    30 signups (31 ballots), 21 messages (> 1 batch)
    1 signup and 1 valid message for multiple polls
    7 signups and 1 message, another polls and 6 messages
 */
describe("e2e tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let vkRegistryAddress: string;
  let signer: Signer;

  const generateProofsArgs: Omit<IGenerateProofsArgs, "maciAddress" | "signer"> = {
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
    coordinatorPrivateKey: coordinatorPrivKey,
    processWasm: testProcessMessagesWasmPath,
    tallyWasm: testTallyVotesWasmPath,
    useWasm,
    useQuadraticVoting: true,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });
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
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
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
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: user.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({
        ...(await verifyArgs(signer)),
        tallyData: tallyFileData,
        maciAddress: tallyFileData.maci,
      });
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: users[i].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
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
          sgDataArg: DEFAULT_SG_DATA,
          ivcpDataArg: DEFAULT_IVCP_DATA,
          signer,
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        signer,
        maciAddress: maciAddresses.maciAddress,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
    });

    it("should signup eight users (same pub key)", async () => {
      for (let i = 0; i < 8; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: user.pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
    });
  });

  describe("30 signups (31 ballots), 30 messages", () => {
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
    });

    it("should signup thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: users[i].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
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
          sgDataArg: DEFAULT_SG_DATA,
          ivcpDataArg: DEFAULT_IVCP_DATA,
          signer,
        });
      }
    });

    it("should publish 30 messages", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await publish({
          maciAddress: maciAddresses.maciAddress,
          pubkey: users[i].pubKey.serialize(),
          stateIndex: BigInt(i + 1),
          voteOptionIndex: 0n,
          nonce: 1n,
          pollId: 0n,
          newVoteWeight: 9n,
          salt: genRandomSalt(),
          privateKey: users[i].privKey.serialize(),
          signer,
        });
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)), tallyData: tallyFileData });
    });
  });

  describe("30 signups (31 ballots), 30 messages, 3 relayed messages", () => {
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
    });

    it("should signup thirty users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: users[i].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
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
          sgDataArg: DEFAULT_SG_DATA,
          ivcpDataArg: DEFAULT_IVCP_DATA,
          signer,
        });
      }
    });

    it("should publish 30 messages", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await publish({
          maciAddress: maciAddresses.maciAddress,
          pubkey: users[i].pubKey.serialize(),
          stateIndex: 1n,
          voteOptionIndex: 0n,
          nonce: 1n,
          pollId: 0n,
          newVoteWeight: 9n,
          salt: genRandomSalt(),
          privateKey: users[i].privKey.serialize(),
          signer,
        });
      }
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)), tallyData: tallyFileData });
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
      // signup
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[0].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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

      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[1].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });

      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[1].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });

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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)), tallyData: tallyFileData });
      await clean();
    });

    it("should deploy a new poll", async () => {
      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
    });

    it("should signup four new users", async () => {
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[2].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[3].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[3].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      await signup({
        maciAddress: maciAddresses.maciAddress,
        maciPubKey: users[3].pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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
      await mergeSignups({ maciAddress: maciAddresses.maciAddress, pollId: 1n, signer });
      await generateProofs({
        ...generateProofsArgs,
        pollId: 1n,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, pollId: 1n, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)), pollId: 1n });
    });
  });

  describe("multiplePolls", () => {
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });

      // signup
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({
          maciAddress: maciAddresses.maciAddress,
          maciPubKey: users[i].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });

        // eslint-disable-next-line no-await-in-loop
        const { isRegistered, stateIndex } = await getSignedupUserData({
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
          sgDataArg: DEFAULT_SG_DATA,
          ivcpDataArg: DEFAULT_IVCP_DATA,
          signer,
        });
        // eslint-disable-next-line no-await-in-loop
        const { isJoined, pollStateIndex } = await getJoinedUserData({
          maciAddress: maciAddresses.maciAddress,
          pollId: 0n,
          pollPubKey: users[i].pubKey.serialize(),
          signer,
          startBlock: 0,
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
      await clean();
    });

    it("should deploy two more polls", async () => {
      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
      });
      // deploy another poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
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
            sgDataArg: DEFAULT_SG_DATA,
            ivcpDataArg: DEFAULT_IVCP_DATA,
            signer,
          });
          // eslint-disable-next-line no-await-in-loop
          const { isJoined, pollStateIndex } = await getJoinedUserData({
            maciAddress: maciAddresses.maciAddress,
            pollId: BigInt(p),
            pollPubKey: users[i].pubKey.serialize(),
            signer,
            startBlock: 0,
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
      await mergeSignups({ maciAddress: maciAddresses.maciAddress, pollId: 1n, signer });
      const { tallyData } = await generateProofs({
        ...generateProofsArgs,
        pollId: 1n,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 1n,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await verify({
        ...(await verifyArgs(signer)),
        pollId: 1n,
        tallyData,
        maciAddress: maciAddresses.maciAddress,
      });
      await clean(false);
    });

    it("should complete the third poll", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await mergeSignups({ maciAddress: maciAddresses.maciAddress, pollId: 2n, signer });
      const { tallyData } = await generateProofs({
        ...generateProofsArgs,
        pollId: 2n,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({
        ...proveOnChainArgs,
        pollId: 2n,
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      await verify({
        ...(await verifyArgs(signer)),
        pollId: 2n,
        tallyData,
        maciAddress: maciAddresses.maciAddress,
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
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciAddress,
        verifierContractAddress: maciAddresses.verifierAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
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
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciAddress, signer });
      await generateMaciState({
        maciAddress: maciAddresses.maciAddress,
        outputPath: stateOutPath,
        coordinatorPrivateKey: coordinatorPrivKey,
        blockPerBatch: 50,
        pollId: 0n,
        signer,
        ipfsMessageBackupFiles,
      });
      await generateProofs({
        ...generateProofsArgs,
        stateFile: stateOutPath,
        maciAddress: maciAddresses.maciAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
    });
  });
});
