import { expect } from "chai";

import { bigInt2Buffer, fromRprLE, fromString, shiftRight, stringifyBigInts, unstringifyBigInts } from "../bigIntUtils";
import { SNARK_FIELD_SIZE } from "../constants";
import { genTreeCommitment, genTreeProof } from "../utils";

describe("Utils", () => {
  describe("stringifyBigInts", () => {
    it("should work on a BigInt input", () => {
      expect(stringifyBigInts(BigInt(1))).to.eq("1");
    });

    it("should work on a BigInt[] input", () => {
      expect(stringifyBigInts([BigInt(1), BigInt(2)])).to.deep.eq(["1", "2"]);
    });

    it("should work on a BigInt[][] input", () => {
      expect(
        stringifyBigInts([
          [BigInt(1), BigInt(2)],
          [BigInt(3), BigInt(4)],
        ]),
      ).to.deep.eq([
        ["1", "2"],
        ["3", "4"],
      ]);
    });

    it("should work on a BigInt[][][] input", () => {
      expect(
        stringifyBigInts([
          [
            [BigInt(1), BigInt(2)],
            [BigInt(3), BigInt(4)],
          ],
          [
            [BigInt(5), BigInt(6)],
            [BigInt(7), BigInt(8)],
          ],
        ]),
      ).to.deep.eq([
        [
          ["1", "2"],
          ["3", "4"],
        ],
        [
          ["5", "6"],
          ["7", "8"],
        ],
      ]);
    });

    it("should work on a { [key: string]: BigInt } input", () => {
      expect(stringifyBigInts({ a: BigInt(1), b: BigInt(2) })).to.deep.eq({ a: "1", b: "2" });
    });

    it("should work on a null input", () => {
      expect(stringifyBigInts(null)).to.eq(null);
    });

    it("should return the input if it is not a valid value", () => {
      expect(stringifyBigInts("A")).to.eq("A");
    });

    it("should work on a Uint8Array input", () => {
      const input = new Uint8Array([1, 2, 3, 4]);
      expect(stringifyBigInts(input)).to.eq("67305985");
    });
  });

  describe("unstringifyBigInts", () => {
    it("should work on a string input with decimal numbers", () => {
      expect(unstringifyBigInts("1")).to.eq(BigInt(1));
    });

    it("should work on a string input with hex number", () => {
      expect(unstringifyBigInts("0xA")).to.eq(BigInt(10));
    });

    it("should work on a string[] input", () => {
      expect(unstringifyBigInts(["1", "2"])).to.deep.eq([BigInt(1), BigInt(2)]);
    });

    it("should work on a string[][] input", () => {
      expect(
        unstringifyBigInts([
          ["1", "2"],
          ["3", "4"],
        ]),
      ).to.deep.eq([
        [BigInt(1), BigInt(2)],
        [BigInt(3), BigInt(4)],
      ]);
    });

    it("should work on a string[][][] input", () => {
      expect(
        unstringifyBigInts([
          [
            ["1", "2"],
            ["3", "4"],
          ],
          [
            ["5", "6"],
            ["7", "8"],
          ],
        ]),
      ).to.deep.eq([
        [
          [BigInt(1), BigInt(2)],
          [BigInt(3), BigInt(4)],
        ],
        [
          [BigInt(5), BigInt(6)],
          [BigInt(7), BigInt(8)],
        ],
      ]);
    });

    it("should work on a { [key: string]: string } input", () => {
      expect(unstringifyBigInts({ a: "1", b: "2" })).to.deep.eq({ a: BigInt(1), b: BigInt(2) });
    });

    it("should work on a null input", () => {
      expect(unstringifyBigInts(null)).to.eq(null);
    });

    it("should return the input if it is not a valid value", () => {
      expect(unstringifyBigInts("A")).to.eq("A");
    });
  });

  describe("bigInt2Buffer", () => {
    it("should convert a BigInt to a Buffer", () => {
      const bigInt = BigInt(123456789);
      const buffer = bigInt2Buffer(bigInt);
      expect(buffer).to.be.instanceOf(Buffer);
    });

    it("should produce a Buffer with the correct value", () => {
      const bigInt = BigInt(123456789);
      const buffer = bigInt2Buffer(bigInt);

      let hex = bigInt.toString(16);

      // Ensure even length.
      if (hex.length % 2 !== 0) {
        hex = `0${hex}`;
      }
      const expectedBuffer = Buffer.from(hex, "hex");
      expect(buffer.equals(expectedBuffer)).to.eq(true);
    });

    it("should produce a Buffer with the correct value even if not even length", () => {
      const bigInt = BigInt(15);
      const buffer = bigInt2Buffer(bigInt);

      const expectedBuffer = Buffer.from("0f", "hex");
      expect(buffer.equals(expectedBuffer)).to.eq(true);
    });
  });

  describe("genTreeCommitment", () => {
    const leaves = [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)];
    const salt = BigInt(6);
    const depth = 3;

    it("should generate a commitment to the tree root using the provided salt", () => {
      const commitment = genTreeCommitment(leaves, salt, depth);
      expect(commitment).to.satisfy((num: bigint) => num > 0);
      expect(commitment).to.satisfy((num: bigint) => num < SNARK_FIELD_SIZE);
    });

    it("should always generate the same commitment for the same inputs", () => {
      const commitment = genTreeCommitment(leaves, salt, depth);
      expect(commitment).to.satisfy((num: bigint) => num > 0);
      expect(commitment).to.satisfy((num: bigint) => num < SNARK_FIELD_SIZE);

      const commitment2 = genTreeCommitment(leaves, salt, depth);
      expect(commitment2).to.satisfy((num: bigint) => num > 0);
      expect(commitment2).to.satisfy((num: bigint) => num < SNARK_FIELD_SIZE);
      expect(commitment).to.eq(commitment2);
    });
  });

  describe("fromString", () => {
    it("should convert a string with radix 10 to a bigint", () => {
      expect(fromString("123456789", 10)).to.eq(BigInt(123456789));
    });

    it("should convert a string with radix 16 to a bigint", () => {
      expect(fromString("123456789", 16)).to.eq(BigInt(0x123456789));
    });

    it("should convert a string with radix 16 and starting with 0x to a bigint", () => {
      expect(fromString("0x123456789", 16)).to.eq(BigInt(0x123456789));
    });

    it("should convert a string with radix != 10 && != 16 to a bigint", () => {
      expect(fromString("123456789", 2)).to.eq(BigInt(123456789));
    });
  });

  describe("genTreeProof", () => {
    it("should return the path elements for the given index", () => {
      const leaves = [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)];
      const depth = 3;
      const proof = genTreeProof(2, leaves, depth);
      expect(proof.length).to.be.gt(0);
    });
  });

  describe("fromRprLE", () => {
    it("should correctly parse a buffer with Little Endian Representation", () => {
      const { buffer } = new Uint8Array([1, 2, 3, 4]);
      const view = new DataView(buffer);
      const expected = fromString("04030201", 16).toString();
      expect(fromRprLE(view)).to.eq(expected);
    });

    it("should correctly parse a buffer with Little Endian Representation with offset", () => {
      const { buffer } = new Uint8Array([0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 0, 0]);
      const view = new DataView(buffer);
      const expected = fromString("04030201", 16).toString();
      expect(fromRprLE(view, 4, 4)).to.eq(expected);
    });

    it("should correctly parse a buffer with Little Endian Representation with byte length", () => {
      const { buffer } = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const view = new DataView(buffer);
      const expected = fromString("04030201", 16).toString();
      expect(fromRprLE(view, 0, 4)).to.eq(expected);
    });
  });

  describe("shiftRight", () => {
    it("should shift a bigint to the right by n bits", () => {
      expect(shiftRight(16n, 2n)).to.eq(4n);
    });
  });
});
