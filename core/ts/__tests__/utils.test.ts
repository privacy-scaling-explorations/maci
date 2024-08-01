import { expect } from "chai";

import { genProcessVkSig, genTallyVkSig } from "../utils/utils";

describe("Utils", () => {
  it("genProcessVkSig should work", () => {
    const result = genProcessVkSig(1, 2, 3, 4);
    expect(result).to.equal(25108406941546723055683440059751604127909689873435325366275n);
  });

  it("genTallyVkSig should work", () => {
    const result = genTallyVkSig(1, 2, 3);
    expect(result).to.equal(340282366920938463500268095579187314691n);
  });
});
