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
  extractAllVks,
  proveOnChain,
  publish,
  deployPoll,
  generateProofs,
  deployVkRegistryContract,
  timeTravel,
  type IGenerateProofsArgs,
  isArm,
  deployMaci,
  type IMaciContracts,
  deployVerifier,
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
} from "maci-sdk";

import type { Signer } from "ethers";

import { DEFAULT_INITIAL_VOICE_CREDITS, DEFAULT_SG_DATA } from "../../ts/utils";
import {
  coordinatorPrivKey,
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
  coordinatorKeypair,
  verifyingKeysArgs,
  ceremonyPollJoiningZkeyPath,
  ceremonyPollJoinedZkeyPath,
  deployPollArgs,
} from "../constants";
import { clean, getBackupFilenames, relayTestMessages } from "../utils";

describe("Stress tests with ceremony params (6,3,2,20)", function test() {
  const stateTreeDepth = 6;
  const voteOptionTreeDepth = 3;
  const intStateTreeDepth = 2;
  const messageBatchSize = 20;

  const pollDuration = 60000;

  const useWasm = isArm();
  this.timeout(90000000);

  let maciAddresses: IMaciContracts;
  let vkRegistryAddress: string;
  let signupGatekeeperContractAddress: string;
  let initialVoiceCreditProxyContractAddress: string;
  let verifierContractAddress: string;
  let signer: Signer;

  const generateProofsCeremonyArgs: Omit<IGenerateProofsArgs, "maciAddress" | "signer"> = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: ceremonyTallyVotesZkeyPath,
    processZkey: ceremonyProcessMessagesZkeyPath,
    pollId: 0n,
    useWasm,
    coordinatorPrivateKey: coordinatorPrivKey,
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

      const signupGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);
      signupGatekeeperContractAddress = await signupGatekeeper.getAddress();

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
      await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });
    });

    describe("1 user, 2 messages, 2 relayed messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deployMaci({
          stateTreeDepth,
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
          intStateTreeDepth,
          messageBatchSize,
          voteOptionTreeDepth,
          maciAddress: maciAddresses.maciContractAddress,
          verifierContractAddress,
          vkRegistryContractAddress: vkRegistryAddress,
          gatekeeperContractAddress: signupGatekeeperContractAddress,
          initialVoiceCreditProxyContractAddress,
        });
      });

      it("should signup 1 user", async () => {
        await signup({
          maciAddress: maciAddresses.maciContractAddress,
          maciPubKey: users[0].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
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
            maciAddress: maciAddresses.maciContractAddress,
            salt: genRandomSalt(),
            privateKey: users[0].privKey.serialize(),
            pollId: 0n,
            signer,
          });
        }
      });

      it("should relay 2 messages", async () => {
        const votes = [
          {
            pollId: 0n,
            voteOptionIndex: BigInt(Math.floor(Math.random() * 126)),
            salt: genRandomSalt(),
            nonce: 1n,
            privateKey: users[0].privKey,
            stateIndex: 1n,
            voteWeight: BigInt(Math.floor(Math.random() * 10)),
            coordinatorPubKey: coordinatorKeypair.pubKey,
            maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
            newPubKey: users[0].pubKey,
          },
          {
            pollId: 0n,
            voteOptionIndex: BigInt(Math.floor(Math.random() * 126)),
            salt: genRandomSalt(),
            nonce: 1n,
            privateKey: users[0].privKey,
            stateIndex: 2n,
            voteWeight: BigInt(Math.floor(Math.random() * 10)),
            coordinatorPubKey: coordinatorKeypair.pubKey,
            maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
            newPubKey: users[0].pubKey,
          },
        ];

        const messages = votes
          .map((vote) => generateVote(vote))
          .map(({ message, ephemeralKeypair }) => ({
            maciAddress: maciAddresses.maciContractAddress,
            poll: 0,
            data: message.data.map(String),
            publicKey: ephemeralKeypair.pubKey.asArray().map(String),
            hash: message.hash(ephemeralKeypair.pubKey).toString(),
          }));

        await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciContractAddress });
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        const ipfsMessageBackupFiles = await getBackupFilenames();
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await generateProofs({
          ...generateProofsCeremonyArgs,
          signer,
          ipfsMessageBackupFiles,
          maciAddress: maciAddresses.maciContractAddress,
        });
        await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await verify({ ...(await verifyArgs(signer)) });
      });
    });

    describe("25 signups, 100 messages, 100 relayed messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deployMaci({
          stateTreeDepth,
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
          intStateTreeDepth,
          messageBatchSize,
          voteOptionTreeDepth,
          maciAddress: maciAddresses.maciContractAddress,
          verifierContractAddress,
          vkRegistryContractAddress: vkRegistryAddress,
          gatekeeperContractAddress: signupGatekeeperContractAddress,
          initialVoiceCreditProxyContractAddress,
        });
      });

      it("should signup 25 users", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < 25; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await signup({
            maciAddress: maciAddresses.maciContractAddress,
            maciPubKey: users[i].pubKey.serialize(),
            sgData: DEFAULT_SG_DATA,
            signer,
          });
        }
      });

      it("should relay 100 messages", async () => {
        const messages = new Array(100)
          .fill(0)
          .map((_, index) =>
            generateVote({
              pollId: 0n,
              voteOptionIndex: BigInt(Math.floor(Math.random() * 126)),
              salt: genRandomSalt(),
              nonce: 1n,
              privateKey: users[index].privKey,
              stateIndex: BigInt(index) + 1n,
              voteWeight: BigInt(Math.floor(Math.random() * 10)),
              coordinatorPubKey: coordinatorKeypair.pubKey,
              maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
              newPubKey: users[index].pubKey,
            }),
          )
          .map(({ message, ephemeralKeypair }) => ({
            maciAddress: maciAddresses.maciContractAddress,
            poll: 0,
            data: message.data.map(String),
            publicKey: ephemeralKeypair.pubKey.asArray().map(String),
            hash: message.hash(ephemeralKeypair.pubKey).toString(),
          }));

        await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciContractAddress });
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
            maciAddress: maciAddresses.maciContractAddress,
            salt: genRandomSalt(),
            privateKey: users[i].privKey.serialize(),
            signer,
          });
        }
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        const ipfsMessageBackupFiles = await getBackupFilenames();
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await generateProofs({
          ...generateProofsCeremonyArgs,
          signer,
          ipfsMessageBackupFiles,
          maciAddress: maciAddresses.maciContractAddress,
        });
        await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await verify({ ...(await verifyArgs(signer)) });
      });
    });
  });

  describe("non quadratic voting", () => {
    const generateProofsArgs: Omit<IGenerateProofsArgs, "maciAddress" | "signer"> = {
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
      coordinatorPrivateKey: coordinatorPrivKey,
      processWasm: ceremonyProcessMessagesNonQvWasmPath,
      tallyWasm: ceremonyTallyVotesNonQvWasmPath,
      useWasm,
      useQuadraticVoting: false,
    };

    // before all tests we deploy the vk registry contract and set the verifying keys
    before(async () => {
      signer = await getDefaultSigner();

      const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
        pollJoiningZkeyPath: ceremonyPollJoiningZkeyPath,
        pollJoinedZkeyPath: ceremonyPollJoinedZkeyPath,
        processMessagesZkeyPath: ceremonyProcessMessagesZkeyPath,
        tallyVotesZkeyPath: ceremonyProcessMessagesNonQvZkeyPath,
      });

      // we deploy the vk registry contract
      vkRegistryAddress = await deployVkRegistryContract({ signer });
      // we set the verifying keys
      await setVerifyingKeys({
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
        pollJoiningVk: pollJoiningVk!,
        pollJoinedVk: pollJoinedVk!,
        processMessagesVk: processVk!,
        tallyVotesVk: tallyVk!,
        mode: EMode.QV,
        vkRegistryAddress,
        signer,
      });
    });

    describe("1 signup, 1 message, 1 relayed message", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deployMaci({
          stateTreeDepth,
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
          intStateTreeDepth,
          messageBatchSize,
          voteOptionTreeDepth,
          maciAddress: maciAddresses.maciContractAddress,
          verifierContractAddress,
          vkRegistryContractAddress: vkRegistryAddress,
          gatekeeperContractAddress: signupGatekeeperContractAddress,
          initialVoiceCreditProxyContractAddress,
          mode: EMode.NON_QV,
        });
      });

      it("should signup one user", async () => {
        await signup({
          maciAddress: maciAddresses.maciContractAddress,
          maciPubKey: users[0].pubKey.serialize(),
          sgData: DEFAULT_SG_DATA,
          signer,
        });
      });

      it("should publish one message", async () => {
        await publish({
          pubkey: users[0].pubKey.serialize(),
          stateIndex: 1n,
          voteOptionIndex: 0n,
          nonce: 1n,
          pollId: 0n,
          newVoteWeight: 9n,
          maciAddress: maciAddresses.maciContractAddress,
          salt: genRandomSalt(),
          privateKey: users[0].privKey.serialize(),
          signer,
        });
      });

      it("should relay one message", async () => {
        const votes = [
          {
            pollId: 0n,
            voteOptionIndex: 0n,
            salt: genRandomSalt(),
            nonce: 1n,
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
            maciAddress: maciAddresses.maciContractAddress,
            poll: 0,
            data: message.data.map(String),
            publicKey: ephemeralKeypair.pubKey.asArray().map(String),
            hash: message.hash(ephemeralKeypair.pubKey).toString(),
          }));

        await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciContractAddress });
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        const ipfsMessageBackupFiles = await getBackupFilenames();
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        const { tallyData } = await generateProofs({
          ...generateProofsArgs,
          signer,
          ipfsMessageBackupFiles,
          maciAddress: maciAddresses.maciContractAddress,
          useQuadraticVoting: false,
        });
        await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await verify({
          ...(await verifyArgs(signer)),
          tallyData,
          maciAddress: maciAddresses.maciContractAddress,
        });
      });
    });

    describe("25 signups, 100 messages, 100 relayed messages", () => {
      after(async () => {
        await clean();
      });

      before(async () => {
        // deploy the smart contracts
        maciAddresses = await deployMaci({
          stateTreeDepth,
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
          intStateTreeDepth,
          messageBatchSize,
          voteOptionTreeDepth,
          maciAddress: maciAddresses.maciContractAddress,
          verifierContractAddress,
          vkRegistryContractAddress: vkRegistryAddress,
          gatekeeperContractAddress: signupGatekeeperContractAddress,
          initialVoiceCreditProxyContractAddress,
          mode: EMode.NON_QV,
        });
      });

      it("should signup 25 users", async () => {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < 25; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await signup({
            maciAddress: maciAddresses.maciContractAddress,
            maciPubKey: users[i].pubKey.serialize(),
            sgData: DEFAULT_SG_DATA,
            signer,
          });
        }
      });

      it("should relay 100 messages", async () => {
        const messages = new Array(100)
          .fill(0)
          .map((_, index) =>
            generateVote({
              pollId: 0n,
              voteOptionIndex: BigInt(Math.floor(Math.random() * 126)),
              salt: genRandomSalt(),
              nonce: 1n,
              privateKey: users[index].privKey,
              stateIndex: BigInt(index) + 1n,
              voteWeight: BigInt(Math.floor(Math.random() * 10)),
              coordinatorPubKey: coordinatorKeypair.pubKey,
              maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** deployPollArgs.voteOptionTreeDepth),
              newPubKey: users[index].pubKey,
            }),
          )
          .map(({ message, ephemeralKeypair }) => ({
            maciAddress: maciAddresses.maciContractAddress,
            poll: 0,
            data: message.data.map(String),
            publicKey: ephemeralKeypair.pubKey.asArray().map(String),
            hash: message.hash(ephemeralKeypair.pubKey).toString(),
          }));

        await relayTestMessages({ messages, signer, pollId: 0, maciAddress: maciAddresses.maciContractAddress });
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
            maciAddress: maciAddresses.maciContractAddress,
            salt: genRandomSalt(),
            privateKey: users[i].privKey.serialize(),
            signer,
          });
        }
      });

      it("should generate zk-SNARK proofs and verify them", async () => {
        const ipfsMessageBackupFiles = await getBackupFilenames();
        await timeTravel({ seconds: pollDuration, signer });
        await mergeSignups({ ...mergeSignupsArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        const { tallyData } = await generateProofs({
          ...generateProofsArgs,
          signer,
          maciAddress: maciAddresses.maciContractAddress,
          ipfsMessageBackupFiles,
          useQuadraticVoting: false,
        });
        await proveOnChain({ ...proveOnChainArgs, maciAddress: maciAddresses.maciContractAddress, signer });
        await verify({
          ...(await verifyArgs(signer)),
          tallyData,
        });
      });
    });
  });
});
