import { expect } from "chai";

import { generateProcessVerifyingKeySignature, generateTallyVerifyingKeySignature } from "../utils/utils";

describe("Utils", () => {
  it("generateProcessVerifyingKeySignature should work", () => {
    const result = generateProcessVerifyingKeySignature(1, 2, 20);
    expect(result).to.equal(6805647338418769269285938892709073780738n);
  });

  it("generateTallyVerifyingKeySignature should work", () => {
    const result = generateTallyVerifyingKeySignature(1, 2, 3);
    expect(result).to.equal(340282366920938463500268095579187314691n);
  });
});
