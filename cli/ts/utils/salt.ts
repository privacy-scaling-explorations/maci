import { SNARK_FIELD_SIZE } from "maci-crypto";

/**
 * Run both format check and size check on a salt value
 * @param salt the salt to validate
 * @returns whether it is valid or not
 */
export const validateSalt = (salt: string): boolean => BigInt(salt) < SNARK_FIELD_SIZE;
