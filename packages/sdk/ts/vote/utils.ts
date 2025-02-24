import { Poll__factory as PollFactory } from "maci-contracts";
import { SNARK_FIELD_SIZE } from "maci-crypto";
import { PubKey } from "maci-domainobjs";

import type { Signer } from "ethers";

/**
 * Run both format check and size check on a salt value
 * @param salt the salt to validate
 * @returns whether it is valid or not
 */
export const validateSalt = (salt: bigint): boolean => salt < SNARK_FIELD_SIZE;

/**
 * Get the coordinator public key for a poll
 * @param pollAddress - the address of the poll
 * @param signer - the signer to use
 * @returns the coordinator public key
 */
export const getCoordinatorPubKey = async (pollAddress: string, signer: Signer): Promise<PubKey> => {
  const pollContract = PollFactory.connect(pollAddress, signer);

  const coordinatorPubKey = await pollContract.coordinatorPubKey();

  return new PubKey([coordinatorPubKey.x, coordinatorPubKey.y]);
};
