import assert from "assert";
import { randomBytes } from "crypto";

import type { PrivKey } from "./types";

import { SNARK_FIELD_SIZE } from "./constants";

/**
 * @notice A class representing a point on the first group (G1)
 * of the Jubjub curve
 */
export class G1Point {
  x: bigint;

  y: bigint;

  /**
   * Create a new instance of G1Point
   * @param x the x coordinate
   * @param y the y coordinate
   */
  constructor(x: bigint, y: bigint) {
    assert(x < SNARK_FIELD_SIZE && x >= 0, "G1Point x out of range");
    assert(y < SNARK_FIELD_SIZE && y >= 0, "G1Point y out of range");
    this.x = x;
    this.y = y;
  }

  /**
   * Check whether two points are equal
   * @param pt the point to compare with
   * @returns whether they are equal or not
   */
  equals(pt: G1Point): boolean {
    return this.x === pt.x && this.y === pt.y;
  }

  /**
   * Return the point as a contract param in the form of an object
   * @returns the point as a contract param
   */
  asContractParam(): { x: string; y: string } {
    return {
      x: this.x.toString(),
      y: this.y.toString(),
    };
  }
}

/**
 * @notice A class representing a point on the second group (G2)
 * of the Jubjub curve. This is usually an extension field of the
 * base field of the curve.
 */
export class G2Point {
  x: bigint[];

  y: bigint[];

  /**
   * Create a new instance of G2Point
   * @param x the x coordinate
   * @param y the y coordinate
   */
  constructor(x: bigint[], y: bigint[]) {
    this.checkPointsRange(x, "x");
    this.checkPointsRange(y, "y");

    this.x = x;
    this.y = y;
  }

  /**
   * Check whether two points are equal
   * @param pt the point to compare with
   * @returns whether they are equal or not
   */
  equals(pt: G2Point): boolean {
    return this.x[0] === pt.x[0] && this.x[1] === pt.x[1] && this.y[0] === pt.y[0] && this.y[1] === pt.y[1];
  }

  /**
   * Return the point as a contract param in the form of an object
   * @returns the point as a contract param
   */
  asContractParam(): { x: string[]; y: string[] } {
    return {
      x: this.x.map((n) => n.toString()),
      y: this.y.map((n) => n.toString()),
    };
  }

  /**
   * Check whether the points are in range
   * @param x the x coordinate
   * @param type the type of the coordinate
   */
  private checkPointsRange(x: bigint[], type: "x" | "y") {
    assert(
      x.every((n) => n < SNARK_FIELD_SIZE && n >= 0),
      `G2Point ${type} out of range`,
    );
  }
}

/**
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @returns A BabyJub-compatible random value.
 */
export const genRandomBabyJubValue = (): bigint => {
  // Prevent modulo bias
  // const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
  // const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
  const min = BigInt("6350874878119819312338956282401532410528162663560392320966563075034087161851");

  let privKey: PrivKey = SNARK_FIELD_SIZE;

  do {
    const rand = BigInt(`0x${randomBytes(32).toString("hex")}`);

    if (rand >= min) {
      privKey = rand % SNARK_FIELD_SIZE;
    }
  } while (privKey >= SNARK_FIELD_SIZE);

  return privKey;
};
