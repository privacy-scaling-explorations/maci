import * as ethers from 'ethers'
import { config } from 'maci-config'

const privateKeys = config.get('chain.privateKeysPath')
const mnemonic = config.chain.testMnemonic

const genAccounts = () => {
    const keys = require(privateKeys)
    debugger
    return keys.map((pk: string) => {
        return new ethers.Wallet(pk)
    })
}

const genTestAccounts = (
    numAccounts: number,
) => {
    const accounts: ethers.Wallet[] = []

    for (let i=0; i<numAccounts; i++) {
        const path = `m/44'/60'/${i}'/0/0`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
        accounts.push(wallet)
    }

    return accounts
}

export { genAccounts, genTestAccounts }

