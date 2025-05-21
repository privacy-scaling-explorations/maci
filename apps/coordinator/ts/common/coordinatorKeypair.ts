import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";

/**
 * Instantiate the MACI Coordinator keypair.
 * @returns {Keypair} - The MACI Coordinator keypair.
 */
export const getCoordinatorKeypair = (): Keypair => {
  const privateKey = String(process.env.COORDINATOR_MACI_PRIVATE_KEY);

  if (!privateKey) {
    throw new Error("COORDINATOR_MACI_PRIVATE_KEY environment variable is not set.");
  }

  const maciPrivateKey = PrivateKey.deserialize(privateKey);

  return new Keypair(maciPrivateKey);
};
