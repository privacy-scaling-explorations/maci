import { VOTE_OPTION_TREE_ARITY } from "@maci-protocol/core";
import { genRandomSalt } from "@maci-protocol/crypto";
import { Keypair } from "@maci-protocol/domainobjs";
import {
  generateVote,
  getBlockTimestamp,
  getDefaultSigner,
  signup,
  mergeSignups,
  verify,
  setVerifyingKeys,
  joinPoll,
  proveOnChain,
  publish,
  generateProofs,
  deployPoll,
  deployVkRegistryContract,
  timeTravel,
  type IGenerateProofsArgs,
  type ITallyData,
  isArm,
  deployMaci,
  IMaciContracts,
  deployFreeForAllSignUpPolicy,
  deployConstantInitialVoiceCreditProxy,
  deployVerifier,
} from "@maci-protocol/sdk";
import { expect } from "chai";

import fs from "fs";

import type { Signer } from "ethers";

import {
  DEFAULT_IVCP_DATA,
  DEFAULT_SG_DATA,
  DEFAULT_INITIAL_VOICE_CREDITS,
  coordinatorPrivKey,
  deployArgs,
  deployPollArgs,
  processMessageTestZkeyPath,
  mergeSignupsArgs,
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
  verifyingKeysArgs,
} from "../constants";
import { clean, getBackupFilenames, relayTestMessages } from "../utils";

describe("keyChange tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: IMaciContracts;
  let initialVoiceCreditProxyContractAddress: string;
  let verifierContractAddress: string;
  let signer: Signer;
  let vkRegistryAddress: string;

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

    const [initialVoiceCreditProxy] = await deployConstantInitialVoiceCreditProxy(
      { amount: DEFAULT_INITIAL_VOICE_CREDITS },
      signer,
      undefined,
      true,
    );
    initialVoiceCreditProxyContractAddress = await initialVoiceCreditProxy.getAddress();

    const verifier = await deployVerifier(signer, true);
    verifierContractAddress = await verifier.getAddress();

    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });
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
      const [signupPolicy, , signupPolicyFactory, signupCheckerFactory] = await deployFreeForAllSignUpPolicy(
        {},
        signer,
        true,
      );
      const signupPolicyContractAddress = await signupPolicy.getAddress();

      const [pollPolicy] = await deployFreeForAllSignUpPolicy(
        {
          policy: signupPolicyFactory,
          checker: signupCheckerFactory,
        },
        signer,
        true,
      );
      const pollPolicyContractAddress = await pollPolicy.getAddress();

      // deploy the smart contracts
      maciAddresses = await deployMaci({
        ...deployArgs,
        signer,
        signupPolicyAddress: signupPolicyContractAddress,
      });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciContractAddress,
        verifierContractAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        policyContractAddress: pollPolicyContractAddress,
        initialVoiceCreditProxyContractAddress,
      });
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciContractAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciContractAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
      });
      await publish({
        pubkey: pollPubKey1.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciContractAddress,
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
          maciAddress: maciAddresses.maciContractAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({
        messages,
        signer,
        pollId: Number(pollId),
        maciAddress: maciAddresses.maciContractAddress,
      });
    });

    it("should publish a message to change the poll key and cast a new vote", async () => {
      await publish({
        pubkey: pollPubKey2.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciContractAddress,
        salt: genRandomSalt(),
        privateKey: pollPrivKey1.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciContractAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as ITallyData;
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
      const [signupPolicy, , signupPolicyFactory, signupCheckerFactory] = await deployFreeForAllSignUpPolicy(
        {},
        signer,
        true,
      );
      const signupPolicyContractAddress = await signupPolicy.getAddress();

      const [pollPolicy] = await deployFreeForAllSignUpPolicy(
        {
          policy: signupPolicyFactory,
          checker: signupCheckerFactory,
        },
        signer,
        true,
      );
      const pollPolicyContractAddress = await pollPolicy.getAddress();

      // deploy the smart contracts
      maciAddresses = await deployMaci({
        ...deployArgs,
        signer,
        signupPolicyAddress: signupPolicyContractAddress,
      });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciContractAddress,
        verifierContractAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        policyContractAddress: pollPolicyContractAddress,
        initialVoiceCreditProxyContractAddress,
      });
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciContractAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciContractAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
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
          maciAddress: maciAddresses.maciContractAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({
        messages,
        signer,
        pollId: Number(pollId),
        maciAddress: maciAddresses.maciContractAddress,
      });
    });

    it("should publish a message to change the key and cast a new vote", async () => {
      await publish({
        pubkey: pollPubKey2.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 1n,
        nonce: initialNonce + 1n,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciAddress: maciAddresses.maciContractAddress,
        salt: genRandomSalt(),
        privateKey: user1Keypair.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciContractAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as ITallyData;
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
      const [signupPolicy, , signupPolicyFactory, signupCheckerFactory] = await deployFreeForAllSignUpPolicy(
        {},
        signer,
        true,
      );
      const signupPolicyContractAddress = await signupPolicy.getAddress();

      const [pollPolicy] = await deployFreeForAllSignUpPolicy(
        {
          policy: signupPolicyFactory,
          checker: signupCheckerFactory,
        },
        signer,
        true,
      );
      const pollPolicyContractAddress = await pollPolicy.getAddress();

      // deploy the smart contracts
      maciAddresses = await deployMaci({
        ...deployArgs,
        signer,
        signupPolicyAddress: signupPolicyContractAddress,
      });

      const startDate = await getBlockTimestamp(signer);

      // deploy a poll contract
      await deployPoll({
        ...deployPollArgs,
        signer,
        pollStartTimestamp: startDate,
        pollEndTimestamp: startDate + pollDuration,
        relayers: [await signer.getAddress()],
        maciAddress: maciAddresses.maciContractAddress,
        verifierContractAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        policyContractAddress: pollPolicyContractAddress,
        initialVoiceCreditProxyContractAddress,
      });
      stateIndex = BigInt(
        await signup({
          maciAddress: maciAddresses.maciContractAddress,
          maciPubKey: user1Keypair.pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        }).then((result) => result.stateIndex),
      );
      await joinPoll({
        maciAddress: maciAddresses.maciContractAddress,
        privateKey: user1Keypair.privKey.serialize(),
        stateIndex,
        pollId,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        useWasm: true,
        pollWasm: testPollJoiningWasmPath,
        pollWitgen: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
        signer,
      });

      await publish({
        pubkey: user1Keypair.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciAddress: maciAddresses.maciContractAddress,
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
          maciAddress: maciAddresses.maciContractAddress,
          poll: Number(pollId),
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        }));

      await relayTestMessages({
        messages,
        signer,
        pollId: Number(pollId),
        maciAddress: maciAddresses.maciContractAddress,
      });
    });

    it("should publish a message to change the poll key, and a new vote", async () => {
      await publish({
        pubkey: secondKeypair.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 2n,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 3n,
        maciAddress: maciAddresses.maciContractAddress,
        salt: genRandomSalt(),
        privateKey: user1Keypair.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ ...timeTravelArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await generateProofs({
        ...generateProofsArgs,
        maciAddress: maciAddresses.maciContractAddress,
        signer,
        ipfsMessageBackupFiles,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await verify({ ...(await verifyArgs(signer)) });
    });

    it("should confirm the tally is correct", async () => {
      const tallyData = JSON.parse(
        await fs.promises.readFile(testTallyFilePath).then((res) => res.toString()),
      ) as ITallyData;
      expect(tallyData.results.tally[2]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits?.tally[2]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });
});
