import { expect } from "chai";
import { AbiCoder, BigNumberish } from "ethers";
import { MaxValues, STATE_TREE_DEPTH, TreeDepths } from "maci-core";
import { Keypair } from "maci-domainobjs";

import { getDefaultSigner } from "../ts/utils";
import { MACI } from "../typechain-types";

import { duration, initialVoiceCreditBalance, maxValues, treeDepths } from "./constants";
import { deployTestContracts } from "./utils";

describe("Overflow testing", () => {
  let maciContract: MACI;

  const coordinator = new Keypair();
  const users = [new Keypair(), new Keypair(), new Keypair()];

  beforeEach(async () => {
    const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, await getDefaultSigner(), true);
    maciContract = r.maciContract;
  });

  it("MACI.stateTreeDepth should be correct", async () => {
    const std = await maciContract.stateTreeDepth();
    expect(std.toString()).to.eq(STATE_TREE_DEPTH.toString());
  });

  it("SignUps - should not overflow", async () => {
    await maciContract.signUp(
      users[0].pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
      AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
      AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
    );
  });

  it("Deploy Poll - should not overflow", async () => {
    await maciContract.deployPoll(
      duration,
      maxValues,
      treeDepths,
      coordinator.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
    );
  });

  it("Deploy Poll - should not overflow with larger values for tree depths", async () => {
    const depths: TreeDepths = {
      intStateTreeDepth: 2,
      messageTreeDepth: 5,
      messageTreeSubDepth: 5,
      voteOptionTreeDepth: 2,
    };

    const values: MaxValues = {
      maxMessages: 3125,
      maxVoteOptions: 25,
    };

    const tx = await maciContract.deployPoll(
      duration,
      values,
      depths,
      coordinator.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
    );
    const receipt = await tx.wait();

    expect(receipt?.gasUsed.toString()).to.not.eq("");
    expect(receipt?.gasUsed.toString()).to.not.eq("0");
  });
});
