import { expect } from "chai";
import { BaseContract, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployPollFactory, getDefaultSigner } from "../ts";
import { PollFactory } from "../typechain-types";

import { messageBatchSize, maxVoteOptions, treeDepths } from "./constants";

describe("pollFactory", () => {
  let pollFactory: PollFactory;
  let signer: Signer;

  const { pubKey: coordinatorPubKey } = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
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
        ZeroAddress,
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
          ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(pollFactory, "InvalidMaxVoteOptions");
    });
  });
});
