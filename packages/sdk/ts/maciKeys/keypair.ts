import { Keypair, PrivKey } from "@maci-protocol/domainobjs";

import type { IGenerateKeypairArgs, IGenerateKeypairData } from "./types";

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 * @param {IGenerateKeypairArgs} args keypair generation params
 * @returns {IGenerateKeypairData} keypair
 */
export const generateKeypair = ({ seed }: IGenerateKeypairArgs = {}): IGenerateKeypairData => {
  // create the new random keypair if there is no seed value
  const keypair = new Keypair(seed ? new PrivKey(seed) : undefined);

  return {
    publicKey: keypair.pubKey.serialize(),
    privateKey: keypair.privKey.serialize(),
  };
};
