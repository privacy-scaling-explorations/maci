import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { getDefaultSigner } from "maci-contracts";

import { fundWallet } from "../../ts";

describe("fundWallet", () => {
  it("should increase the balance of a wallet", async () => {
    const signer = await getDefaultSigner();

    const balanceBefore = await signer.provider?.getBalance(ZeroAddress);
    await fundWallet({ amount: 1000000000, address: ZeroAddress, signer });
    const balanceAfter = await signer.provider?.getBalance(ZeroAddress);
    expect(Number(balanceAfter)).to.be.gt(Number(balanceBefore!));
  });
});
