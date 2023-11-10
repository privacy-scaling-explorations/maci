import { SNARK_FIELD_SIZE } from "maci-crypto"

/**
 * Validate the format of a salt value
 * @param salt the salt to validate
 * @returns whether it is valid or not
 */
const validateSaltFormat = (salt: string): boolean => {
    return salt.match(/^0x[a-fA-F0-9]+$/) != null
}

/**
 * Validate a salt's size
 * @param salt the salt to validate
 * @returns whether it is valid or not
 */
const validateSaltSize = (salt: string): boolean => {
    return BigInt(salt) < SNARK_FIELD_SIZE
}

/**
 * Run both format check and size check on a salt value
 * @param salt the salt to validate
 * @returns whether it is valid or not
 */
export const validateSalt = (salt: string): boolean => {
    return validateSaltFormat(salt) && validateSaltSize(salt)
}