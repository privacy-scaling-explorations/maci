import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

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
import { DeployArgs, DeployPollArgs, DeployedContracts, GenProofsArgs, SetVerifyingKeysArgs } from "../../ts/utils";
import {
  coordinatorPrivKey,
  coordinatorPubKey,
  ceremonyProcessMessageZkeyPath,
  ceremonyTallyVotesZkeyPath,
  ceremonyProcessMessagesWasmPath,
  cermeonyProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  ceremonyTallyVotesWasmPath,
  ceremonyTallyVotesWitnessPath,
  mergeMessagesArgs,
  mergeSignupsArgs,
  proveOnChainArgs,
  verifyArgs,
  ceremonyProcessMessagesDatPath,
  ceremonyTallyVotesDatPath,
} from "../constants";
import { cleanVanilla, isArm } from "../utils";

describe("stress tests", function test() {
  const messageTreeDepth = 8;
  const stateTreeDepth = 6;
  const voteOptionTreeDepth = 3;
  const messageBatchDepth = 2;
  const intStateTreeDepth = 2;
  const maxVoteOptions = 5 ** voteOptionTreeDepth;

  const maxMessages = 5 ** messageTreeDepth;
  const pollDuration = 60000;

  const subsidyEnabled = false;

  const useWasm = isArm();
  this.timeout(90000000);

  let maciAddresses: DeployedContracts;

  const verifyingKeysArgs: SetVerifyingKeysArgs = {
    quiet: true,
    stateTreeDepth,
    intStateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchDepth,
    processMessagesZkeyPath: ceremonyProcessMessageZkeyPath,
    tallyVotesZkeyPath: ceremonyTallyVotesZkeyPath,
  };

  const ceremonyDeployArgs: DeployArgs = {
    stateTreeDepth,
  };

  const deployPollArgs: DeployPollArgs = {
    pollDuration,
    maxMessages,
    maxVoteOptions,
    intStateTreeDepth,
    messageTreeSubDepth: messageBatchDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    coordinatorPubkey: coordinatorPubKey,
    subsidyEnabled,
  };

  /*

        testProofsDirPath,
        testTallyFilePath,
        ceremonyTallyVotesZkeyPath,
        ceremonyProcessMessageZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        cermeonyProcessMessagesWitnessPath,
        ceremonyTallyVotesWitnessPath,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        ceremonyProcessMessagesWasmPath,
        ceremonyTallyVotesWasmPath,
        undefined,
        useWasm,
        undefined,
        undefined,
        undefined,
        undefined,
        300,
      
  */
  const genProofsCeremonyArgs: GenProofsArgs = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: ceremonyTallyVotesZkeyPath,
    processZkey: ceremonyProcessMessageZkeyPath,
    pollId: 0n,
    useWasm,
    coordinatorPrivKey,
    rapidsnark: testRapidsnarkPath,
    processWitgen: cermeonyProcessMessagesWitnessPath,
    tallyWitgen: ceremonyTallyVotesWitnessPath,
    processWasm: ceremonyProcessMessagesWasmPath,
    tallyWasm: ceremonyTallyVotesWasmPath,
    processDatFile: ceremonyProcessMessagesDatPath,
    tallyDatFile: ceremonyTallyVotesDatPath,
    // sleep 5 seconds
    sleepFetch: 5000,
    blocksPerBatch: 25,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    // we deploy the vk registry contract
    await deployVkRegistryContract(true);
    // we set the verifying keys
    await setVerifyingKeys(verifyingKeysArgs);
  });

  const users = Array<Keypair>(100).fill(new Keypair());

  describe("1 user, 2 messages", () => {
    after(() => {
      cleanVanilla();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(ceremonyDeployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
    });

    it("should signup 1 user", async () => {
      await signup({ maciPubKey: users[0].pubKey.serialize() });
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
          maciContractAddress: maciAddresses.maciAddress,
          salt: genRandomSalt(),
          privateKey: users[0].privKey.serialize(),
          pollId: 0n,
        });
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(mergeMessagesArgs);
      await mergeSignups(mergeSignupsArgs);
      await genProofs(genProofsCeremonyArgs);
      await proveOnChain(proveOnChainArgs);
      await verify(verifyArgs);
    });
  });

  describe.only("100 signups, 100 messages", () => {
    after(() => {
      cleanVanilla();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(ceremonyDeployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
    });

    it("should signup 100 users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup({ maciPubKey: users[i].pubKey.serialize() });
      }
    });

    it("should publish 100 messages", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        const randomVoteOption = BigInt(Math.floor(Math.random() * 126));
        const randomVoteWeight = BigInt(Math.floor(Math.random() * 10));
        // eslint-disable-next-line no-await-in-loop
        await publish({
          pubkey: users[0].pubKey.serialize(),
          stateIndex: BigInt(i) + 1n,
          voteOptionIndex: randomVoteOption,
          nonce: 1n,
          newVoteWeight: randomVoteWeight,
          maciContractAddress: maciAddresses.maciAddress,
          salt: genRandomSalt(),
          privateKey: users[0].privKey.serialize(),
          pollId: 0n,
        });
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(mergeMessagesArgs);
      await mergeSignups(mergeSignupsArgs);
      await genProofs(genProofsCeremonyArgs);
      await proveOnChain(proveOnChainArgs);
      await verify(verifyArgs);
    });
  });

  // describe("50 signups, 200 messages", () => {
  //   after(() => {
  //     cleanVanilla();
  //   });

  //   before(async () => {
  //     // deploy the smart contracts
  //     maciAddresses = await deploy(stateTreeDepth);
  //     // deploy a poll contract
  //     pollAddresses = await deployPoll(
  //       pollDuration,
  //       maxMessages,
  //       maxVoteOptions,
  //       intStateTreeDepth,
  //       messageBatchDepth,
  //       messageTreeDepth,
  //       voteOptionTreeDepth,
  //       coordinatorPubKey,
  //       subsidyEnabled,
  //     );
  //   });

  //   it("should signup 50 users", async () => {
  //     // eslint-disable-next-line @typescript-eslint/prefer-for-of
  //     for (let i = 0; i < 50; i += 1) {
  //       // eslint-disable-next-line no-await-in-loop
  //       await signup(users[i].pubKey.serialize());
  //     }
  //   });

  //   it("should publish 200 messages (some for non signed up users)", async () => {
  //     for (let i = 0; i < 2; i += 1) {
  //       // eslint-disable-next-line @typescript-eslint/prefer-for-of
  //       for (let j = 0; j < users.length; j += 1) {
  //         const randomVoteOption = Math.floor(Math.random() * 126);
  //         const randomVoteWeight = Math.floor(Math.random() * 10);
  //         // eslint-disable-next-line no-await-in-loop
  //         await publish(
  //           users[j].pubKey.serialize(),
  //           j + 1,
  //           randomVoteOption,
  //           1,
  //           0,
  //           randomVoteWeight,
  //           maciAddresses.maciAddress,
  //           genRandomSalt().toString(),
  //           users[j].privKey.serialize(),
  //         );
  //       }
  //     }
  //   });

  //   it("should generate zk-SNARK proofs and verify them", async () => {
  //     await timeTravel(pollDuration);
  //     await mergeMessages(0, maciAddresses.maciAddress);
  //     await mergeSignups(0, maciAddresses.maciAddress);
  //     const tallyFileData = await genProofs(
  //       testProofsDirPath,
  //       testTallyFilePath,
  //       ceremonyTallyVotesZkeyPath,
  //       ceremonyProcessMessageZkeyPath,
  //       0,
  //       undefined,
  //       undefined,
  //       testRapidsnarkPath,
  //       cermeonyProcessMessagesWitnessPath,
  //       ceremonyTallyVotesWitnessPath,
  //       undefined,
  //       coordinatorPrivKey,
  //       maciAddresses.maciAddress,
  //       undefined,
  //       ceremonyProcessMessagesWasmPath,
  //       ceremonyTallyVotesWasmPath,
  //       undefined,
  //       useWasm,
  //       undefined,
  //       undefined,
  //       undefined,
  //       undefined,
  //       300,
  //     );
  //     await proveOnChain("0", testProofsDirPath, subsidyEnabled);
  //     await verify(
  //       "0",
  //       subsidyEnabled,
  //       testTallyFilePath,
  //       tallyFileData,
  //       maciAddresses.maciAddress,
  //       pollAddresses.tally,
  //     );
  //   });
  // });

  // describe("1000 signups, 5000 messages", () => {
  //   const thousandUsers = Array<Keypair>(1000).fill(new Keypair());

  //   after(() => {
  //     cleanVanilla();
  //   });

  //   before(async () => {
  //     // deploy the smart contracts
  //     maciAddresses = await deploy(stateTreeDepth);
  //     // deploy a poll contract
  //     pollAddresses = await deployPoll(
  //       pollDuration,
  //       maxMessages,
  //       maxVoteOptions,
  //       intStateTreeDepth,
  //       messageBatchDepth,
  //       messageTreeDepth,
  //       voteOptionTreeDepth,
  //       coordinatorPubKey,
  //       subsidyEnabled,
  //     );
  //   });

  //   it("should signup 1000 users", async () => {
  //     // eslint-disable-next-line @typescript-eslint/prefer-for-of
  //     for (let i = 0; i < thousandUsers.length; i += 1) {
  //       // eslint-disable-next-line no-await-in-loop
  //       await signup(thousandUsers[i].pubKey.serialize());
  //     }
  //   });

  //   it("should publish 5000 messages (some for non signed up users)", async () => {
  //     for (let i = 0; i < 5; i += 1) {
  //       // eslint-disable-next-line @typescript-eslint/prefer-for-of
  //       for (let j = 0; j < thousandUsers.length; j += 1) {
  //         const randomVoteOption = Math.floor(Math.random() * 126);
  //         const randomVoteWeight = Math.floor(Math.random() * 10);
  //         // eslint-disable-next-line no-await-in-loop
  //         await publish(
  //           thousandUsers[j].pubKey.serialize(),
  //           j + 1,
  //           randomVoteOption,
  //           1,
  //           0,
  //           randomVoteWeight,
  //           maciAddresses.maciAddress,
  //           genRandomSalt().toString(),
  //           thousandUsers[j].privKey.serialize(),
  //         );
  //       }
  //     }
  //   });

  //   it("should generate zk-SNARK proofs and verify them", async () => {
  //     await timeTravel(pollDuration);
  //     await mergeMessages(0, maciAddresses.maciAddress);
  //     await mergeSignups(0, maciAddresses.maciAddress);
  //     const tallyFileData = await genProofs(
  //       testProofsDirPath,
  //       testTallyFilePath,
  //       ceremonyTallyVotesZkeyPath,
  //       ceremonyProcessMessageZkeyPath,
  //       0,
  //       undefined,
  //       undefined,
  //       testRapidsnarkPath,
  //       cermeonyProcessMessagesWitnessPath,
  //       ceremonyTallyVotesWitnessPath,
  //       undefined,
  //       coordinatorPrivKey,
  //       maciAddresses.maciAddress,
  //       undefined,
  //       ceremonyProcessMessagesWasmPath,
  //       ceremonyTallyVotesWasmPath,
  //       undefined,
  //       useWasm,
  //       undefined,
  //       undefined,
  //       undefined,
  //       undefined,
  //       300,
  //     );
  //     await proveOnChain("0", testProofsDirPath, subsidyEnabled);
  //     await verify(
  //       "0",
  //       subsidyEnabled,
  //       testTallyFilePath,
  //       tallyFileData,
  //       maciAddresses.maciAddress,
  //       pollAddresses.tally,
  //     );
  //   });
  // });
});
