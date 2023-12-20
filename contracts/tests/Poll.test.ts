/* eslint-disable no-underscore-dangle */
import { expect } from "chai";
import { BaseContract, Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { MaciState } from "maci-core";
import { NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, Message, PCommand, PubKey } from "maci-domainobjs";

import { parseArtifact } from "../ts/abi";
import { getDefaultSigner } from "../ts/utils";
import { AccQueue, MACI, Poll as PollContract } from "../typechain-types";

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
  let pollId: number;
  let pollContract: PollContract;
  let signer: Signer;
  let deployTime: number;
  const coordinator = new Keypair();
  const [pollAbi] = parseArtifact("Poll");
  const [accQueueQuinaryMaciAbi] = parseArtifact("AccQueueQuinaryMaci");

  const maciState = new MaciState(STATE_TREE_DEPTH);

  before(async () => {
    signer = await getDefaultSigner();
    const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true);
    maciContract = r.maciContract;

    // deploy on chain poll
    const tx = await maciContract.deployPoll(duration, maxValues, treeDepths, coordinator.pubKey.asContractParam(), {
      gasLimit: 8000000,
    });
    const receipt = await tx.wait();

    const block = await signer.provider!.getBlock(receipt!.blockHash);
    deployTime = block!.timestamp;

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
  });

  it("should not be possible to init the Poll contract twice", async () => {
    await expect(pollContract.init()).to.be.revertedWithCustomError(pollContract, "PollAlreadyInit");
  });

  describe("Publish messages (vote + key-change)", () => {
    it("should publish a message to the Poll contract", async () => {
      const keypair = new Keypair();

      const command = new PCommand(
        BigInt(1),
        keypair.pubKey,
        BigInt(0),
        BigInt(9),
        BigInt(1),
        BigInt(pollId),
        BigInt(0),
      );

      const signature = command.sign(keypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinator.pubKey);
      const message = command.encrypt(signature, sharedKey);
      const tx = await pollContract.publishMessage(message.asContractParam(), keypair.pubKey.asContractParam());
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      maciState.polls[pollId].publishMessage(message, keypair.pubKey);
    });

    it("should not publish a message after the voting period", async () => {
      const dd = await pollContract.getDeployTimeAndDuration();
      await timeTravel(signer.provider as unknown as EthereumProvider, Number(dd[0]) + 1);

      const keypair = new Keypair();
      const command = new PCommand(
        BigInt(0),
        keypair.pubKey,
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(pollId),
        BigInt(0),
      );

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

    it("should revert if subtrees are not merged for StateAq", async () => {
      await expect(pollContract.mergeMaciStateAq(0, { gasLimit: 4000000 })).to.be.revertedWithCustomError(
        pollContract,
        "StateAqSubtreesNeedMerge",
      );
    });

    it("coordinator should be able to merge the message AccQueue", async () => {
      let tx = await pollContract.mergeMessageAqSubRoots(0, {
        gasLimit: 3000000,
      });
      let receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);

      tx = await pollContract.mergeMessageAq({ gasLimit: 4000000 });
      receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("the message root must be correct", async () => {
      const onChainMessageRoot = await messageAqContract.getMainRoot(MESSAGE_TREE_DEPTH);
      const offChainMessageRoot = maciState.polls[pollId].messageTree.root;

      expect(onChainMessageRoot.toString()).to.eq(offChainMessageRoot.toString());
    });
  });
});
