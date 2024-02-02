/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { AbiCoder, BaseContract, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import {
  MaciState,
  Poll,
  packTallyVotesSmallVals,
  IProcessMessagesCircuitInputs,
  ITallyCircuitInputs,
} from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PubKey } from "maci-domainobjs";

import { parseArtifact } from "../ts/abi";
import { IVerifyingKeyStruct } from "../ts/types";
import { getDefaultSigner } from "../ts/utils";
import { Tally, MACI, Poll as PollContract, MessageProcessor, Verifier, VkRegistry } from "../typechain-types";

import {
  STATE_TREE_DEPTH,
  duration,
  initialVoiceCreditBalance,
  maxValues,
  messageBatchSize,
  tallyBatchSize,
  testProcessVk,
  testTallyVk,
  treeDepths,
} from "./constants";
import { timeTravel, deployTestContracts } from "./utils";

describe("TallyVotes", () => {
  let signer: Signer;
  let maciContract: MACI;
  let pollContract: PollContract;
  let tallyContract: Tally;
  let mpContract: MessageProcessor;
  let verifierContract: Verifier;
  let vkRegistryContract: VkRegistry;

  const coordinator = new Keypair();
  let users: Keypair[];
  let maciState: MaciState;

  const [pollAbi] = parseArtifact("Poll");
  const [mpAbi] = parseArtifact("MessageProcessor");
  const [tallyAbi] = parseArtifact("Tally");

  let pollId: bigint;
  let poll: Poll;

  let generatedInputs: IProcessMessagesCircuitInputs;

  before(async () => {
    maciState = new MaciState(STATE_TREE_DEPTH);

    users = [new Keypair(), new Keypair()];

    signer = await getDefaultSigner();

    const r = await deployTestContracts(100, STATE_TREE_DEPTH, signer, true);
    maciContract = r.maciContract;
    verifierContract = r.mockVerifierContract as Verifier;
    vkRegistryContract = r.vkRegistryContract;

    // deploy a poll
    // deploy on chain poll
    const tx = await maciContract.deployPoll(
      duration,
      treeDepths,
      coordinator.pubKey.asContractParam(),
      verifierContract,
      vkRegistryContract,
      false,
      {
        gasLimit: 10000000,
      },
    );
    const receipt = await tx.wait();

    const block = await signer.provider!.getBlock(receipt!.blockHash);
    const deployTime = block!.timestamp;

    expect(receipt?.status).to.eq(1);
    const iface = maciContract.interface;
    const logs = receipt!.logs[receipt!.logs.length - 1];
    const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
      args: {
        _pollId: bigint;
        pollAddr: {
          poll: string;
          messageProcessor: string;
          tally: string;
        };
      };
      name: string;
    };
    expect(event.name).to.eq("DeployPoll");

    pollId = event.args._pollId;

    const pollContractAddress = await maciContract.getPoll(pollId);
    pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;
    mpContract = new BaseContract(event.args.pollAddr.messageProcessor, mpAbi, signer) as MessageProcessor;
    tallyContract = new BaseContract(event.args.pollAddr.tally, tallyAbi, signer) as Tally;

    // deploy local poll
    const p = maciState.deployPoll(BigInt(deployTime + duration), maxValues, treeDepths, messageBatchSize, coordinator);
    expect(p.toString()).to.eq(pollId.toString());
    // publish the NOTHING_UP_MY_SLEEVE message
    const messageData = [NOTHING_UP_MY_SLEEVE];
    for (let i = 1; i < 10; i += 1) {
      messageData.push(BigInt(0));
    }
    const message = new Message(BigInt(1), messageData);
    const padKey = new PubKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);

    // save the poll
    poll = maciState.polls.get(pollId)!;

    poll.publishMessage(message, padKey);

    // update the poll state
    poll.updatePoll(BigInt(maciState.stateLeaves.length));

    // process messages locally
    generatedInputs = poll.processMessages(pollId);

    // set the verification keys on the vk smart contract
    await vkRegistryContract.setVerifyingKeys(
      STATE_TREE_DEPTH,
      treeDepths.intStateTreeDepth,
      treeDepths.messageTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize,
      testProcessVk.asContractParam() as IVerifyingKeyStruct,
      testTallyVk.asContractParam() as IVerifyingKeyStruct,
      { gasLimit: 1000000 },
    );
  });

  it("should not be possible to tally votes before the poll has ended", async () => {
    await expect(tallyContract.tallyVotes(0, [0, 0, 0, 0, 0, 0, 0, 0])).to.be.revertedWithCustomError(
      tallyContract,
      "VotingPeriodNotPassed",
    );
  });

  it("genTallyVotesPackedVals() should generate the correct value", async () => {
    const onChainPackedVals = BigInt(await tallyContract.genTallyVotesPackedVals(users.length, 0, tallyBatchSize));
    const packedVals = packTallyVotesSmallVals(0, tallyBatchSize, users.length);
    expect(onChainPackedVals.toString()).to.eq(packedVals.toString());
  });

  it("updateSbCommitment() should revert when the messages have not been processed yet", async () => {
    // go forward in time
    await timeTravel(signer.provider! as unknown as EthereumProvider, duration + 1);

    await expect(tallyContract.updateSbCommitment()).to.be.revertedWithCustomError(
      tallyContract,
      "ProcessingNotComplete",
    );
  });

  it("tallyVotes() should fail as the messages have not been processed yet", async () => {
    await expect(tallyContract.tallyVotes(0, [0, 0, 0, 0, 0, 0, 0, 0])).to.be.revertedWithCustomError(
      tallyContract,
      "ProcessingNotComplete",
    );
  });

  describe("after merging acc queues", () => {
    let tallyGeneratedInputs: ITallyCircuitInputs;
    before(async () => {
      await pollContract.mergeMaciStateAqSubRoots(0, pollId);
      await pollContract.mergeMaciStateAq(0);

      await pollContract.mergeMessageAqSubRoots(0);
      await pollContract.mergeMessageAq();
      tallyGeneratedInputs = poll.tallyVotes();
    });

    it("isTallied should return false", async () => {
      const isTallied = await tallyContract.isTallied();
      expect(isTallied).to.eq(false);
    });

    it("tallyVotes() should update the tally commitment", async () => {
      // do the processing on the message processor contract
      await mpContract.processMessages(generatedInputs.newSbCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);

      await tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);

      const onChainNewTallyCommitment = await tallyContract.tallyCommitment();
      expect(tallyGeneratedInputs.newTallyCommitment).to.eq(onChainNewTallyCommitment.toString());
    });

    it("isTallied should return true", async () => {
      const isTallied = await tallyContract.isTallied();
      expect(isTallied).to.eq(true);
    });

    it("tallyVotes() should revert when votes have already been tallied", async () => {
      await expect(
        tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]),
      ).to.be.revertedWithCustomError(tallyContract, "AllBallotsTallied");
    });
  });

  describe("ballots === tallyBatchSize", () => {
    before(async () => {
      // create 24 users (total 25 - 24 + 1 nothing up my sleeve)
      users = Array.from({ length: 24 }, () => new Keypair());
      maciState = new MaciState(STATE_TREE_DEPTH);

      const updatedDuration = 5000000;

      const intStateTreeDepth = 2;

      const r = await deployTestContracts(100, STATE_TREE_DEPTH, signer, true);
      maciContract = r.maciContract;
      verifierContract = r.mockVerifierContract as Verifier;
      vkRegistryContract = r.vkRegistryContract;

      // signup all users
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        const timestamp = Math.floor(Date.now() / 1000);
        // signup locally
        maciState.signUp(users[i].pubKey, BigInt(initialVoiceCreditBalance), BigInt(timestamp));
        // signup on chain

        // eslint-disable-next-line no-await-in-loop
        await maciContract.signUp(
          users[i].pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
      }

      // deploy a poll
      // deploy on chain poll
      const tx = await maciContract.deployPoll(
        updatedDuration,
        {
          ...treeDepths,
          intStateTreeDepth,
        },
        coordinator.pubKey.asContractParam(),
        verifierContract,
        vkRegistryContract,
        false,
        {
          gasLimit: 10000000,
        },
      );
      const receipt = await tx.wait();

      const block = await signer.provider!.getBlock(receipt!.blockHash);
      const deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);
      const iface = maciContract.interface;
      const logs = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
        args: {
          _pollId: bigint;
          pollAddr: {
            poll: string;
            messageProcessor: string;
            tally: string;
          };
        };
        name: string;
      };
      expect(event.name).to.eq("DeployPoll");

      pollId = event.args._pollId;

      const pollContractAddress = await maciContract.getPoll(pollId);
      pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;
      mpContract = new BaseContract(event.args.pollAddr.messageProcessor, mpAbi, signer) as MessageProcessor;
      tallyContract = new BaseContract(event.args.pollAddr.tally, tallyAbi, signer) as Tally;

      // deploy local poll
      const p = maciState.deployPoll(
        BigInt(deployTime + updatedDuration),
        maxValues,
        {
          ...treeDepths,
          intStateTreeDepth,
        },
        messageBatchSize,
        coordinator,
      );
      expect(p.toString()).to.eq(pollId.toString());
      // publish the NOTHING_UP_MY_SLEEVE message
      const messageData = [NOTHING_UP_MY_SLEEVE];
      for (let i = 1; i < 10; i += 1) {
        messageData.push(BigInt(0));
      }
      const message = new Message(BigInt(1), messageData);
      const padKey = new PubKey([
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      ]);

      // save the poll
      poll = maciState.polls.get(pollId)!;

      poll.publishMessage(message, padKey);

      // update the poll state
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // set the verification keys on the vk smart contract
      await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );

      await timeTravel(signer.provider! as unknown as EthereumProvider, updatedDuration);
      await pollContract.mergeMaciStateAqSubRoots(0, pollId);
      await pollContract.mergeMaciStateAq(0);

      await pollContract.mergeMessageAqSubRoots(0);
      await pollContract.mergeMessageAq();

      const processMessagesInputs = poll.processMessages(pollId);
      await mpContract.processMessages(processMessagesInputs.newSbCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("should tally votes correctly", async () => {
      const tallyGeneratedInputs = poll.tallyVotes();
      await tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);

      const onChainNewTallyCommitment = await tallyContract.tallyCommitment();
      expect(tallyGeneratedInputs.newTallyCommitment).to.eq(onChainNewTallyCommitment.toString());
      await expect(
        tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]),
      ).to.be.revertedWithCustomError(tallyContract, "AllBallotsTallied");
    });
  });

  describe("ballots > tallyBatchSize", () => {
    before(async () => {
      // create 25 users (and thus 26 ballots) (total 26 - 25 + 1 nothing up my sleeve)
      users = Array.from({ length: 25 }, () => new Keypair());
      maciState = new MaciState(STATE_TREE_DEPTH);

      const updatedDuration = 5000000;

      const intStateTreeDepth = 2;

      const r = await deployTestContracts(100, STATE_TREE_DEPTH, signer, true);
      maciContract = r.maciContract;
      verifierContract = r.mockVerifierContract as Verifier;
      vkRegistryContract = r.vkRegistryContract;

      // signup all users
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        const timestamp = Math.floor(Date.now() / 1000);
        // signup locally
        maciState.signUp(users[i].pubKey, BigInt(initialVoiceCreditBalance), BigInt(timestamp));
        // signup on chain

        // eslint-disable-next-line no-await-in-loop
        await maciContract.signUp(
          users[i].pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
      }

      // deploy a poll
      // deploy on chain poll
      const tx = await maciContract.deployPoll(
        updatedDuration,
        {
          ...treeDepths,
          intStateTreeDepth,
        },
        coordinator.pubKey.asContractParam(),
        verifierContract,
        vkRegistryContract,
        false,
        {
          gasLimit: 10000000,
        },
      );
      const receipt = await tx.wait();

      const block = await signer.provider!.getBlock(receipt!.blockHash);
      const deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);
      const iface = maciContract.interface;
      const logs = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
        args: {
          _pollId: bigint;
          pollAddr: {
            poll: string;
            messageProcessor: string;
            tally: string;
          };
        };
        name: string;
      };
      expect(event.name).to.eq("DeployPoll");

      pollId = event.args._pollId;

      const pollContractAddress = await maciContract.getPoll(pollId);
      pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;
      mpContract = new BaseContract(event.args.pollAddr.messageProcessor, mpAbi, signer) as MessageProcessor;
      tallyContract = new BaseContract(event.args.pollAddr.tally, tallyAbi, signer) as Tally;

      // deploy local poll
      const p = maciState.deployPoll(
        BigInt(deployTime + updatedDuration),
        maxValues,
        {
          ...treeDepths,
          intStateTreeDepth,
        },
        messageBatchSize,
        coordinator,
      );
      expect(p.toString()).to.eq(pollId.toString());
      // publish the NOTHING_UP_MY_SLEEVE message
      const messageData = [NOTHING_UP_MY_SLEEVE];
      for (let i = 1; i < 10; i += 1) {
        messageData.push(BigInt(0));
      }
      const message = new Message(BigInt(1), messageData);
      const padKey = new PubKey([
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      ]);

      // save the poll
      poll = maciState.polls.get(pollId)!;

      poll.publishMessage(message, padKey);

      // update the poll state
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // set the verification keys on the vk smart contract
      await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );

      await timeTravel(signer.provider! as unknown as EthereumProvider, updatedDuration);
      await pollContract.mergeMaciStateAqSubRoots(0, pollId);
      await pollContract.mergeMaciStateAq(0);

      await pollContract.mergeMessageAqSubRoots(0);
      await pollContract.mergeMessageAq();

      const processMessagesInputs = poll.processMessages(pollId);
      await mpContract.processMessages(processMessagesInputs.newSbCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("should tally votes correctly", async () => {
      // tally first batch
      let tallyGeneratedInputs = poll.tallyVotes();

      await tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);

      // check commitment
      const onChainNewTallyCommitment = await tallyContract.tallyCommitment();
      expect(tallyGeneratedInputs.newTallyCommitment).to.eq(onChainNewTallyCommitment.toString());

      // tally second batch
      tallyGeneratedInputs = poll.tallyVotes();

      await tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]);

      // check that it fails to tally again
      await expect(
        tallyContract.tallyVotes(tallyGeneratedInputs.newTallyCommitment, [0, 0, 0, 0, 0, 0, 0, 0]),
      ).to.be.revertedWithCustomError(tallyContract, "AllBallotsTallied");
    });
  });
});
