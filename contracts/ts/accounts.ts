//import * as ethers from 'ethers'
import { config } from 'maci-config'
const { ethers } = require('hardhat')

const privateKeys = config.get('chain.privateKeysPath')
const mnemonic = config.chain.testMnemonic

const genAccounts = () => {
    const keys = require(privateKeys)
    return keys.map((pk: string) => {
        return new ethers.Wallet(pk)
    })
}

const genTestAccounts = (
    numAccounts: number,
) => {
    const accounts: any[] = []
    debugger
    const signer = new ethers.Wallet('0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3')

    for (let i=0; i < numAccounts; i++) {
        const path = `m/44'/60'/${i}'/0/0`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
        accounts.push(wallet)
    }

    return accounts
}

export { genAccounts, genTestAccounts }

