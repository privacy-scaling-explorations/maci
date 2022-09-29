import { ethers } from "hardhat";

const salt = "0x0000000000000000000000000000000000000000000000000000000000000001";

const deployVkRegistry = async () => {
    const _factoryContract = await ethers.getContractFactory("Factory");
    const factoryContract = await _factoryContract.deploy();
    
    await factoryContract.deploy(salt);
    const VkRegistryAddress = await factoryContract.vkRegistryAddress();
    
    
    const signers = await ethers.getSigners();
    console.log("vkRegistry contract address: " + VkRegistryAddress);
    console.log()
    console.log("sender address: " + signers[0].address);
    console.log("factory contract address: " + factoryContract.address);
    
}

deployVkRegistry();