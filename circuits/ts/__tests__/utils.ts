import {
    SnarkBigInt,
    bigInt,
} from 'maci-crypto'

const str2BigInt = (s: string): SnarkBigInt => {
    return bigInt(parseInt(
        Buffer.from(s).toString('hex'), 16
    ))
}

export {
    str2BigInt,
}
