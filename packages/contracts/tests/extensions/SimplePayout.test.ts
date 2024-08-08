import { expect } from "chai";
import { encodeBytes32String, Signer } from "ethers";

import { deployContract, getSigners, SimplePayout, SimpleProjectRegistry, MockTally, MockERC20 } from "../../ts";

describe("SimplePayout", () => {
  let projectsRegistry: SimpleProjectRegistry;
  let mockTally: MockTally;
  let mockERC20: MockERC20;
  let simplePayout: SimplePayout;
  let tokenAddress: string;
  let owner: Signer;
  let user: Signer;

  let ownerAddress: string;
  let userAddress: string;

  const totalAmount = BigInt(1e18);

  before(async () => {
    const metadataUrl = encodeBytes32String("url");

    [owner, user] = await getSigners();
    [ownerAddress, userAddress] = await Promise.all([owner.getAddress(), user.getAddress()]);
    projectsRegistry = await deployContract("SimpleProjectRegistry", owner, true, metadataUrl);

    // add some "projects"
    await projectsRegistry.addProject({ project: userAddress, metadataUrl });
    await projectsRegistry.addProject({ project: ownerAddress, metadataUrl });

    mockTally = await deployContract("MockTally", owner, true);
    mockERC20 = await deployContract("MockERC20", owner, true, "MockERC20", "MOCK");

    await mockERC20.transfer(userAddress, totalAmount);

    tokenAddress = await mockERC20.getAddress();

    simplePayout = await deployContract(
      "SimplePayout",
      owner,
      true,
      await projectsRegistry.getAddress(),
      tokenAddress,
      await mockTally.getAddress(),
      BigInt(1e18),
      // totalVoiceCreditSpent
      100000n,
      0n,
      0n,
      0n,
    );
  });

  describe("ERC20", () => {
    it("should allow to deposit tokens", async () => {
      // approve tokens
      await mockERC20.approve(await simplePayout.getAddress(), totalAmount);
      await simplePayout.deposit();
    });

    it("should prevent depositing tokens if the caller is not the owner", async () => {
      await mockERC20.connect(user).approve(await simplePayout.getAddress(), totalAmount);
      await expect(simplePayout.connect(user).deposit()).to.be.revertedWithCustomError(
        simplePayout,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should prevent the user from collecting dust until all projects have been paid", async () => {
      await expect(simplePayout.collectDust()).to.be.revertedWithCustomError(simplePayout, "NotAllProjectsPaid");
    });

    it("should allow to pay out", async () => {
      const contractBalanceBefore = await mockERC20.balanceOf(await simplePayout.getAddress());
      await simplePayout.payout(0n, 5n, [[]], 0n, 0n, 0n, 0n);

      expect(await simplePayout.paid()).to.eq(1);

      expect(await mockERC20.balanceOf(await simplePayout.getAddress())).to.lt(contractBalanceBefore);
    });

    it("should prevent paying out the same voteOptionIndex again", async () => {
      await expect(simplePayout.payout(0n, 0n, [[]], 0n, 0n, 0n, 0n)).to.be.revertedWithCustomError(
        simplePayout,
        "ProjectAlreadyPaid",
      );
    });

    it("should fail to payout if the proof does not validate", async () => {
      await mockTally.flipReturnValue();

      await expect(simplePayout.payout(1n, 0n, [[]], 0n, 0n, 0n, 0n)).to.be.revertedWithCustomError(
        simplePayout,
        "InvalidProof",
      );
    });

    it("should allow to collect dust once all projects have been paid out", async () => {
      await mockTally.flipReturnValue();

      // pay out second project
      await simplePayout.payout(1n, 19n, [[]], 0n, 0n, 0n, 0n);

      // collect
      await simplePayout.collectDust();
    });
  });
});
