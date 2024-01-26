/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { AbiCoder, BaseContract, BigNumberish, Contract, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, PubKey, Message } from "maci-domainobjs";

import { parseArtifact } from "../ts/abi";
import { getDefaultSigner, getSigners } from "../ts/utils";
import { AccQueueQuinaryMaci, MACI, Poll as PollContract, Verifier, VkRegistry } from "../typechain-types";

import {
  STATE_TREE_DEPTH,
  duration,
  initialVoiceCreditBalance,
  maxValues,
  messageBatchSize,
  treeDepths,
} from "./constants";
import { timeTravel, deployTestContracts } from "./utils";

describe("MACI", () => {
  let maciContract: MACI;
  let stateAqContract: AccQueueQuinaryMaci;
  let vkRegistryContract: VkRegistry;
  let verifierContract: Verifier;
  let pollId: bigint;

  const coordinator = new Keypair();
  const [pollAbi] = parseArtifact("Poll");
  const users = [new Keypair(), new Keypair(), new Keypair()];

  let signer: Signer;

  const maciState = new MaciState(STATE_TREE_DEPTH);
  const signUpTxOpts = { gasLimit: 400000 };

  describe("Deployment", () => {
    before(async () => {
      signer = await getDefaultSigner();
      const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true);

      maciContract = r.maciContract;
      stateAqContract = r.stateAqContract;
      vkRegistryContract = r.vkRegistryContract;
      verifierContract = r.mockVerifierContract as Verifier;
    });

    it("should have set the correct stateTreeDepth", async () => {
      const std = await maciContract.stateTreeDepth();
      expect(std.toString()).to.eq(STATE_TREE_DEPTH.toString());
    });

    it("should be the owner of the stateAqContract", async () => {
      const stateAqAddr = await maciContract.stateAq();
      const stateAq = new Contract(stateAqAddr, parseArtifact("AccQueueQuinaryBlankSl")[0], signer);

      expect(await stateAq.owner()).to.eq(await maciContract.getAddress());
    });

    it("should be possible to deploy Maci contracts with different state tree depth values", async () => {
      const checkStateTreeDepth = async (stateTreeDepthTest: number): Promise<void> => {
        const { maciContract: testMaci } = await deployTestContracts(
          initialVoiceCreditBalance,
          stateTreeDepthTest,
          signer,
          true,
        );
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

      await Promise.all(
        users.map(async (user, index) => {
          const tx = await maciContract.signUp(
            user.pubKey.asContractParam(),
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

    it("should fail when given an invalid pubkey", async () => {
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
      ).to.be.revertedWithCustomError(maci, "TooManySignups");
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
        false,
        { gasLimit: 10000000 },
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

    it("should prevent deploying a second poll before the first has finished", async () => {
      await expect(
        maciContract.deployPoll(
          duration,
          treeDepths,
          coordinator.pubKey.asContractParam(),
          verifierContract,
          vkRegistryContract,
          false,
          {
            gasLimit: 10000000,
          },
        ),
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

    it("should not allow the coordinator to merge the signUp AccQueue", async () => {
      await expect(maciContract.mergeStateAqSubRoots(0, 0, { gasLimit: 3000000 })).to.be.revertedWithCustomError(
        maciContract,
        "CallerMustBePoll",
      );

      await expect(maciContract.mergeStateAq(0, { gasLimit: 3000000 })).to.be.revertedWithCustomError(
        maciContract,
        "CallerMustBePoll",
      );
    });

    it("should not allow a user to merge the signUp AccQueue", async () => {
      const nonAdminUser = (await getSigners())[1];
      await expect(
        maciContract.connect(nonAdminUser).mergeStateAqSubRoots(0, 0, { gasLimit: 3000000 }),
      ).to.be.revertedWithCustomError(maciContract, "CallerMustBePoll");
    });

    it("should allow a Poll contract to merge the signUp AccQueue", async () => {
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

    it("should have the correct state root on chain after merging the acc queue", async () => {
      const onChainStateRoot = await stateAqContract.getMainRoot(STATE_TREE_DEPTH);
      maciState.polls.get(pollId)?.updatePoll(await pollContract.numSignups());
      expect(onChainStateRoot.toString()).to.eq(maciState.polls.get(pollId)?.stateTree?.root.toString());
    });
  });

  describe("getStateAqRoot", () => {
    it("should return the correct state root", async () => {
      const onChainStateRoot = await maciContract.getStateAqRoot();
      expect(onChainStateRoot.toString()).to.eq(maciState.polls.get(pollId)?.stateTree?.root.toString());
    });
  });

  describe("getPoll", () => {
    it("should return an address for a valid id", async () => {
      expect(await maciContract.getPoll(pollId)).to.not.eq(0);
    });

    it("should throw when given an invalid poll id", async () => {
      await expect(maciContract.getPoll(5)).to.be.revertedWithCustomError(maciContract, "PollDoesNotExist").withArgs(5);
    });
  });
});
