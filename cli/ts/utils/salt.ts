import { SNARK_FIELD_SIZE } from "maci-crypto"

const validateSaltFormat = (salt: string): boolean => {
    return salt.match(/^0x[a-fA-F0-9]+$/) != null
}

const validateSaltSize = (salt: string): boolean => {
    return BigInt(salt) < SNARK_FIELD_SIZE
}

export const validateSalt = (salt: string): boolean => {
    return validateSaltFormat(salt) && validateSaltSize(salt)
}