/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { AbiCoder, BigNumberish, Signer, ZeroAddress } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, PubKey, Message } from "maci-domainobjs";

import { EMode } from "../ts/constants";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { MACI, Poll as PollContract, Poll__factory as PollFactory, Verifier, VkRegistry } from "../typechain-types";

import { STATE_TREE_DEPTH, duration, initialVoiceCreditBalance, messageBatchSize, treeDepths } from "./constants";
import { timeTravel, deployTestContracts } from "./utils";

describe("MACI", function test() {
  this.timeout(90000);

  let maciContract: MACI;
  let vkRegistryContract: VkRegistry;
  let verifierContract: Verifier;
  let pollId: bigint;

  const coordinator = new Keypair();
  const users = [new Keypair(), new Keypair(), new Keypair()];

  let signer: Signer;

  const maciState = new MaciState(STATE_TREE_DEPTH);

  describe("Deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
      });

      maciContract = r.maciContract;
      vkRegistryContract = r.vkRegistryContract;
      verifierContract = r.mockVerifierContract as Verifier;
    });

    it("should have set the correct stateTreeDepth", async () => {
      const std = await maciContract.stateTreeDepth();
      expect(std.toString()).to.eq(STATE_TREE_DEPTH.toString());
    });

    it("should be possible to deploy Maci contracts with different state tree depth values", async () => {
      const checkStateTreeDepth = async (stateTreeDepthTest: number): Promise<void> => {
        const { maciContract: testMaci } = await deployTestContracts({
          initialVoiceCreditBalance,
          stateTreeDepth: stateTreeDepthTest,
          signer,
        });
        expect(await testMaci.stateTreeDepth()).to.eq(stateTreeDepthTest);
      };

      await checkStateTreeDepth(1);
      await checkStateTreeDepth(2);
      await checkStateTreeDepth(3);
    });
  });

  describe("Signups", () => {
    it("should sign up multiple users", async () => {
      const iface = maciContract.interface;

      for (let index = 0; index < users.length; index += 1) {
        const user = users[index];

        // eslint-disable-next-line no-await-in-loop
        const tx = await maciContract.signUp(
          user.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
        // eslint-disable-next-line no-await-in-loop
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
      }
    });

    it("should fail when given an invalid pubkey (x >= p)", async () => {
      await expect(
        maciContract.signUp(
          {
            x: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
            y: "0",
          },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(maciContract, "InvalidPubKey");
    });

    it("should fail when given an invalid pubkey (y >= p)", async () => {
      await expect(
        maciContract.signUp(
          {
            x: "1",
            y: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
          },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(maciContract, "InvalidPubKey");
    });

    it("should fail when given an invalid pubkey (x >= p and y >= p)", async () => {
      await expect(
        maciContract.signUp(
          {
            x: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
            y: "21888242871839275222246405745257275088548364400416034343698204186575808495617",
          },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(maciContract, "InvalidPubKey");
    });

    it("should fail when given an invalid public key (not on the curve)", async () => {
      await expect(
        maciContract.signUp(
          {
            x: "1",
            y: "1",
          },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(maciContract, "InvalidPubKey");
    });

    it("should not allow to sign up more than the supported amount of users (2 ** stateTreeDepth)", async () => {
      const stateTreeDepthTest = 1;
      const maxUsers = 2 ** stateTreeDepthTest;
      const maci = (
        await deployTestContracts({
          initialVoiceCreditBalance,
          stateTreeDepth: stateTreeDepthTest,
          signer,
        })
      ).maciContract;
      const keypair = new Keypair();
      // start from one as we already have one signup (blank state leaf)
      for (let i = 1; i < maxUsers; i += 1) {
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
      ).to.be.revertedWithCustomError(maciContract, "TooManySignups");
    });

    it("should signup 2 ** 10 users", async () => {
      const stateTreeDepthTest = 10;
      const maxUsers = 2 ** stateTreeDepthTest;
      const { maciContract: maci } = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: stateTreeDepthTest,
        signer,
      });

      const keypair = new Keypair();
      // start from one as we already have one signup (blank state leaf)
      for (let i = 1; i < maxUsers; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await maci.signUp(
          keypair.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        );
      }
    });
  });

  describe("Deploy a Poll", () => {
    let deployTime: number | undefined;

    it("should deploy a poll", async () => {
      // Create the poll and get the poll ID from the tx event logs
      const tx = await maciContract.deployPoll(
        duration,
        treeDepths,
        coordinator.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
        verifierContract,
        vkRegistryContract,
        EMode.QV,
      );
      const receipt = await tx.wait();

      const block = await signer.provider!.getBlock(receipt!.blockHash);
      deployTime = block!.timestamp;

      expect(receipt?.status).to.eq(1);
      pollId = (await maciContract.nextPollId()) - 1n;

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

    it("should allow to deploy a new poll even before the first one is completed", async () => {
      const tx = await maciContract.deployPoll(
        duration,
        treeDepths,
        coordinator.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
        verifierContract,
        vkRegistryContract,
        EMode.QV,
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
      expect(await maciContract.nextPollId()).to.eq(2);
    });

    it("should allow any user to deploy a poll", async () => {
      const [, user] = await getSigners();
      const tx = await maciContract
        .connect(user)
        .deployPoll(
          duration,
          treeDepths,
          users[0].pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
          verifierContract,
          vkRegistryContract,
          EMode.QV,
        );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
      expect(await maciContract.nextPollId()).to.eq(3);
    });
  });

  describe("Merge sign-ups", () => {
    let pollContract: PollContract;

    before(async () => {
      const pollContracts = await maciContract.getPoll(pollId);
      pollContract = PollFactory.connect(pollContracts.poll, signer);
    });

    it("should allow a Poll contract to merge the state tree (calculate the state root)", async () => {
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(duration) + 1);

      const tx = await pollContract.mergeMaciState();
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should have the correct state root on chain after calculating the root on chain", async () => {
      maciState.polls.get(pollId)?.updatePoll(await pollContract.numSignups());
      expect(await maciContract.getStateTreeRoot()).to.eq(maciState.polls.get(pollId)?.stateTree?.root.toString());
    });

    it("should get the correct state root with getStateTreeRoot", async () => {
      const onChainStateRoot = await maciContract.getStateTreeRoot();
      expect(onChainStateRoot.toString()).to.eq(maciState.polls.get(pollId)?.stateTree?.root.toString());
    });

    it("should allow a user to signup after the state tree root was calculated", async () => {
      const tx = await maciContract.signUp(
        users[0].pubKey.asContractParam(),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      const iface = maciContract.interface;

      // Store the state index
      const log = receipt!.logs[receipt!.logs.length - 1];
      const event = iface.parseLog(log as unknown as { topics: string[]; data: string }) as unknown as {
        args: {
          _stateIndex: BigNumberish;
          _voiceCreditBalance: BigNumberish;
          _timestamp: BigNumberish;
        };
      };

      maciState.signUp(
        users[0].pubKey,
        BigInt(event.args._voiceCreditBalance.toString()),
        BigInt(event.args._timestamp.toString()),
      );
    });
  });

  describe("getPoll", () => {
    it("should return an object for a valid id", async () => {
      const pollContracts = await maciContract.getPoll(pollId);
      expect(pollContracts.poll).to.not.eq(ZeroAddress);
      expect(pollContracts.messageProcessor).to.not.eq(ZeroAddress);
      expect(pollContracts.tally).to.not.eq(ZeroAddress);
    });

    it("should throw when given an invalid poll id", async () => {
      await expect(maciContract.getPoll(5)).to.be.revertedWithCustomError(maciContract, "PollDoesNotExist").withArgs(5);
    });
  });
});
