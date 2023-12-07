import { G1Point, G2Point } from "maci-crypto";

import type { IVkContractParams, IVkObjectParams } from "./types";

/**
 * @notice A TS Class representing a zk-SNARK VerifyingKey
 */
export class VerifyingKey {
  alpha1: G1Point;

  beta2: G2Point;

  gamma2: G2Point;

  delta2: G2Point;

  ic: G1Point[];

  /**
   * Generate a new VerifyingKey
   * @param alpha1 the alpha1 point
   * @param beta2 the beta2 point
   * @param gamma2 the gamma2 point
   * @param delta2 the delta2 point
   * @param ic the ic points
   */
  constructor(alpha1: G1Point, beta2: G2Point, gamma2: G2Point, delta2: G2Point, ic: G1Point[]) {
    this.alpha1 = alpha1;
    this.beta2 = beta2;
    this.gamma2 = gamma2;
    this.delta2 = delta2;
    this.ic = ic;
  }

  /**
   * Return this as an object which can be passed
   * to the smart contract
   * @returns the object representation of this
   */
  asContractParam(): IVkContractParams {
    return {
      alpha1: this.alpha1.asContractParam(),
      beta2: this.beta2.asContractParam(),
      gamma2: this.gamma2.asContractParam(),
      delta2: this.delta2.asContractParam(),
      ic: this.ic.map((x) => x.asContractParam()),
    };
  }

  /**
   * Create a new verifying key from a contract representation of the VK
   * @param data the object representation
   * @returns a new VerifyingKey
   */
  static fromContract(data: IVkContractParams): VerifyingKey {
    const convertG2 = (point: IVkContractParams["beta2"]): G2Point =>
      new G2Point([BigInt(point.x[0]), BigInt(point.x[1])], [BigInt(point.y[0]), BigInt(point.y[1])]);

    return new VerifyingKey(
      new G1Point(BigInt(data.alpha1.x), BigInt(data.alpha1.y)),
      convertG2(data.beta2),
      convertG2(data.gamma2),
      convertG2(data.delta2),
      data.ic.map((c) => new G1Point(BigInt(c.x), BigInt(c.y))),
    );
  }

  /**
   * Check whether this is equal to another verifying key
   * @param vk the other verifying key
   * @returns whether this is equal to the other verifying key
   */
  equals(vk: VerifyingKey): boolean {
    // Immediately return false if the length doesn't match
    if (this.ic.length !== vk.ic.length) {
      return false;
    }

    const icEqual = this.ic.every((ic, index) => ic.equals(vk.ic[index]));

    return (
      this.alpha1.equals(vk.alpha1) &&
      this.beta2.equals(vk.beta2) &&
      this.gamma2.equals(vk.gamma2) &&
      this.delta2.equals(vk.delta2) &&
      icEqual
    );
  }

  /**
   * Produce a copy of this verifying key
   * @returns the copy
   */
  copy(): VerifyingKey {
    const copyG2 = (point: G2Point): G2Point =>
      new G2Point(
        [BigInt(point.x[0].toString()), BigInt(point.x[1].toString())],
        [BigInt(point.y[0].toString()), BigInt(point.y[1].toString())],
      );

    return new VerifyingKey(
      new G1Point(BigInt(this.alpha1.x.toString()), BigInt(this.alpha1.y.toString())),
      copyG2(this.beta2),
      copyG2(this.gamma2),
      copyG2(this.delta2),
      this.ic.map((c: G1Point) => new G1Point(BigInt(c.x.toString()), BigInt(c.y.toString()))),
    );
  }

  /**
   * Deserialize into a VerifyingKey instance
   * @param json the JSON representation
   * @returns the VerifyingKey
   */
  static fromJSON = (json: string): VerifyingKey => {
    const data = JSON.parse(json) as IVkObjectParams;
    return VerifyingKey.fromObj(data);
  };

  /**
   * Convert an object representation to a VerifyingKey
   * @param data the object representation
   * @returns the VerifyingKey
   */
  static fromObj = (data: IVkObjectParams): VerifyingKey => {
    const alpha1 = new G1Point(BigInt(data.vk_alpha_1[0]), BigInt(data.vk_alpha_1[1]));
    const beta2 = new G2Point(
      [BigInt(data.vk_beta_2[0][1]), BigInt(data.vk_beta_2[0][0])],
      [BigInt(data.vk_beta_2[1][1]), BigInt(data.vk_beta_2[1][0])],
    );
    const gamma2 = new G2Point(
      [BigInt(data.vk_gamma_2[0][1]), BigInt(data.vk_gamma_2[0][0])],
      [BigInt(data.vk_gamma_2[1][1]), BigInt(data.vk_gamma_2[1][0])],
    );
    const delta2 = new G2Point(
      [BigInt(data.vk_delta_2[0][1]), BigInt(data.vk_delta_2[0][0])],
      [BigInt(data.vk_delta_2[1][1]), BigInt(data.vk_delta_2[1][0])],
    );
    const ic = data.IC.map(([x, y]) => new G1Point(BigInt(x), BigInt(y)));

    return new VerifyingKey(alpha1, beta2, gamma2, delta2, ic);
  };
}
