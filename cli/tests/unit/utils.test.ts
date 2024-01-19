import { expect } from "chai";
import { SNARK_FIELD_SIZE, genRandomSalt } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";
import path from "path";

import { compareVks } from "../../ts/utils";
import { validateSalt } from "../../ts/utils/salt";

describe("utils", () => {
  const vkPath = path.resolve(__dirname, "data", "testVk.json");
  const vk1 = VerifyingKey.fromJSON(fs.readFileSync(vkPath).toString());

  describe("vks", () => {
    it("should return true for two equal VKs", () => {
      expect(compareVks(vk1, vk1.asContractParam())).to.eq(true);
    });

    it("should return false for two unequal VKs", () => {
      const vk2 = vk1.asContractParam();
      vk2.alpha1.x = 9999n;
      expect(compareVks(vk1, vk2)).to.eq(false);
    });
  });

  describe("validateSalt", () => {
    it("should return true for a valid salt", () => {
      expect(validateSalt(genRandomSalt())).to.eq(true);
    });

    it("should return false for an invalid salt", () => {
      expect(validateSalt(SNARK_FIELD_SIZE)).to.eq(false);
    });
  });
});
