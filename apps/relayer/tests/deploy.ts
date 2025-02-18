import hardhat from "hardhat";
import { deploy, deployPoll, deployVkRegistryContract, joinPoll, setVerifyingKeys, signup } from "maci-cli";
import { Keypair } from "maci-domainobjs";
import { genMaciStateFromContract } from "maci-sdk";

import {
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  pollJoinedZkey,
  pollJoiningZkey,
  processMessagesZkeyPathNonQv,
  tallyVotesZkeyPathNonQv,
  pollWasm,
  pollWitgen,
  rapidsnark,
} from "./constants.js";

interface IContractsData {
  initialized: boolean;
  user?: Keypair;
  voiceCredits?: number;
  timestamp?: number;
  stateLeafIndex?: number;
  maciContractAddress?: string;
  maciState?: Awaited<ReturnType<typeof genMaciStateFromContract>>;
}

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

    const vkRegistry = await deployVkRegistryContract({ signer });
    await setVerifyingKeys({
      quiet: true,
      vkRegistry,
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      processMessagesZkeyPathNonQv,
      tallyVotesZkeyPathNonQv,
      pollJoiningZkeyPath: pollJoiningZkey,
      pollJoinedZkeyPath: pollJoinedZkey,
      useQuadraticVoting: false,
      signer,
    });

    const maciAddresses = await deploy({ stateTreeDepth: 10, signer });

    const startDate = Math.floor(Date.now() / 1000) + 30;

    await deployPoll({
      pollStartDate: startDate,
      pollEndDate: startDate + 130,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
      useQuadraticVoting: false,
      relayers: [await signer.getAddress()],
      signer,
    });

    await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });

    const { pollStateIndex, timestamp, voiceCredits } = await joinPoll({
      maciAddress: maciAddresses.maciAddress,
      pollId: 0n,
      privateKey: user.privKey.serialize(),
      stateIndex: 1n,
      pollJoiningZkey,
      pollWasm,
      pollWitgen,
      rapidsnark,
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
  }
}
