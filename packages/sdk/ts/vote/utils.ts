import { Poll__factory as PollFactory } from "@maci-protocol/contracts/typechain-types";
import { SNARK_FIELD_SIZE } from "@maci-protocol/crypto";
import { PublicKey } from "@maci-protocol/domainobjs";

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
export const getCoordinatorPublicKey = async (pollAddress: string, signer: Signer): Promise<PublicKey> => {
  const pollContract = PollFactory.connect(pollAddress, signer);

  const coordinatorPublicKey = await pollContract.coordinatorPublicKey();

  return new PublicKey([coordinatorPublicKey.x, coordinatorPublicKey.y]);
};
