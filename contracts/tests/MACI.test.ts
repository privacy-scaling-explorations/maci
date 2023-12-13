/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { AbiCoder, BaseContract, BigNumberish, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState, genProcessVkSig, STATE_TREE_DEPTH } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { VerifyingKey, Keypair, PubKey, Message } from "maci-domainobjs";

import type { IVerifyingKeyStruct } from "../ts/types";

import { parseArtifact } from "../ts/abi";
import { getDefaultSigner } from "../ts/utils";
import { AccQueueQuinaryMaci, MACI, VkRegistry, Poll as PollContract } from "../typechain-types";

import {
  duration,
  initialVoiceCreditBalance,
  maxValues,
  messageBatchSize,
  tallyBatchSize,
  testProcessVk,
  testTallyVk,
  treeDepths,
} from "./constants";
import { compareVks, timeTravel, deployTestContracts } from "./utils";

describe("MACI", () => {
  let maciContract: MACI;
  let stateAqContract: AccQueueQuinaryMaci;
  let vkRegistryContract: VkRegistry;
  let pollId: number;

  const coordinator = new Keypair();
  const [pollAbi] = parseArtifact("Poll");
  const users = [new Keypair(), new Keypair(), new Keypair()];

  let signer: Signer;

  const maciState = new MaciState(STATE_TREE_DEPTH);
  const signUpTxOpts = { gasLimit: 300000 };

  describe("Deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true);

      maciContract = r.maciContract;
      stateAqContract = r.stateAqContract;
      vkRegistryContract = r.vkRegistryContract;
    });

    it("MACI.stateTreeDepth should be correct", async () => {
      const std = await maciContract.stateTreeDepth();
      expect(std.toString()).to.eq(STATE_TREE_DEPTH.toString());
    });
  });

  describe("Signups", () => {
    it("should sign up users", async () => {
      const iface = maciContract.interface;

      await Promise.all(
        users.map(async (user, index) => {
          const tx = await maciContract.signUp(
            user.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
            signUpTxOpts,
          );
          const receipt = await tx.wait();
          expect(receipt?.status).to.eq(1);

          // Store the state index
          const log = receipt!.logs[receipt!.logs.length - 1];
          const event = iface.parseLog(log as unknown as { topics: string[]; data: string }) as unknown as {
            args: {
              _stateIndex: BigNumberish;
              _voiceCreditBalance: BigNumberish;
              _timestamp: BigNumberish;
            };
          };

          expect(event.args._stateIndex.toString()).to.eq((index + 1).toString());

          maciState.signUp(
            user.pubKey,
            BigInt(event.args._voiceCreditBalance.toString()),
            BigInt(event.args._timestamp.toString()),
          );
        }),
      );
    });

    it("signUp() should fail when given an invalid pubkey", async () => {
      await expect(
        maciContract.signUp(
          {
            x: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
            y: "0",
          },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
          signUpTxOpts,
        ),
      ).to.be.revertedWithCustomError(maciContract, "MaciPubKeyLargerThanSnarkFieldSize");
    });

    it("should not allow to sign up more than the supported amount of users (5 ** stateTreeDepth)", async () => {
      const stateTreeDepthTest = 1;
      const maxUsers = 5 ** stateTreeDepthTest;
      const maci = (await deployTestContracts(initialVoiceCreditBalance, stateTreeDepthTest, signer, true))
        .maciContract;
      const keypair = new Keypair();
      for (let i = 0; i < maxUsers; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await maci.signUp(
          keypair.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
      }

      // the next signup should fail
      await expect(
        maci.signUp(
          keypair.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(maci, "TooManySignups");
    });
  });

  describe("Deploy a Poll", () => {
    let deployTime: number | undefined;

    it("should set VKs and deploy a poll", async () => {
      const std = await maciContract.stateTreeDepth();

      // Set VKs
      let tx = await vkRegistryContract.setVerifyingKeys(
        std.toString(),
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        testProcessVk.asContractParam() as IVerifyingKeyStruct,
        testTallyVk.asContractParam() as IVerifyingKeyStruct,
        { gasLimit: 1000000 },
      );
      let receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      const pSig = await vkRegistryContract.genProcessVkSig(
        std.toString(),
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
      );

      expect(pSig.toString()).to.eq(
        genProcessVkSig(
          Number(std),
          treeDepths.messageTreeDepth,
          treeDepths.voteOptionTreeDepth,
          messageBatchSize,
        ).toString(),
      );

      const isPSigSet = await vkRegistryContract.isProcessVkSet(pSig);
      expect(isPSigSet).to.eq(true);

      const tSig = await vkRegistryContract.genTallyVkSig(
        std.toString(),
        treeDepths.intStateTreeDepth,
        treeDepths.voteOptionTreeDepth,
      );
      const isTSigSet = await vkRegistryContract.isTallyVkSet(tSig);
      expect(isTSigSet).to.eq(true);

      // Check that the VKs are set
      const processVkOnChain = await vkRegistryContract.getProcessVk(
        std,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
      );

      const tallyVkOnChain = await vkRegistryContract.getTallyVk(
        std.toString(),
        treeDepths.intStateTreeDepth,
        treeDepths.voteOptionTreeDepth,
      );

      compareVks(testProcessVk, processVkOnChain as unknown as VerifyingKey);
      compareVks(testTallyVk, tallyVkOnChain as unknown as VerifyingKey);

      // Create the poll and get the poll ID from the tx event logs
      tx = await maciContract.deployPoll(
        duration,
        maxValues,
        treeDepths,
        coordinator.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
        { gasLimit: 8000000 },
      );
      receipt = await tx.wait();

      const block = await signer.provider!.getBlock(receipt!.blockHash);
      deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);
      const iface = maciContract.interface;
      const logs = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(logs as unknown as { topics: string[]; data: string }) as unknown as {
        args: { _pollId: number };
      };
      pollId = event.args._pollId;

      const p = maciState.deployPoll(
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
    });

    it("should fail when attempting to init twice a Poll", async () => {
      const pollContractAddress = await maciContract.getPoll(pollId);
      const pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;

      await expect(pollContract.init()).to.be.reverted;
    });

    it("should set correct storage values", async () => {
      // Retrieve the Poll state and check that each value is correct
      const pollContractAddress = await maciContract.getPoll(pollId);
      const pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;

      const dd = await pollContract.getDeployTimeAndDuration();

      expect(Number(dd[0])).to.eq(deployTime);
      expect(Number(dd[1])).to.eq(duration);

      expect(await pollContract.stateAqMerged()).to.eq(false);

      const sb = await pollContract.currentSbCommitment();
      expect(sb.toString()).to.eq("0");

      const sm = await pollContract.numSignUpsAndMessages();
      // There are 3 signups via the MACI instance
      expect(Number(sm[0])).to.eq(3);

      // There are 1 messages until a user publishes a message
      // As we enqueue the NOTHING_UP_MY_SLEEVE hash
      expect(Number(sm[1])).to.eq(1);

      const onChainMaxValues = await pollContract.maxValues();

      expect(Number(onChainMaxValues.maxMessages)).to.eq(maxValues.maxMessages);
      expect(Number(onChainMaxValues.maxVoteOptions)).to.eq(maxValues.maxVoteOptions);

      const onChainTreeDepths = await pollContract.treeDepths();
      expect(Number(onChainTreeDepths.intStateTreeDepth)).to.eq(treeDepths.intStateTreeDepth);
      expect(Number(onChainTreeDepths.messageTreeDepth)).to.eq(treeDepths.messageTreeDepth);
      expect(Number(onChainTreeDepths.messageTreeSubDepth)).to.eq(treeDepths.messageTreeSubDepth);
      expect(Number(onChainTreeDepths.voteOptionTreeDepth)).to.eq(treeDepths.voteOptionTreeDepth);

      const onChainBatchSizes = await pollContract.batchSizes();
      expect(Number(onChainBatchSizes.messageBatchSize)).to.eq(messageBatchSize);
      expect(Number(onChainBatchSizes.tallyBatchSize)).to.eq(tallyBatchSize);
    });

    it("should prevent deploying a second poll before the first has finished", async () => {
      await expect(
        maciContract.deployPoll(duration, maxValues, treeDepths, coordinator.pubKey.asContractParam(), {
          gasLimit: 8000000,
        }),
      )
        .to.be.revertedWithCustomError(maciContract, "PreviousPollNotCompleted")
        .withArgs(1);
    });
  });

  describe("Merge sign-ups", () => {
    let pollContract: PollContract;

    before(async () => {
      const pollContractAddress = await maciContract.getPoll(pollId);
      pollContract = new BaseContract(pollContractAddress, pollAbi, signer) as PollContract;
    });

    it("coordinator should not be able to merge the signUp AccQueue", async () => {
      await expect(maciContract.mergeStateAqSubRoots(0, 0, { gasLimit: 3000000 })).to.be.revertedWithCustomError(
        maciContract,
        "CallerMustBePoll",
      );

      await expect(maciContract.mergeStateAq(0, { gasLimit: 3000000 })).to.be.revertedWithCustomError(
        maciContract,
        "CallerMustBePoll",
      );
    });

    it("The Poll should be able to merge the signUp AccQueue", async () => {
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(duration) + 1);
      let tx = await pollContract.mergeMaciStateAqSubRoots(0, pollId, {
        gasLimit: 3000000,
      });
      let receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      tx = await pollContract.mergeMaciStateAq(pollId, {
        gasLimit: 3000000,
      });
      receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("the state root must be correct", async () => {
      const onChainStateRoot = await stateAqContract.getMainRoot(STATE_TREE_DEPTH);
      expect(onChainStateRoot.toString()).to.eq(maciState.stateTree.root.toString());
    });
  });
});
