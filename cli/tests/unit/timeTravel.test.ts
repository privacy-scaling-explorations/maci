import { expect } from "chai";
import { getDefaultSigner } from "maci-contracts";

import { timeTravel } from "../../ts";

describe("timeTravel", () => {
  it("should work when given a valid integer number", async () => {
    const signer = await getDefaultSigner();
    const blockNumber = await signer.provider?.getBlock("latest");

    await expect(timeTravel({ seconds: 5 })).to.be.fulfilled;

    const blockNumberAfter = await signer.provider?.getBlock("latest");
    expect(blockNumberAfter!.timestamp).to.be.gt(blockNumber!.timestamp);
  });
});
