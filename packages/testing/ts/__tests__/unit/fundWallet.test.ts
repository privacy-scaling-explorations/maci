import { getDefaultSigner, fundWallet } from "@maci-protocol/sdk";
import { expect } from "chai";
import { ZeroAddress } from "ethers";

describe("fundWallet", () => {
  it("should increase the balance of a wallet", async () => {
    const signer = await getDefaultSigner();

    const balanceBefore = await signer.provider?.getBalance(ZeroAddress);
    await fundWallet({ amount: 1000000000, address: ZeroAddress, signer });
    const balanceAfter = await signer.provider?.getBalance(ZeroAddress);

    expect(Number(balanceAfter)).to.be.gt(Number(balanceBefore!));
  });
});
