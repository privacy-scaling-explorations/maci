import { Keypair } from "@maci-protocol/domainobjs";
import {
  EMode,
  extractAllVks,
  genMaciStateFromContract,
  setVerifyingKeys,
  signup,
  joinPoll,
  deployMaci,
  deployPoll,
  deployVkRegistryContract,
  ContractStorage,
  deployFreeForAllSignUpPolicy,
  deployVerifier,
  deployConstantInitialVoiceCreditProxy,
} from "@maci-protocol/sdk";
import hardhat from "hardhat";

import type { ITestingClassPaths, IContractsData } from "./types";

import {
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  DEFAULT_VOTE_OPTIONS,
  DEFAULT_INITIAL_VOICE_CREDITS,
  DEFAULT_SG_DATA,
  DEFAULT_IVCP_DATA,
} from "./constants";
import { User } from "./user";

/**
 * A class that represents the testing class used in MACI tests
 * It can be used to deploy and initialize the contracts
 */
export class TestingClass {
  private static INSTANCE?: TestingClass;

  /**
   * Paths to the pollJoining zkey file
   */
  private pollJoiningZkeyPath: string;

  /**
   * Paths to the pollJoined zkey file
   */
  private pollJoinedZkeyPath: string;

  /**
   * Paths to the processMessages zkey file
   */
  private processMessagesZkeyPath: string;

  /**
   * Paths to the tallyVotes zkey file
   */
  private tallyVotesZkeyPath: string;

  /**
   * Paths to the poll wasm file
   */
  private pollWasm: string;

  /**
   * Paths to the poll witgen file
   */
  private pollWitgen: string;

  /**
   * Paths to the rapidsnark file
   */
  private rapidsnark: string;

  readonly contractsData: IContractsData = {
    initialized: false,
  };

  constructor({
    pollJoiningZkeyPath,
    pollJoinedZkeyPath,
    processMessagesZkeyPath,
    tallyVotesZkeyPath,
    pollWasm,
    pollWitgen,
    rapidsnark,
  }: ITestingClassPaths) {
    this.pollJoiningZkeyPath = pollJoiningZkeyPath;
    this.pollJoinedZkeyPath = pollJoinedZkeyPath;
    this.processMessagesZkeyPath = processMessagesZkeyPath;
    this.tallyVotesZkeyPath = tallyVotesZkeyPath;
    this.pollWasm = pollWasm;
    this.pollWitgen = pollWitgen;
    this.rapidsnark = rapidsnark;
  }

  static async getInstance(paths: ITestingClassPaths): Promise<TestingClass> {
    if (!TestingClass.INSTANCE) {
      TestingClass.INSTANCE = new TestingClass(paths);
      await TestingClass.INSTANCE.contractsInit();
    }

    return TestingClass.INSTANCE;
  }

  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static clean(): void {
    const contractStorage = ContractStorage.getInstance();
    contractStorage.cleanup("hardhat");
    contractStorage.cleanup("localhost");
  }

  private async contractsInit(): Promise<void> {
    if (this.contractsData.initialized) {
      return;
    }

    const [signer] = await hardhat.ethers.getSigners();
    const coordinatorKeypair = new Keypair();
    const user = new Keypair();

    const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
      pollJoiningZkeyPath: this.pollJoiningZkeyPath,
      pollJoinedZkeyPath: this.pollJoinedZkeyPath,
      processMessagesZkeyPath: this.processMessagesZkeyPath,
      tallyVotesZkeyPath: this.tallyVotesZkeyPath,
    });

    const vkRegistry = await deployVkRegistryContract({ signer });
    await setVerifyingKeys({
      vkRegistryAddress: vkRegistry,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      pollJoiningVk: pollJoiningVk!,
      pollJoinedVk: pollJoinedVk!,
      processMessagesVk: processVk!,
      tallyVotesVk: tallyVk!,
      mode: EMode.NON_QV,
      signer,
    });

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

    const maciAddresses = await deployMaci({
      stateTreeDepth: 10,
      signer,
      signupPolicyAddress: signupPolicyContractAddress,
    });

    const [initialVoiceCreditProxy] = await deployConstantInitialVoiceCreditProxy(
      { amount: DEFAULT_INITIAL_VOICE_CREDITS },
      signer,
      undefined,
      true,
    );
    const initialVoiceCreditProxyContractAddress = await initialVoiceCreditProxy.getAddress();

    const verifier = await deployVerifier(signer, true);
    const verifierContractAddress = await verifier.getAddress();

    const startDate = Math.floor(Date.now() / 1000) + 30;

    const { pollContractAddress } = await deployPoll({
      pollStartTimestamp: startDate,
      pollEndTimestamp: startDate + 130,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubKey: coordinatorKeypair.pubKey,
      mode: EMode.NON_QV,
      relayers: [await signer.getAddress()],
      signer,
      verifierContractAddress,
      maciAddress: maciAddresses.maciContractAddress,
      policyContractAddress: pollPolicyContractAddress,
      initialVoiceCreditProxyContractAddress,
      voteOptions: DEFAULT_VOTE_OPTIONS,
      vkRegistryContractAddress: vkRegistry,
    });

    await signup({
      maciAddress: maciAddresses.maciContractAddress,
      maciPubKey: user.pubKey.serialize(),
      sgData: DEFAULT_SG_DATA,
      signer,
    });

    const { pollStateIndex, voiceCredits, timestamp } = await joinPoll({
      maciAddress: maciAddresses.maciContractAddress,
      pollId: 0n,
      privateKey: user.privKey.serialize(),
      stateIndex: 1n,
      pollJoiningZkey: this.pollJoiningZkeyPath,
      pollWasm: this.pollWasm,
      pollWitgen: this.pollWitgen,
      rapidsnark: this.rapidsnark,
      signer,
      useWasm: true,
      sgDataArg: DEFAULT_SG_DATA,
      ivcpDataArg: DEFAULT_IVCP_DATA,
    });

    const maciState = await genMaciStateFromContract({
      provider: signer.provider,
      address: maciAddresses.maciContractAddress,
      coordinatorKeypair,
      pollId: 0n,
    });

    this.contractsData.maciState = maciState;
    this.contractsData.maciContractAddress = maciAddresses.maciContractAddress;
    this.contractsData.users = [];
    this.contractsData.users.push(
      new User(user, [], BigInt(voiceCredits), 0n, BigInt(timestamp), BigInt(pollStateIndex)),
    );
    this.contractsData.initialized = true;
    this.contractsData.polls?.push(pollContractAddress);
  }
}
