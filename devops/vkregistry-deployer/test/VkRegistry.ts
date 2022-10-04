import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai"
import { ethers } from "hardhat"
import {
    Factory,
    VkRegistry
} from '../typechain-types'


const salt = "0x0000000000000000000000000000000000000000000000000000000000000001"

describe("VkRegistry", () => {
    let factoryContract: Factory
    let signer: SignerWithAddress
    let signerAddress: string
    let vkRegistry: VkRegistry

    beforeEach(async () => {
        signer = (await ethers.getSigners())[0]
        signerAddress = await signer.getAddress()
        const factory = await ethers.getContractFactory("Factory")
        factoryContract = await factory.deploy()
    })

    describe("Deploy", async () => {
        it("should deploy the VkRegistry", async () => {
            await factoryContract.deploy(salt, signerAddress)
            const deployedAddress = await factoryContract.vkRegistryAddress()
            expect(deployedAddress).to.not.eq(ethers.constants.AddressZero)
        })

        it("vkRegistry should have the owner set as the deployer", async () => {
            await factoryContract.deploy(salt, signerAddress)
            const deployedAddress = await factoryContract.vkRegistryAddress()
            expect(deployedAddress).to.not.eq(ethers.constants.AddressZero)
            vkRegistry = await ethers.getContractAt("VkRegistry", deployedAddress)
            const owner = await vkRegistry.owner()
            expect(owner).to.eq(await signer.getAddress())
        })

        it("vkRegistry should work", async () => {
            await factoryContract.deploy(salt, signerAddress);
            const deployedAddress = await factoryContract.vkRegistryAddress()
            expect(deployedAddress).to.not.eq(ethers.constants.AddressZero)
            vkRegistry = await ethers.getContractAt("VkRegistry", deployedAddress)
            expect(await vkRegistry.isProcessVkSet(5)).to.be.false
        })
    })
})