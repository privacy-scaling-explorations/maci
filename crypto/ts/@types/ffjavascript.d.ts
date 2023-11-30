declare module "ffjavascript" {
  export namespace Scalar {
    function shr(value: bigint, shift: number): bigint[];
  }

  export namespace utils {
    function leBuff2int(buffer: Buffer): bigint;

    function stringifyBigInts(bits: unknown): unknown;

    function unstringifyBigInts(bits: unknown): unknown;
  }
}
