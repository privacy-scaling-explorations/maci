import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import {
  generateVote,
  getBlockTimestamp,
  getDefaultSigner,
  signup,
  mergeSignups,
  verify,
  setVerifyingKeys,
  EMode,
  proveOnChain,
  publish,
  deployPoll,
  generateProofs,
  deployVkRegistryContract,
  timeTravel,
  type IGenerateProofsArgs,
  isArm,
  deployMaci,
  IMaciContracts,
  deployFreeForAllSignUpGatekeeper,
  deployConstantInitialVoiceCreditProxy,
  deployVerifier,
} from "maci-sdk";

import type { Signer } from "ethers";

import {
  DEFAULT_INITIAL_VOICE_CREDITS,
  DEFAULT_SG_DATA,
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
  testProcessMessagesNonQvWitnessPath,
  testProcessMessagesNonQvWitnessDatPath,
  testTallyVotesNonQvWitnessPath,
  testTallyVotesNonQvWitnessDatPath,
  testProcessMessagesNonQvWasmPath,
  testTallyVotesNonQvWasmPath,
  processMessageTestNonQvZkeyPath,
  tallyVotesTestNonQvZkeyPath,
  coordinatorKeypair,
  verifyingKeysArgs,
} from "../constants";
import { clean, getBackupFilenames, relayTestMessages } from "../utils";

/**
 Test scenarios:
    1 signup, 1 message with quadratic voting disabled
    1 signup, 1 relayed message
 */
describe("e2e tests with non quadratic voting", function test() {
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
    tallyZkey: tallyVotesTestNonQvZkeyPath,
    processZkey: processMessageTestNonQvZkeyPath,
    pollId: 0n,
    rapidsnark: testRapidsnarkPath,
    processWitgen: testProcessMessagesNonQvWitnessPath,
    processDatFile: testProcessMessagesNonQvWitnessDatPath,
    tallyWitgen: testTallyVotesNonQvWitnessPath,
    tallyDatFile: testTallyVotesNonQvWitnessDatPath,
    coordinatorPrivateKey: coordinatorPrivKey,
    processWasm: testProcessMessagesNonQvWasmPath,
    tallyWasm: testTallyVotesNonQvWasmPath,
    useWasm,
    useQuadraticVoting: false,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    vkRegistryAddress = await deployVkRegistryContract({ signer });

    const initialVoiceCreditProxy = await deployConstantInitialVoiceCreditProxy(
      DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );
    initialVoiceCreditProxyContractAddress = await initialVoiceCreditProxy.getAddress();

    const verifier = await deployVerifier(signer, true);
    verifierContractAddress = await verifier.getAddress();

    // we deploy the vk registry contract
    vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer, EMode.NON_QV)), vkRegistryAddress });
  });

  describe("1 signup, 1 message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      const signupGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);
      const signupGatekeeperContractAddress = await signupGatekeeper.getAddress();

      const pollGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);
      const pollGatekeeperContractAddress = await pollGatekeeper.getAddress();

      // deploy the smart contracts
      maciAddresses = await deployMaci({
        ...deployArgs,
        signer,
        signupGatekeeperAddress: signupGatekeeperContractAddress,
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
        gatekeeperContractAddress: pollGatekeeperContractAddress,
        initialVoiceCreditProxyContractAddress,
        mode: EMode.NON_QV,
      });
    });

    it("should signup one user", async () => {
      await signup({
        maciAddress: maciAddresses.maciContractAddress,
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
        maciAddress: maciAddresses.maciContractAddress,
        salt: genRandomSalt(),
        privateKey: user.privKey.serialize(),
        signer,
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        signer,
        maciAddress: maciAddresses.maciContractAddress,
        useQuadraticVoting: false,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await verify({
        ...(await verifyArgs(signer)),
        tallyData: tallyFileData,
        maciAddress: tallyFileData.maci,
      });
    });
  });

  describe("1 signup, 1 relayed message", () => {
    after(async () => {
      await clean();
    });

    const user = new Keypair();

    before(async () => {
      const signupGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);
      const signupGatekeeperContractAddress = await signupGatekeeper.getAddress();

      const pollGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);
      const pollGatekeeperContractAddress = await pollGatekeeper.getAddress();

      // deploy the smart contracts
      maciAddresses = await deployMaci({
        ...deployArgs,
        signer,
        signupGatekeeperAddress: signupGatekeeperContractAddress,
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
        gatekeeperContractAddress: pollGatekeeperContractAddress,
        initialVoiceCreditProxyContractAddress,
        mode: EMode.NON_QV,
      });
    });

    it("should signup one user", async () => {
      await signup({
        maciAddress: maciAddresses.maciContractAddress,
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
          maciAddress: maciAddresses.maciContractAddress,
          poll: 0,
          data: message.data.map(String),
          publicKey: ephemeralKeypair.pubKey.asArray().map(String),
          hash: message.hash(ephemeralKeypair.pubKey).toString(),
        },
      ];

      await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciContractAddress });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      const ipfsMessageBackupFiles = await getBackupFilenames();
      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      const { tallyData: tallyFileData } = await generateProofs({
        ...generateProofsArgs,
        signer,
        maciAddress: maciAddresses.maciContractAddress,
        ipfsMessageBackupFiles,
        useQuadraticVoting: false,
      });
      await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
      await verify({
        ...(await verifyArgs(signer)),
        tallyData: tallyFileData,
        maciAddress: tallyFileData.maci,
      });
    });
  });
});
