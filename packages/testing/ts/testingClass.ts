import hardhat from "hardhat";
import { joinPoll, setVerifyingKeysCli } from "maci-cli";
import { Keypair } from "maci-domainobjs";
import { genMaciStateFromContract, deployPoll, deployVkRegistry, EMode, deployVerifier, signup } from "maci-sdk";

import {
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  VOTE_OPTIONS,
  VOTE_OPTION_TREE_DEPTH,
  pollJoinedTestZkeyPath,
  pollJoiningTestZkeyPath,
  processMessageTestNonQvZkeyPath,
  processMessageTestZkeyPath,
  tallyVotesTestNonQvZkeyPath,
  tallyVotesTestZkeyPath,
  testPollJoiningWasmPath,
  testPollJoiningWitnessPath,
  testRapidsnarkPath,
} from "./constants";
import { deployMaciContracts } from "./utils";

interface IContractsData {
  initialized: boolean;
  user?: Keypair;
  voiceCredits?: number;
  timestamp?: number;
  stateLeafIndex?: number;
  maciContractAddress?: string;
  maciState?: Awaited<ReturnType<typeof genMaciStateFromContract>>;
  pollId?: bigint;
  coordinatorKeypair?: Keypair;
}

const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export class TestDeploy {
  private static INSTANCE?: TestDeploy;

  readonly contractsData: IContractsData = {
    initialized: false,
  };

  static async getInstance(): Promise<TestDeploy> {
    if (!TestDeploy.INSTANCE) {
      TestDeploy.INSTANCE = new TestDeploy();
      await TestDeploy.INSTANCE.contractsInit();
    }

    return TestDeploy.INSTANCE;
  }

  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async contractsInit(): Promise<void> {
    if (this.contractsData.initialized) {
      return;
    }

    const [signer] = await hardhat.ethers.getSigners();
    const coordinatorKeypair = new Keypair();
    const user = new Keypair();

    const vkRegistry = await deployVkRegistry(signer, true);
    const vkRegistryAddress = await vkRegistry.getAddress();
    await setVerifyingKeysCli({
      quiet: true,
      vkRegistry: vkRegistryAddress,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      processMessagesZkeyPathQv: processMessageTestZkeyPath,
      processMessagesZkeyPathNonQv: processMessageTestNonQvZkeyPath,
      tallyVotesZkeyPathQv: tallyVotesTestZkeyPath,
      tallyVotesZkeyPathNonQv: tallyVotesTestNonQvZkeyPath,
      pollJoiningZkeyPath: pollJoiningTestZkeyPath,
      pollJoinedZkeyPath: pollJoinedTestZkeyPath,
      useQuadraticVoting: false,
      signer,
    });

    const maciAddresses = await deployMaciContracts(signer);

    const verifier = await deployVerifier(signer, true);

    const startDate = Math.floor(Date.now() / 1000) + 30;

    await deployPoll({
      pollStartTimestamp: startDate,
      pollEndTimestamp: startDate + 130,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubKey: coordinatorKeypair.pubKey,
      mode: EMode.NON_QV,
      relayers: [await signer.getAddress()],
      signer,
      maciContractAddress: maciAddresses.maciAddress,
      verifierContractAddress: await verifier.getAddress(),
      vkRegistryContractAddress: vkRegistryAddress,
      gatekeeperContractAddress: maciAddresses.signupGatekeeper,
      initialVoiceCreditProxyContractAddress: maciAddresses.voiceCreditProxy,
      voteOptions: VOTE_OPTIONS,
    });

    await signup({
      maciAddress: maciAddresses.maciAddress,
      maciPubKey: user.pubKey.serialize(),
      sgData: DEFAULT_SG_DATA,
      signer,
    });

    const { pollStateIndex, timestamp, voiceCredits } = await joinPoll({
      maciAddress: maciAddresses.maciAddress,
      pollId: 0n,
      privateKey: user.privKey.serialize(),
      stateIndex: 1n,
      pollJoiningZkey: pollJoiningTestZkeyPath,
      pollWasm: testPollJoiningWasmPath,
      pollWitgen: testPollJoiningWitnessPath,
      rapidsnark: testRapidsnarkPath,
      signer,
      useWasm: true,
      quiet: true,
    });

    const maciState = await genMaciStateFromContract({
      provider: signer.provider,
      address: maciAddresses.maciAddress,
      coordinatorKeypair,
      pollId: 0n,
    });

    this.contractsData.maciState = maciState;
    this.contractsData.maciContractAddress = maciAddresses.maciAddress;
    this.contractsData.stateLeafIndex = Number(pollStateIndex);
    this.contractsData.timestamp = Number(timestamp);
    this.contractsData.voiceCredits = Number(voiceCredits);
    this.contractsData.user = user;
    this.contractsData.initialized = true;
    this.contractsData.pollId = 0n;
    this.contractsData.coordinatorKeypair = coordinatorKeypair;
  }
}
