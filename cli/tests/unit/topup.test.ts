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
    const [signUpTokenGatekeeperContractAddress, initialVoiceCreditBalanceAddress, topupCreditContractAddress] =
      await Promise.all([
        signupGatekepper.getAddress(),
        initialVoiceCreditProxyAddress.getAddress(),
        topupCredit.getAddress(),
      ]);

    const { maciContract } = await deployMaci({
      signUpTokenGatekeeperContractAddress,
      initialVoiceCreditBalanceAddress,
      topupCreditContractAddress,
      signer,
      stateTreeDepth: 10,
      quiet: true,
    });

    maciAddress = await maciContract.getAddress();
  });

  it("should throw when the state index is invalid", async () => {
    await expect(topup({ amount: 100, pollId: 0n, stateIndex: 0, maciAddress })).to.be.rejectedWith(
      "State index must be greater than 0",
    );
  });

  it("should throw when the poll ID is invalid", async () => {
    await expect(topup({ amount: 100, pollId: -1n, stateIndex: 1, maciAddress })).to.be.rejectedWith(
      "Poll ID must be a positive integer",
    );
  });

  it("should throw when the amount is invalid", async () => {
    await expect(topup({ amount: 0, pollId: 0n, stateIndex: 1, maciAddress })).to.be.rejectedWith(
      "Topup amount must be greater than 0",
    );
  });
});
