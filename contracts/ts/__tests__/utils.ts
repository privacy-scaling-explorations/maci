import { SNARK_FIELD_SIZE } from "maci-crypto"

export async function timeTravel(provider, seconds) {
    await provider.send('evm_increaseTime', [Number(seconds)])
    await provider.send('evm_mine', [])
}

export const validateSaltFormat = (salt: string): boolean => {
    return salt.match(/^0x[a-fA-F0-9]+$/) != null
}

export const validateSaltSize = (salt: string): boolean => {
    return BigInt(salt) < SNARK_FIELD_SIZE
}