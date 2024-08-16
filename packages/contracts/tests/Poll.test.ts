/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";

import { EMode } from "../ts/constants";
import { getDefaultSigner } from "../ts/utils";
import {
  AccQueue,
  AccQueueQuinaryMaci__factory as AccQueueQuinaryMaciFactory,
  Poll__factory as PollFactory,
  MACI,
  Poll as PollContract,
  Verifier,
  VkRegistry,
} from "../typechain-types";

import {
  MESSAGE_TREE_DEPTH,
  STATE_TREE_DEPTH,
  duration,
  initialVoiceCreditBalance,
  messageBatchSize,
  treeDepths,
} from "./constants";
import { timeTravel, deployTestContracts } from "./utils";

describe("Poll", () => {
  let maciContract: MACI;
  let pollId: bigint;
  let pollContract: PollContract;
  let verifierContract: Verifier;
  let vkRegistryContract: VkRegistry;
  let signer: Signer;
  let deployTime: number;
  const coordinator = new Keypair();

  const maciState = new MaciState(STATE_TREE_DEPTH);

  const keypair = new Keypair();

  describe("deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
      });
      maciContract = r.maciContract;
      verifierContract = r.mockVerifierContract as Verifier;
      vkRegistryContract = r.vkRegistryContract;

      // deploy on chain poll
      const tx = await maciContract.deployPoll(
        duration,
        treeDepths,
        coordinator.pubKey.asContractParam(),
        verifierContract,
        vkRegistryContract,
        EMode.QV,
      );
      const receipt = await tx.wait();

      const block = await signer.provider!.getBlock(receipt!.blockHash);
      deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);

      pollId = (await maciContract.nextPollId()) - 1n;

      const pollContracts = await maciContract.getPoll(pollId);
      pollContract = PollFactory.connect(pollContracts.poll, signer);

      // deploy local poll
      const p = maciState.deployPoll(BigInt(deployTime + duration), treeDepths, messageBatchSize, coordinator);
      expect(p.toString()).to.eq(pollId.toString());
      // publish the NOTHING_UP_MY_SLEEVE message
      const messageData = [NOTHING_UP_MY_SLEEVE];
      for (let i = 1; i < 10; i += 1) {
        messageData.push(BigInt(0));
      }
      const message = new Message(messageData);
      const padKey = new PubKey([
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      ]);
      maciState.polls.get(pollId)?.publishMessage(message, padKey);
    });

    it("should not be possible to init the Poll contract twice", async () => {
      await expect(pollContract.init()).to.be.revertedWithCustomError(pollContract, "PollAlreadyInit");
    });

    it("should have the correct coordinator public key set", async () => {
      const coordinatorPubKey = await pollContract.coordinatorPubKey();
      expect(coordinatorPubKey[0].toString()).to.eq(coordinator.pubKey.rawPubKey[0].toString());
      expect(coordinatorPubKey[1].toString()).to.eq(coordinator.pubKey.rawPubKey[1].toString());

      const coordinatorPubKeyHash = await pollContract.coordinatorPubKeyHash();
      expect(coordinatorPubKeyHash.toString()).to.eq(coordinator.pubKey.hash().toString());
    });

    it("should have the correct duration set", async () => {
      const dd = await pollContract.getDeployTimeAndDuration();
      expect(dd[1].toString()).to.eq(duration.toString());
    });

    it("should have the correct tree depths set", async () => {
      const td = await pollContract.treeDepths();
      expect(td[0].toString()).to.eq(treeDepths.intStateTreeDepth.toString());
      expect(td[1].toString()).to.eq(treeDepths.messageTreeSubDepth.toString());
      expect(td[2].toString()).to.eq(treeDepths.messageTreeDepth.toString());
      expect(td[3].toString()).to.eq(treeDepths.voteOptionTreeDepth.toString());
    });

    it("should have numMessages set to 1 (blank message)", async () => {
      const numMessages = await pollContract.numMessages();
      expect(numMessages.toString()).to.eq("1");
    });

    it("should fail when passing an invalid coordinator public key", async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
      });
      const testMaciContract = r.maciContract;

      // deploy on chain poll
      await expect(
        testMaciContract.deployPoll(
          duration,
          treeDepths,
          {
            x: "100",
            y: "1",
          },
          r.mockVerifierContract as Verifier,
          r.vkRegistryContract,
          EMode.QV,
        ),
      ).to.be.revertedWithCustomError(testMaciContract, "InvalidPubKey");
    });
  });

  describe("publishMessage", () => {
    it("should publish a message to the Poll contract", async () => {
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      const tx = await pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam());
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      maciState.polls.get(pollId)?.publishMessage(message, keypair.pubKey);
    });

    it("should throw when the encPubKey is not a point on the baby jubjub curve", async () => {
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      await expect(
        pollContract.publishMessage(message.asContractParam(), {
          x: "1",
          y: "1",
        }),
      ).to.be.revertedWithCustomError(pollContract, "InvalidPubKey");
    });

    it("should emit an event when publishing a message", async () => {
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      expect(await pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam()))
        .to.emit(pollContract, "PublishMessage")
        .withArgs(message.asContractParam(), keypair.pubKey.asContractParam());

      maciState.polls.get(pollId)?.publishMessage(message, keypair.pubKey);
    });

    it("should allow to publish a message batch", async () => {
      const messages: [Message, PubKey][] = [];
      for (let i = 0; i < 2; i += 1) {
        const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, BigInt(i));
        const signature = command.sign(keypair.privKey);
        const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
        const message = command.encrypt(signature, sharedKey);
        messages.push([message, keypair.pubKey]);
      }

      const tx = await pollContract.publishMessageBatch(
        messages.map(([m]) => m.asContractParam()),
        messages.map(([, k]) => k.asContractParam()),
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      messages.forEach(([message, key]) => {
        maciState.polls.get(pollId)?.publishMessage(message, key);
      });
    });

    it("should throw when the message batch has messages length != encPubKeys length", async () => {
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);
      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      await expect(
        pollContract.publishMessageBatch(
          [message.asContractParam(), message.asContractParam()],
          [keypair.pubKey.asContractParam()],
        ),
      ).to.be.revertedWithCustomError(pollContract, "InvalidBatchLength");
    });

    it("should not allow to publish a message after the voting period ends", async () => {
      const dd = await pollContract.getDeployTimeAndDuration();
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(dd[0]) + 10);

      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);

      await expect(
        pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam()),
      ).to.be.revertedWithCustomError(pollContract, "VotingPeriodOver");
    });

    it("should not allow to publish a message batch after the voting period ends", async () => {
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);
      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      await expect(
        pollContract.publishMessageBatch([message.asContractParam()], [keypair.pubKey.asContractParam()]),
      ).to.be.revertedWithCustomError(pollContract, "VotingPeriodOver");
    });
  });

  describe("Merge messages", () => {
    let messageAqContract: AccQueue;

    beforeEach(async () => {
      const extContracts = await pollContract.extContracts();

      const messageAqAddress = extContracts.messageAq;
      messageAqContract = AccQueueQuinaryMaciFactory.connect(messageAqAddress, signer);
    });

    it("should allow to merge the message AccQueue", async () => {
      let tx = await pollContract.mergeMessageAqSubRoots(0);
      let receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      tx = await pollContract.mergeMessageAq();
      receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should have the correct message root set", async () => {
      const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH);
      const offChainMessageRoot = maciState.polls.get(pollId)!.messageTree.root;

      expect(onChainMessageRoot.toString()).to.eq(offChainMessageRoot.toString());
    });

    it("should prevent merging subroots again", async () => {
      await expect(pollContract.mergeMessageAqSubRoots(0)).to.be.revertedWithCustomError(
        messageAqContract,
        "SubTreesAlreadyMerged",
      );
    });

    it("should not change the message root if merging a second time", async () => {
      await pollContract.mergeMessageAq();
      const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH);
      const offChainMessageRoot = maciState.polls.get(pollId)!.messageTree.root;

      expect(onChainMessageRoot.toString()).to.eq(offChainMessageRoot.toString());
    });

    it("should emit an event with the same root when merging another time", async () => {
      expect(await pollContract.mergeMessageAq())
        .to.emit(pollContract, "MergeMessageAq")
        .withArgs(maciState.polls.get(pollId)!.messageTree.root);
    });
  });
});
