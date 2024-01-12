import { expect } from "chai";
import { Signer } from "ethers";
import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployMaci,
  deployTopupCredit,
  getDefaultSigner,
} from "maci-contracts";

import { topup } from "../../ts";

describe("topup", () => {
  let signer: Signer;
  let maciAddress: string;

  before(async () => {
    signer = await getDefaultSigner();
    const signupGatekepper = await deployFreeForAllSignUpGatekeeper(signer, true);
    const topupCredit = await deployTopupCredit(signer, true);
    const initialVoiceCreditProxyAddress = await deployConstantInitialVoiceCreditProxy(100, signer, true);
    const maciContracts = await deployMaci(
      await signupGatekepper.getAddress(),
      await initialVoiceCreditProxyAddress.getAddress(),
      await topupCredit.getAddress(),
      signer,
      10,
      true,
    );
    maciAddress = await maciContracts.maciContract.getAddress();
  });

  it("should throw when the state index is invalid", async () => {
    await expect(topup(100, 0, 0, maciAddress)).to.be.rejectedWith("State index must be greater than 0");
  });

  it("should throw when the poll ID is invalid", async () => {
    await expect(topup(100, 1, -1, maciAddress)).to.be.rejectedWith("Poll ID must be a positive integer");
  });

  it("should throw when the amount is invalid", async () => {
    await expect(topup(0, 1, 0, maciAddress)).to.be.rejectedWith("Topup amount must be greater than 0");
  });
});
