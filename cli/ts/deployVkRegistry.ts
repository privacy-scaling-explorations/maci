// @ts-ignore
//const { ethers } = require('hardhat')

import {
    deployVkRegistry as deployVkRegistryContract,
} from 'maci-contracts'

const configureSubparser = (subparsers: any) => {
    subparsers.addParser(
        'deployVkRegistry',
        { addHelp: true },
    )
}

const deployVkRegistry = async (args: any) => {
    const vkRegistryContract = await deployVkRegistryContract()

    console.log('VkRegistry:', vkRegistryContract.address)
    return 0
}

export {
    deployVkRegistry,
    configureSubparser,
}
