import { expect } from "chai";

import { genProcessVkSig, genTallyVkSig } from "../utils/utils";

describe("Utils", () => {
  it("genProcessVkSig should work", () => {
    const result = genProcessVkSig(1, 2, 20);
    expect(result).to.equal(6805647338418769269285938892709073780738n);
  });

  it("genTallyVkSig should work", () => {
    const result = genTallyVkSig(1, 2, 3);
    expect(result).to.equal(340282366920938463500268095579187314691n);
  });
});
