import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

const str2BigInt = (s: string): BigInt => {
    return BigInt(parseInt(
        Buffer.from(s).toString('hex'), 16
    ))
}

export {
    str2BigInt,
    genWitness,
    getSignalByName,
}
