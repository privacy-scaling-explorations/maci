import * as fs from 'fs'
import {readJSONFile, writeJSONFile} from 'maci-common'
import {contractFilepath, contractFilepathOld} from './config'

import {
    deployTopupCredit as deployTopupCreditContract,
} from 'maci-contracts'

const configureSubparser = (subparsers: any) => {
    subparsers.addParser(
        'deployTopupCredit',
        { addHelp: true },
    )
}

// we assume deployVkRegister is the start of a new set of MACI contracts
const deployTopupCredit = async () => {
    let contractAddrs = readJSONFile(contractFilepath)
    const TopupCreditContract = await deployTopupCreditContract()
    console.log('TopupCredit:', TopupCreditContract.address)
    if (fs.existsSync(contractFilepath)) {
      fs.renameSync(contractFilepath, contractFilepathOld)
    }
    contractAddrs['TopupCredit'] = TopupCreditContract.address
    writeJSONFile(contractFilepath, contractAddrs)
    return 0
}

export {
    deployTopupCredit,
    configureSubparser,
}
