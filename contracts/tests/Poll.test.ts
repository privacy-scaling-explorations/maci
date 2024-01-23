/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { BaseContract, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";

import { parseArtifact } from "../ts/abi";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { AccQueue, MACI, Poll as PollContract, TopupCredit, Verifier, VkRegistry } from "../typechain-types";

import {
  MESSAGE_TREE_DEPTH,
  STATE_TREE_DEPTH,
  duration,
  initialVoiceCreditBalance,
  maxValues,
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
  let topupCreditContract: TopupCredit;
  let signer: Signer;
  let deployTime: number;
  const coordinator = new Keypair();
  const [pollAbi] = parseArtifact("Poll");
  const [accQueueQuinaryMaciAbi] = parseArtifact("AccQueueQuinaryMaci");

  const maciState = new MaciState(STATE_TREE_DEPTH);

  describe("deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true);
      maciContract = r.maciContract;
      verifierContract = r.mockVerifierContract as Verifier;
      vkRegistryContract = r.vkRegistryContract;
      topupCreditContract = r.topupCreditContract;

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
      deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);
      const iface = maciContract.interface;
      const logs = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
        args: { _pollId: bigint };
      };
      pollId = event.args._pollId;

      const pollContractAddress = await maciContract.getPoll(pollId);
      pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;

      // deploy local poll
      const p = maciState.deployPoll(
        BigInt(deployTime + duration),
        maxValues,
        treeDepths,
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

    it("should have the correct max values set", async () => {
      const mv = await pollContract.maxValues();
      expect(mv[0].toString()).to.eq(maxValues.maxMessages.toString());
      expect(mv[1].toString()).to.eq(maxValues.maxVoteOptions.toString());
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
  });

  describe("topup", () => {
    let voter: Signer;

    before(async () => {
      // transfer tokens to a user and pre-approve
      [, voter] = await getSigners();
      await topupCreditContract.airdropTo(voter.getAddress(), 200n);
      await topupCreditContract.connect(voter).approve(await pollContract.getAddress(), 1000n);
    });

    it("should allow to publish a topup message when the caller has enough topup tokens", async () => {
      const tx = await pollContract.connect(voter).topup(1n, 50n);
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      // publish on local maci state
      maciState.polls.get(pollId)?.topupMessage(new Message(2n, [1n, 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));
    });

    it("should throw when the user does not have enough tokens", async () => {
      await expect(pollContract.connect(signer).topup(1n, 50n)).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("should emit an event when publishing a topup message", async () => {
      expect(await pollContract.connect(voter).topup(1n, 50n)).to.emit(pollContract, "TopupMessage");
      // publish on local maci state
      maciState.polls.get(pollId)?.topupMessage(new Message(2n, [1n, 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));
    });

    it("should successfully increase the number of messages", async () => {
      const numMessages = await pollContract.numMessages();
      await pollContract.connect(voter).topup(1n, 50n);
      const newNumMessages = await pollContract.numMessages();
      expect(newNumMessages.toString()).to.eq((numMessages + 1n).toString());

      // publish on local maci state
      maciState.polls.get(pollId)?.topupMessage(new Message(2n, [1n, 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));
    });
  });

  describe("publishMessage", () => {
    it("should publish a message to the Poll contract", async () => {
      const keypair = new Keypair();

      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      const tx = await pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam());
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      maciState.polls.get(pollId)?.publishMessage(message, keypair.pubKey);
    });

    it("should emit an event when publishing a message", async () => {
      const keypair = new Keypair();

      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      expect(await pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam()))
        .to.emit(pollContract, "PublishMessage")
        .withArgs(message.asContractParam(), keypair.pubKey.asContractParam());

      maciState.polls.get(pollId)?.publishMessage(message, keypair.pubKey);
    });

    it("shold not allow to publish a message after the voting period ends", async () => {
      const dd = await pollContract.getDeployTimeAndDuration();
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(dd[0]) + 1);

      const keypair = new Keypair();
      const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, pollId, 0n);

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);

      await expect(
        pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam(), { gasLimit: 300000 }),
      ).to.be.revertedWithCustomError(pollContract, "VotingPeriodOver");
    });
  });

  describe("Merge messages", () => {
    let messageAqContract: AccQueue;

    beforeEach(async () => {
      const extContracts = await pollContract.extContracts();

      const messageAqAddress = extContracts.messageAq;
      messageAqContract = new BaseContract(messageAqAddress, accQueueQuinaryMaciAbi, signer) as AccQueue;
    });

    it("should revert if the subtrees are not merged for StateAq", async () => {
      await expect(pollContract.mergeMaciStateAq(0, { gasLimit: 4000000 })).to.be.revertedWithCustomError(
        pollContract,
        "StateAqSubtreesNeedMerge",
      );
    });

    it("should allow the coordinator to merge the message AccQueue", async () => {
      let tx = await pollContract.mergeMessageAqSubRoots(0, {
        gasLimit: 3000000,
      });
      let receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      tx = await pollContract.mergeMessageAq({ gasLimit: 4000000 });
      receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should have the correct message root set", async () => {
      const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH);
      const offChainMessageRoot = maciState.polls.get(pollId)!.messageTree.root;

      expect(onChainMessageRoot.toString()).to.eq(offChainMessageRoot.toString());
    });
  });
});
