import { expect } from "chai";
import { BaseContract, Signer } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployPollFactory, getDefaultSigner } from "../ts";
import { MACI, PollFactory } from "../typechain-types";

import { messageBatchSize, initialVoiceCreditBalance, maxVoteOptions, STATE_TREE_DEPTH, treeDepths } from "./constants";
import { deployTestContracts } from "./utils";

describe("pollFactory", () => {
  let maciContract: MACI;
  let pollFactory: PollFactory;
  let signer: Signer;

  const { pubKey: coordinatorPubKey } = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
    const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true);
    maciContract = r.maciContract;

    pollFactory = (await deployPollFactory(signer, true)) as BaseContract as PollFactory;
  });

  describe("deployment", () => {
    it("should allow anyone to deploy a new poll", async () => {
      const tx = await pollFactory.deploy(
        "100",
        maxVoteOptions,
        treeDepths,
        messageBatchSize,
        coordinatorPubKey.asContractParam(),
        maciContract,
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });

    it("should revert when called with an invalid param for max vote options", async () => {
      const maxVoteOptionsInvalid = 2 ** 50;
      await expect(
        pollFactory.deploy(
          "100",
          maxVoteOptionsInvalid,
          treeDepths,
          messageBatchSize,
          coordinatorPubKey.asContractParam(),
          maciContract,
        ),
      ).to.be.revertedWithCustomError(pollFactory, "InvalidMaxVoteOptions");
    });
  });
});
