declare module '@maci-protocol/crypto' {
  export class Keypair {
    static genEcdhSharedKey(privKey: bigint, pubKey: bigint): bigint;
  }

  export class PCommand {
    static decrypt(message: any, sharedKey: bigint): { command: any; signature: any };
  }

  export function hash5(inputs: bigint[]): bigint;
} 