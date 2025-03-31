import { getDefaultSigner, timeTravel } from "@maci-protocol/sdk";
import { expect } from "chai";

describe("timeTravel", () => {
  it("should work when given a valid integer number", async () => {
    const signer = await getDefaultSigner();
    const blockNumber = await signer.provider?.getBlock("latest");

    await timeTravel({ seconds: 5, signer });

    const blockNumberAfter = await signer.provider?.getBlock("latest");
    expect(blockNumberAfter!.timestamp).to.be.gt(blockNumber!.timestamp);
  });
});
