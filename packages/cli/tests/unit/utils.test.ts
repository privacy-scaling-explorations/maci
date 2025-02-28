import { expect } from "chai";
import { SNARK_FIELD_SIZE, genRandomSalt } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";
import { compareVks, validateSalt } from "maci-sdk";

import fs from "fs";
import path from "path";

describe("utils", () => {
  describe("vks", () => {
    it("should return true for two equal VKs", async () => {
      const vkPath = path.resolve(__dirname, "data", "testVk.json");
      const vk1 = VerifyingKey.fromJSON(await fs.promises.readFile(vkPath).then((res) => res.toString()));

      expect(compareVks(vk1, vk1.asContractParam())).to.eq(true);
    });

    it("should return false for two unequal VKs", async () => {
      const vkPath = path.resolve(__dirname, "data", "testVk.json");
      const vk1 = VerifyingKey.fromJSON(await fs.promises.readFile(vkPath).then((res) => res.toString()));

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
