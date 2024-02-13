import { getDefaultSigner } from "maci-contracts";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import type { Signer } from "ethers";

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

  const pollDuration = 60000;

  const subsidyEnabled = false;

  const useWasm = isArm();
  this.timeout(90000000);

  let maciAddresses: DeployedContracts;
  let signer: Signer;

  const verifyingKeysArgs: Omit<SetVerifyingKeysArgs, "signer"> = {
    quiet: true,
    stateTreeDepth,
    intStateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchDepth,
    processMessagesZkeyPath: ceremonyProcessMessageZkeyPath,
    tallyVotesZkeyPath: ceremonyTallyVotesZkeyPath,
  };

  const ceremonyDeployArgs: Omit<DeployArgs, "signer"> = {
    stateTreeDepth,
  };

  const deployPollArgs: Omit<DeployPollArgs, "signer"> = {
    pollDuration,
    intStateTreeDepth,
    messageTreeSubDepth: messageBatchDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    coordinatorPubkey: coordinatorPubKey,
    subsidyEnabled,
  };

  const genProofsCeremonyArgs: Omit<GenProofsArgs, "signer"> = {
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
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...verifyingKeysArgs, signer });
  });

  const users = Array<Keypair>(2).fill(new Keypair());

  describe("1 user, 2 messages", () => {
    after(() => {
      cleanVanilla();
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
          maciContractAddress: maciAddresses.maciAddress,
          salt: genRandomSalt(),
          privateKey: users[0].privKey.serialize(),
          pollId: 0n,
          signer,
        });
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel({ seconds: pollDuration, signer });
      await mergeMessages({ ...mergeMessagesArgs, signer });
      await mergeSignups({ ...mergeSignupsArgs, signer });
      await genProofs({ ...genProofsCeremonyArgs, signer });
      await proveOnChain({ ...proveOnChainArgs, signer });
      await verify({ ...verifyArgs(), signer });
    });
  });
});
