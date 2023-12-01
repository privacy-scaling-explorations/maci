declare module "blake-hash" {
  export interface BlakeHash {
    update: (buffer: Buffer) => BlakeHash;
    digest: () => Buffer;
  }

  export function createBlakeHash(type: "blake512"): BlakeHash;

  export default createBlakeHash;
}
