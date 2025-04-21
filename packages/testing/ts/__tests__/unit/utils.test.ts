import { SNARK_FIELD_SIZE, generateRandomSalt } from "@maci-protocol/crypto";
import { VerifyingKey } from "@maci-protocol/domainobjs";
import { compareVerifyingKeys, validateSalt } from "@maci-protocol/sdk";
import { expect } from "chai";

import fs from "fs";
import path from "path";

describe("utils", () => {
  describe("verifying keys", () => {
    it("should return true for two equal verifying keys", async () => {
      const verifyingKeyPath = path.resolve(__dirname, "..", "data", "testVk.json");
      const verifyingKey = VerifyingKey.fromJSON(
        await fs.promises.readFile(verifyingKeyPath).then((res) => res.toString()),
      );

      expect(compareVerifyingKeys(verifyingKey, verifyingKey.asContractParam())).to.eq(true);
    });

    it("should return false for two unequal verifying keys", async () => {
      const verifyingKeyPath = path.resolve(__dirname, "..", "data", "testVk.json");
      const verifyingKey = VerifyingKey.fromJSON(
        await fs.promises.readFile(verifyingKeyPath).then((res) => res.toString()),
      );

      const verifyingKeyCopy = verifyingKey.asContractParam();
      verifyingKeyCopy.alpha1.x = 9999n;
      expect(compareVerifyingKeys(verifyingKey, verifyingKeyCopy)).to.eq(false);
    });
  });

  describe("validateSalt", () => {
    it("should return true for a valid salt", () => {
      expect(validateSalt(generateRandomSalt())).to.eq(true);
    });

    it("should return false for an invalid salt", () => {
      expect(validateSalt(SNARK_FIELD_SIZE)).to.eq(false);
    });
  });
});
