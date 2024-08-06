import { expect } from "chai";
import { G1Point } from "maci-crypto";

import fs from "fs";
import path from "path";

import { IVkObjectParams, VerifyingKey } from "..";

describe("verifyingKey", () => {
  describe("fromJSON", () => {
    it("should convert a JSON file from snarkjs to a VerifyingKey", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const d = JSON.parse(j) as IVkObjectParams;
      const vk = VerifyingKey.fromJSON(j);

      expect(d.vk_alpha_1[0]).to.eq(vk.alpha1.x.toString());
      expect(d.vk_alpha_1[1]).to.eq(vk.alpha1.y.toString());

      expect(d.vk_beta_2[0][0]).to.eq(vk.beta2.x[1].toString());
      expect(d.vk_beta_2[0][1]).to.eq(vk.beta2.x[0].toString());
      expect(d.vk_beta_2[1][0]).to.eq(vk.beta2.y[1].toString());
      expect(d.vk_beta_2[1][1]).to.eq(vk.beta2.y[0].toString());

      expect(d.vk_gamma_2[0][0]).to.eq(vk.gamma2.x[1].toString());
      expect(d.vk_gamma_2[0][1]).to.eq(vk.gamma2.x[0].toString());
      expect(d.vk_gamma_2[1][0]).to.eq(vk.gamma2.y[1].toString());
      expect(d.vk_gamma_2[1][1]).to.eq(vk.gamma2.y[0].toString());

      expect(d.vk_delta_2[0][0]).to.eq(vk.delta2.x[1].toString());
      expect(d.vk_delta_2[0][1]).to.eq(vk.delta2.x[0].toString());
      expect(d.vk_delta_2[1][0]).to.eq(vk.delta2.y[1].toString());
      expect(d.vk_delta_2[1][1]).to.eq(vk.delta2.y[0].toString());

      expect(d.IC.length).to.eq(vk.ic.length);
      for (let i = 0; i < d.IC.length; i += 1) {
        expect(d.IC[i][0]).to.eq(vk.ic[i].x.toString());
        expect(d.IC[i][1]).to.eq(vk.ic[i].y.toString());
      }
    });
  });

  describe("copy", () => {
    it("Copy should generate a deep copy", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);

      const vk2 = vk.copy();
      expect(vk.equals(vk2)).to.eq(true);
    });
  });

  describe("equals", () => {
    it("should return true for equal verifying keys", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);
      const vk2 = vk.copy();
      expect(vk.equals(vk2)).to.eq(true);
    });
    it("should return false for unequal verifying keys", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);
      const vk2 = vk.copy();
      vk2.alpha1.x = BigInt(123);
      expect(vk.equals(vk2)).to.eq(false);
    });
    it("should return false for unequal verifying keys (different ic)", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);
      const vk2 = vk.copy();
      vk2.ic[15] = {} as unknown as G1Point;
      expect(vk.equals(vk2)).to.eq(false);
    });
  });

  describe("fromObj", () => {
    it("should convert an object to a VerifyingKey", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const d = JSON.parse(j) as IVkObjectParams;
      const vk = VerifyingKey.fromObj(d);

      expect(d.vk_alpha_1[0]).to.eq(vk.alpha1.x.toString());
      expect(d.vk_alpha_1[1]).to.eq(vk.alpha1.y.toString());

      expect(d.vk_beta_2[0][0]).to.eq(vk.beta2.x[1].toString());
      expect(d.vk_beta_2[0][1]).to.eq(vk.beta2.x[0].toString());
      expect(d.vk_beta_2[1][0]).to.eq(vk.beta2.y[1].toString());
      expect(d.vk_beta_2[1][1]).to.eq(vk.beta2.y[0].toString());

      expect(d.vk_gamma_2[0][0]).to.eq(vk.gamma2.x[1].toString());
      expect(d.vk_gamma_2[0][1]).to.eq(vk.gamma2.x[0].toString());
      expect(d.vk_gamma_2[1][0]).to.eq(vk.gamma2.y[1].toString());
      expect(d.vk_gamma_2[1][1]).to.eq(vk.gamma2.y[0].toString());

      expect(d.vk_delta_2[0][0]).to.eq(vk.delta2.x[1].toString());
      expect(d.vk_delta_2[0][1]).to.eq(vk.delta2.x[0].toString());
      expect(d.vk_delta_2[1][0]).to.eq(vk.delta2.y[1].toString());
      expect(d.vk_delta_2[1][1]).to.eq(vk.delta2.y[0].toString());

      expect(d.IC.length).to.eq(vk.ic.length);
      for (let i = 0; i < d.IC.length; i += 1) {
        expect(d.IC[i][0]).to.eq(vk.ic[i].x.toString());
        expect(d.IC[i][1]).to.eq(vk.ic[i].y.toString());
      }
    });
  });

  describe("asContractParam", () => {
    it("should produce an object with the correct properties", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);
      const obj = vk.asContractParam();

      expect(Object.keys(obj)).to.deep.eq(["alpha1", "beta2", "gamma2", "delta2", "ic"]);
    });
  });

  describe("fromContract", () => {
    it("should produce a VerifyingKey from a contract object", () => {
      const file = path.join(__dirname, "./artifacts/test_vk.json");
      const j = fs.readFileSync(file).toString();
      const vk = VerifyingKey.fromJSON(j);
      const obj = vk.asContractParam();
      const vk2 = VerifyingKey.fromContract(obj);

      expect(vk.equals(vk2)).to.eq(true);
    });
  });
});
