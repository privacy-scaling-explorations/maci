import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ZeroAddress } from "ethers";
import { deployTopupCredit } from "maci-contracts";

import { airdrop } from "../../ts";

chai.use(chaiAsPromised);

describe("airdrop", () => {
  let topupContractAddress: string | undefined;

  before(async () => {
    const topupContract = await deployTopupCredit();
    topupContractAddress = await topupContract.getAddress();
  });

  it("should airdrop tokens to the coordinator", async () => {
    await expect(airdrop(100, topupContractAddress)).to.be.fulfilled;
  });

  it("should throw when the amount is negative", async () => {
    await expect(airdrop(-1, topupContractAddress)).to.be.rejectedWith("Invalid amount");
  });

  it("should throw when the ERC20 contract address is invalid", async () => {
    await expect(airdrop(100, ZeroAddress)).to.be.rejectedWith("Invalid ERC20 contract address");
  });
});
