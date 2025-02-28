import { getDefaultSigner } from "maci-contracts";

import { timeTravel } from "../timeTravel";

describe("timeTravel", () => {
  test("should work when given a valid integer number", async () => {
    const signer = await getDefaultSigner();
    const blockNumber = await signer.provider?.getBlock("latest");

    await timeTravel({ seconds: 5, signer });

    const blockNumberAfter = await signer.provider?.getBlock("latest");
    expect(blockNumberAfter!.timestamp).toBeGreaterThan(blockNumber!.timestamp);
  });
});
