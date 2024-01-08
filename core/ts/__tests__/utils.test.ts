import { expect } from "chai";

import {
  genProcessVkSig,
  genTallyVkSig,
  genSubsidyVkSig,
  packProcessMessageSmallVals,
  unpackProcessMessageSmallVals,
  packTallyVotesSmallVals,
  unpackTallyVotesSmallVals,
  packSubsidySmallVals,
} from "../utils/utils";

describe("Utils", () => {
  it("genProcessVkSig should work", () => {
    const result = genProcessVkSig(1, 2, 3, 4);
    expect(result).to.equal(25108406941546723055683440059751604127909689873435325366275n);
  });

  it("genTallyVkSig should work", () => {
    const result = genTallyVkSig(1, 2, 3);
    expect(result).to.equal(340282366920938463500268095579187314691n);
  });

  it("genSubsidyVkSig should work", () => {
    const result = genSubsidyVkSig(1, 2, 3);
    expect(result).to.equal(340282366920938463500268095579187314691n);
  });

  it("packProcessMessageSmallVals should work", () => {
    const result = packProcessMessageSmallVals(1n, 2n, 3, 4);
    expect(result).to.equal(5708990770823843327184944562488436835454287873n);
  });

  it("unpackProcessMessageSmallVals should work", () => {
    const result = unpackProcessMessageSmallVals(5708990770823843327184944562488436835454287873n);
    expect(result).to.deep.equal({
      maxVoteOptions: 1n,
      numUsers: 2n,
      batchStartIndex: 3n,
      batchEndIndex: 4n,
    });
  });

  it("packTallyVotesSmallVals should work", () => {
    const result = packTallyVotesSmallVals(1, 2, 3);
    expect(result).to.equal(3377699720527872n);
  });

  it("unpackTallyVotesSmallVals should work", () => {
    const result = unpackTallyVotesSmallVals(3377699720527872n);
    expect(result).to.deep.equal({
      numSignUps: 3n,
      batchStartIndex: 0n,
    });
  });

  it("packSubsidySmallVals should work", () => {
    const result = packSubsidySmallVals(1, 2, 3);
    expect(result).to.equal(3802951800684689330390016458754n);
  });
});
