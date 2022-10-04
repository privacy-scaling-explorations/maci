import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai"
import { before } from 'mocha';
import { ethers } from "hardhat"
import {
    Factory,
    VkRegistry
} from '../typechain-types'

const salt = "0x0000000000000000000000000000000000000000000000000000000000000001"
let signer: SignerWithAddress
let signerAddress: string
let vkRegistry: VkRegistry
let vkRegistryAddress: string
let factoryContract: Factory

const deploy = async () => {
    signer = (await ethers.getSigners())[0]
    signerAddress = await signer.getAddress()
    const factory = await ethers.getContractFactory("Factory")
    const factoryContract = await factory.deploy()
    return factoryContract
}
 
describe("VkRegistry", function () {
    before(async () => {
        factoryContract = await loadFixture(deploy)
    })

    describe("Deploy", async () => {
        it("should deploy the VkRegistry", async () => {
            await factoryContract.connect(signer).deploy(salt, signerAddress)
            const deployedAddress = await factoryContract.vkRegistryAddress()
            expect(deployedAddress).to.not.eq(ethers.constants.AddressZero)
            vkRegistryAddress = deployedAddress
        })

        it("vkRegistry should have the owner set as the deployer", async () => {
            vkRegistry = await ethers.getContractAt("VkRegistry", vkRegistryAddress)
            const owner = await vkRegistry.owner()
            expect(owner).to.eq(signerAddress)
        })

        it("vkRegistry should work", async () => {
            vkRegistry = await ethers.getContractAt("VkRegistry", vkRegistryAddress)
            expect(await vkRegistry.isProcessVkSet(5)).to.be.false
        })

        it("deploys at the same address even if there is a transaction in between deployments", async () => {
            factoryContract = await loadFixture(deploy)
            
            const nonceBefore = await signer.getTransactionCount("latest")
            await signer.sendTransaction({
                to: ethers.constants.AddressZero,
                value: ethers.utils.parseEther('1')
            })
            const nonceAfter = await signer.getTransactionCount("latest")
            // confirm that the nonce increased
            expect(nonceBefore + 1).to.eq(nonceAfter)

            await factoryContract.connect(signer).deploy(salt, signerAddress)
            const deployedAddress = await factoryContract.vkRegistryAddress()
            expect(deployedAddress).to.eq(vkRegistryAddress)
        })
    })
})