/* eslint-disable no-underscore-dangle */
import { MaciState, Poll, IProcessMessagesCircuitInputs, ITallyCircuitInputs } from "@maci-protocol/core";
import { NOTHING_UP_MY_SLEEVE } from "@maci-protocol/crypto";
import { Keypair, Message, PublicKey } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { Signer, ZeroAddress } from "ethers";
import { EthereumProvider } from "hardhat/types";

import { EMode } from "../ts/constants";
import { IVerifyingKeyStruct } from "../ts/types";
import { getDefaultSigner, getBlockTimestamp } from "../ts/utils";
import {
  Tally,
  MACI,
  Poll as PollContract,
  MessageProcessor,
  Verifier,
  VkRegistry,
  MessageProcessor__factory as MessageProcessorFactory,
  Poll__factory as PollFactory,
  Tally__factory as TallyFactory,
  IBasePolicy,
  ConstantInitialVoiceCreditProxy,
} from "../typechain-types";

import {
  STATE_TREE_DEPTH,
  duration,
  maxVoteOptions,
  messageBatchSize,
  testProcessVk,
  testTallyVk,
  treeDepths,
} from "./constants";
import { timeTravel, deployTestContracts } from "./utils";

describe("TallyVotesNonQv", () => {
  let signer: Signer;
  let maciContract: MACI;
  let pollContract: PollContract;
  let tallyContract: Tally;
  let mpContract: MessageProcessor;
  let verifierContract: Verifier;
  let vkRegistryContract: VkRegistry;
  let policyContract: IBasePolicy;
  let initialVoiceCreditProxyContract: ConstantInitialVoiceCreditProxy;
  const coordinator = new Keypair();
  let maciState: MaciState;

  let pollId: bigint;
  let poll: Poll;

  let generatedInputs: IProcessMessagesCircuitInputs;

  before(async () => {
    maciState = new MaciState(STATE_TREE_DEPTH);

    signer = await getDefaultSigner();

    const startTime = await getBlockTimestamp(signer);

    const r = await deployTestContracts({ initialVoiceCreditBalance: 100, stateTreeDepth: STATE_TREE_DEPTH, signer });
    maciContract = r.maciContract;
    verifierContract = r.mockVerifierContract as Verifier;
    vkRegistryContract = r.vkRegistryContract;
    policyContract = r.policyContract;
    initialVoiceCreditProxyContract = r.constantInitialVoiceCreditProxyContract;

    // deploy a poll
    // deploy on chain poll
    const tx = await maciContract.deployPoll({
      startDate: startTime,
      endDate: startTime + duration,
      treeDepths,
      messageBatchSize,
      coordinatorPublicKey: coordinator.publicKey.asContractParam(),
      verifier: verifierContract,
      vkRegistry: vkRegistryContract,
      mode: EMode.NON_QV,
      policy: policyContract,
      initialVoiceCreditProxy: initialVoiceCreditProxyContract,
      relayers: [ZeroAddress],
      voteOptions: maxVoteOptions,
    });
    const receipt = await tx.wait();

    expect(receipt?.status).to.eq(1);

    pollId = (await maciContract.nextPollId()) - 1n;

    const pollContracts = await maciContract.getPoll(pollId);
    pollContract = PollFactory.connect(pollContracts.poll, signer);
    mpContract = MessageProcessorFactory.connect(pollContracts.messageProcessor, signer);
    tallyContract = TallyFactory.connect(pollContracts.tally, signer);

    // deploy local poll
    const p = maciState.deployPoll(
      BigInt(startTime + duration),
      treeDepths,
      messageBatchSize,
      coordinator,
      BigInt(maxVoteOptions),
    );
    expect(p.toString()).to.eq(pollId.toString());
    // publish the NOTHING_UP_MY_SLEEVE message
    const messageData = [NOTHING_UP_MY_SLEEVE];
    for (let i = 1; i < 10; i += 1) {
      messageData.push(BigInt(0));
    }
    const message = new Message(messageData);
    const padKey = new PublicKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);

    // save the poll
    poll = maciState.polls.get(pollId)!;

    poll.publishMessage(message, padKey);

    // update the poll state
    poll.updatePoll(BigInt(maciState.pubKeys.length));

    // process messages locally
    generatedInputs = poll.processMessages(pollId, false);

    // set the verification keys on the vk smart contract
    await vkRegistryContract.setVerifyingKeys(
      STATE_TREE_DEPTH,
      treeDepths.intStateTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize,
      EMode.NON_QV,
      testProcessVk.asContractParam() as IVerifyingKeyStruct,
      testTallyVk.asContractParam() as IVerifyingKeyStruct,
    );
  });

  it("should not be possible to tally votes before the poll has ended", async () => {
    await expect(tallyContract.tallyVotes(0n, [0, 0, 0, 0, 0, 0, 0, 0])).to.be.revertedWithCustomError(
      tallyContract,
      "ProcessingNotComplete",
    );
  });

  it("tallyVotes() should fail as the messages have not been processed yet", async () => {
    await timeTravel(signer.provider! as unknown as EthereumProvider, duration + 1);
    await expect(tallyContract.tallyVotes(0n, [0, 0, 0, 0, 0, 0, 0, 0])).to.be.revertedWithCustomError(
      tallyContract,
      "ProcessingNotComplete",
    );
  });

  describe("after messages processing", () => {
    let tallyGeneratedInputs: ITallyCircuitInputs;
    before(async () => {
      await pollContract.mergeState();

      tallyGeneratedInputs = poll.tallyVotes();
    });

    it("isTallied should return false", async () => {
      const isTallied = await tallyContract.isTallied();
      expect(isTallied).to.eq(false);
    });

    it("tallyVotes() should update the tally commitment", async () => {
      await mpContract.processMessages(BigInt(generatedInputs.newSbCommitment), [0, 0, 0, 0, 0, 0, 0, 0]);

      await tallyContract.tallyVotes(BigInt(tallyGeneratedInputs.newTallyCommitment), [0, 0, 0, 0, 0, 0, 0, 0]);

      const onChainNewTallyCommitment = await tallyContract.tallyCommitment();
      expect(tallyGeneratedInputs.newTallyCommitment).to.eq(onChainNewTallyCommitment.toString());
    });

    it("isTallied should return true", async () => {
      const isTallied = await tallyContract.isTallied();
      expect(isTallied).to.eq(true);
    });

    it("should throw error if try to call verifyPerVOSpentVoiceCredits for non-qv", async () => {
      await expect(tallyContract.verifyPerVOSpentVoiceCredits(0, 0, [], 0, 0, 0, 0)).to.be.revertedWithCustomError(
        tallyContract,
        "NotSupported",
      );
    });

    it("tallyVotes() should revert when votes have already been tallied", async () => {
      await expect(
        tallyContract.tallyVotes(BigInt(tallyGeneratedInputs.newTallyCommitment), [0, 0, 0, 0, 0, 0, 0, 0]),
      ).to.be.revertedWithCustomError(tallyContract, "AllBallotsTallied");
    });
  });
});
