/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { BaseContract, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState, Poll, packTallyVotesSmallVals } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PubKey } from "maci-domainobjs";

import { IVerifyingKeyStruct, deployTestContracts, getDefaultSigner, parseArtifact } from "../ts";
import { Tally, MACI, Poll as PollContract, MessageProcessor } from "../typechain-types";

import {
  STATE_TREE_DEPTH,
  duration,
  maxValues,
  messageBatchSize,
  tallyBatchSize,
  testProcessVk,
  testTallyVk,
  treeDepths,
} from "./constants";
import { timeTravel } from "./utils";

describe("TallyVotes", () => {
  let signer: Signer;
  let maciContract: MACI;
  let pollContract: PollContract;
  let tallyContract: Tally;
  let mpContract: MessageProcessor;

  const coordinator = new Keypair();
  const users = [new Keypair(), new Keypair()];
  const maciState = new MaciState(STATE_TREE_DEPTH);

  const [pollAbi] = parseArtifact("Poll");

  let pollId: number;
  let poll: Poll;

  let generatedInputs: { newSbCommitment: bigint };

  before(async () => {
    signer = await getDefaultSigner();

    const r = await deployTestContracts(100, STATE_TREE_DEPTH, true);
    maciContract = r.maciContract;
    mpContract = r.mpContract;
    tallyContract = r.tallyContract;

    // deploy a poll
    // deploy on chain poll
    const tx = await maciContract.deployPoll(duration, maxValues, treeDepths, coordinator.pubKey.asContractParam(), {
      gasLimit: 8000000,
    });
    let receipt = await tx.wait();

    const block = await signer.provider!.getBlock(receipt!.blockHash);
    const deployTime = block!.timestamp;

    expect(receipt?.status).to.eq(1);
    const iface = maciContract.interface;
    const logs = receipt!.logs[receipt!.logs.length - 1];
    const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
      args: { _pollId: number };
    };
    pollId = event.args._pollId;

    const pollContractAddress = await maciContract.getPoll(pollId);
    pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;

    // deploy local poll
    const p = maciState.deployPoll(
      duration,
      BigInt(deployTime + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinator,
    );
    expect(p.toString()).to.eq(pollId.toString());
    // publish the NOTHING_UP_MY_SLEEVE message
    const messageData = [NOTHING_UP_MY_SLEEVE, BigInt(0)];
    for (let i = 2; i < 10; i += 1) {
      messageData.push(BigInt(0));
    }
    const message = new Message(BigInt(1), messageData);
    const padKey = new PubKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);
    maciState.polls[pollId].publishMessage(message, padKey);

    // save the poll
    poll = maciState.polls[pollId];

    // process messages locally
    generatedInputs = poll.processMessages(pollId) as typeof generatedInputs;

    // set the verification keys on the vk smart contract
    const vkContract = r.vkRegistryContract;
    await vkContract.setVerifyingKeys(
      STATE_TREE_DEPTH,
      treeDepths.intStateTreeDepth,
      treeDepths.messageTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize,
      testProcessVk.asContractParam() as IVerifyingKeyStruct,
      testTallyVk.asContractParam() as IVerifyingKeyStruct,
      { gasLimit: 1000000 },
    );
    receipt = await tx.wait();
    expect(receipt?.status).to.eq(1);
  });

  it("should not be possible to tally votes before the poll has ended", async () => {
    await expect(
      tallyContract.tallyVotes(
        await pollContract.getAddress(),
        await mpContract.getAddress(),
        0,
        [0, 0, 0, 0, 0, 0, 0, 0],
      ),
    ).to.be.revertedWithCustomError(tallyContract, "VOTING_PERIOD_NOT_PASSED");
  });

  it("genTallyVotesPackedVals() should generate the correct value", async () => {
    const onChainPackedVals = BigInt(await tallyContract.genTallyVotesPackedVals(users.length, 0, tallyBatchSize));
    const packedVals = packTallyVotesSmallVals(0, tallyBatchSize, users.length);
    expect(onChainPackedVals.toString()).to.eq(packedVals.toString());
  });

  it("updateSbCommitment() should revert when the messages have not been processed yet", async () => {
    // go forward in time
    await timeTravel(signer.provider! as unknown as EthereumProvider, duration + 1);

    await expect(tallyContract.updateSbCommitment(await mpContract.getAddress())).to.be.revertedWithCustomError(
      tallyContract,
      "ProcessingNotComplete",
    );
  });

  it("tallyVotes() should fail as the messages have not been processed yet", async () => {
    const pollContractAddress = await maciContract.getPoll(pollId);
    await expect(
      tallyContract.tallyVotes(pollContractAddress, await mpContract.getAddress(), 0, [0, 0, 0, 0, 0, 0, 0, 0]),
    ).to.be.revertedWithCustomError(tallyContract, "ProcessingNotComplete");
  });

  describe("after merging acc queues", () => {
    let tallyGeneratedInputs: { newTallyCommitment: bigint };
    before(async () => {
      await pollContract.mergeMaciStateAqSubRoots(0, pollId);
      await pollContract.mergeMaciStateAq(0);

      await pollContract.mergeMessageAqSubRoots(0);
      await pollContract.mergeMessageAq();
      tallyGeneratedInputs = poll.tallyVotes() as { newTallyCommitment: bigint };
    });
    it("tallyVotes() should update the tally commitment", async () => {
      // do the processing on the message processor contract
      await mpContract.processMessages(
        await pollContract.getAddress(),
        generatedInputs.newSbCommitment,
        [0, 0, 0, 0, 0, 0, 0, 0],
      );

      const tx = await tallyContract.tallyVotes(
        await pollContract.getAddress(),
        await mpContract.getAddress(),
        tallyGeneratedInputs.newTallyCommitment,
        [0, 0, 0, 0, 0, 0, 0, 0],
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      const onChainNewTallyCommitment = await tallyContract.tallyCommitment();

      expect(tallyGeneratedInputs.newTallyCommitment).to.eq(onChainNewTallyCommitment.toString());
    });
    it("tallyVotes() shuold revert when votes have already been tallied", async () => {
      await expect(
        tallyContract.tallyVotes(
          await pollContract.getAddress(),
          await mpContract.getAddress(),
          tallyGeneratedInputs.newTallyCommitment,
          [0, 0, 0, 0, 0, 0, 0, 0],
        ),
      ).to.be.revertedWithCustomError(tallyContract, "AllBallotsTallied");
    });
  });
});
