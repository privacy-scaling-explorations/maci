/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { AbiCoder, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState, VOTE_OPTION_TREE_ARITY } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";

import { EMode } from "../ts/constants";
import { IVerifyingKeyStruct } from "../ts/types";
import { getDefaultSigner } from "../ts/utils";
import { Poll__factory as PollFactory, MACI, Poll as PollContract, Verifier, VkRegistry } from "../typechain-types";

import {
  STATE_TREE_DEPTH,
  duration,
  initialVoiceCreditBalance,
  messageBatchSize,
  testPollVk,
  testProcessVk,
  testTallyVk,
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

  const NUM_USERS = 2;

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

      for (let i = 0; i < NUM_USERS; i += 1) {
        const timestamp = Math.floor(Date.now() / 1000);
        const user = new Keypair();
        maciState.signUp(user.pubKey, BigInt(initialVoiceCreditBalance), BigInt(timestamp), BigInt(0));

        // eslint-disable-next-line no-await-in-loop
        await maciContract.signUp(
          user.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
      }

      // deploy on chain poll
      const tx = await maciContract.deployPoll(
        duration,
        treeDepths,
        messageBatchSize,
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
      expect(
        NOTHING_UP_MY_SLEEVE === BigInt("8370432830353022751713833565135785980866757267633941821328460903436894336785"),
      );

      for (let i = 1; i < 10; i += 1) {
        messageData.push(BigInt(0));
      }
      const message = new Message(messageData);
      const padKey = new PubKey([
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      ]);
      maciState.polls.get(pollId)?.publishMessage(message, padKey);

      // set the verification keys on the vk smart contract
      await vkRegistryContract.setPollVkKey(
        STATE_TREE_DEPTH,
        treeDepths.voteOptionTreeDepth,
        testPollVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 10000000 },
      );

      await vkRegistryContract.setVerifyingKeys(
        STATE_TREE_DEPTH,
        treeDepths.intStateTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        EMode.QV,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 10000000 },
      );
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
      const mvo = await pollContract.maxVoteOptions();
      expect(mvo.toString()).to.eq(BigInt(VOTE_OPTION_TREE_ARITY ** treeDepths.voteOptionTreeDepth).toString());
    });

    it("should have the correct tree depths set", async () => {
      const td = await pollContract.treeDepths();
      expect(td[0].toString()).to.eq(treeDepths.intStateTreeDepth.toString());
      expect(td[1].toString()).to.eq(treeDepths.voteOptionTreeDepth.toString());
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
          messageBatchSize,
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

  describe("Poll join", () => {
    it("The users have joined the poll", async () => {
      const iface = pollContract.interface;
      const pubkey = keypair.pubKey.asContractParam();
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];

      for (let i = 0; i < NUM_USERS; i += 1) {
        const mockNullifier = AbiCoder.defaultAbiCoder().encode(["uint256"], [i]);
        const voiceCreditBalance = AbiCoder.defaultAbiCoder().encode(["uint256"], [i]);

        const response = await pollContract.joinPoll(mockNullifier, pubkey, voiceCreditBalance, i, mockProof);
        const receipt = await response.wait();
        const logs = receipt!.logs[0];
        const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
          args: { _pollStateIndex: bigint };
        };
        const index = event.args._pollStateIndex;

        expect(receipt!.status).to.eq(1);

        const block = await signer.provider!.getBlock(receipt!.blockHash);
        const { timestamp } = block!;

        const expectedIndex = maciState.polls
          .get(pollId)
          ?.joinPoll(BigInt(mockNullifier), keypair.pubKey, BigInt(voiceCreditBalance), BigInt(timestamp));

        expect(index).to.eq(expectedIndex);
      }
    });

    it("Poll state tree size after user's joining", async () => {
      const pollStateTree = await pollContract.pollStateTree();
      const size = Number(pollStateTree.numberOfLeaves);
      expect(size).to.eq(maciState.polls.get(pollId)?.pollStateLeaves.length);
    });

    it("The first user has been rejected for the second join", async () => {
      const mockNullifier = AbiCoder.defaultAbiCoder().encode(["uint256"], [0]);
      const pubkey = keypair.pubKey.asContractParam();
      const voiceCreditBalance = AbiCoder.defaultAbiCoder().encode(["uint256"], [0]);
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];

      await expect(
        pollContract.joinPoll(mockNullifier, pubkey, voiceCreditBalance, 0, mockProof),
      ).to.be.revertedWithCustomError(pollContract, "UserAlreadyJoined");
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

  describe("Message hash chain", () => {
    it("should correctly compute chain hash and batch hashes array", async () => {
      const currentChainHash = await pollContract.chainHash();
      const currentBatchHashes = await pollContract.getBatchHashes();

      expect(currentChainHash).to.eq(maciState.polls.get(pollId)?.chainHash);
      expect(currentBatchHashes).to.deep.equal(maciState.polls.get(pollId)?.batchHashes);
    });

    it("should correctly pad batch hash array with zeros", async () => {
      await pollContract.padLastBatch();
      maciState.polls.get(pollId)?.padLastBatch();

      expect(await pollContract.chainHash()).to.eq(maciState.polls.get(pollId)?.chainHash);
      expect(await pollContract.getBatchHashes()).to.deep.eq(maciState.polls.get(pollId)?.batchHashes);
    });
  });

  describe("Merge state", () => {
    it("should allow a Poll contract to merge the state tree (calculate the state root)", async () => {
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(duration) + 1);

      const tx = await pollContract.mergeState({
        gasLimit: 3000000,
      });

      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should get the correct numSignUps", async () => {
      const numSignUps = await pollContract.numSignups();
      expect(numSignUps).to.be.eq(maciState.polls.get(pollId)?.pollStateLeaves.length);
      maciState.polls.get(pollId)?.updatePoll(numSignUps);
    });

    it("should get the correct mergedStateRoot", async () => {
      const mergedStateRoot = await pollContract.mergedStateRoot();
      expect(mergedStateRoot.toString()).to.eq(maciState.polls.get(pollId)?.pollStateTree?.root.toString());
    });
  });
});
