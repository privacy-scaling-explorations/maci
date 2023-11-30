declare module "circomlib" {
  interface Signature {
    R8: bigint[];
    S: bigint;
  }

  export function poseidon(inputs: bigint[]): bigint;

  export function poseidonEncrypt(plaintext: bigint[], sharedKey: bigint[], nonce?: bigint): bigint[];

  export function poseidonDecrypt(ciphertext: bigint[], sharedKey: bigint[], nonce: bigint, length: number): bigint[];

  export namespace eddsa {
    function signPoseidon(buffer: Buffer, message: bigint): Signature;

    function verifyPoseidon(message: bigint, signature: Signature, pubKey: bigint[]): boolean;

    function pruneBuffer(buffer: Buffer): Buffer;

    function prv2pub(buffer: Buffer): bigint[];
  }

  export namespace babyJub {
    type F = unknown;

    const p: string | bigint | number;

    const Base8: bigint[];

    function addPoint(a: bigint, b: bigint): bigint;

    function packPoint(pubKey: bigint[]): Buffer;

    function unpackPoint(packed: Buffer): bigint[];

    function mulPointEscalar(a: bigint | bigint[], b: bigint | bigint[]): bigint[];
  }
}
