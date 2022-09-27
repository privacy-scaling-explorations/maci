import { artifacts, ethers } from "hardhat";
import { expect } from "chai";
import {
  Factory,
  PoseidonT2,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  PoseidonT7,
} from "../typechain-types";

const deployChildContracts = async (): Promise<{
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}> => {
  const _poseidonT2 = artifacts.readArtifactSync("PoseidonT2");
  const _poseidonT3 = artifacts.readArtifactSync("PoseidonT3");
  const _poseidonT4 = artifacts.readArtifactSync("PoseidonT4");
  const _poseidonT5 = artifacts.readArtifactSync("PoseidonT5");
  const _poseidonT6 = artifacts.readArtifactSync("PoseidonT6");
  const _poseidonT7 = artifacts.readArtifactSync("PoseidonT7");

  const PoseidonT2ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT2
  );
  const PoseidonT3ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT3
  );
  const PoseidonT4ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT4
  );
  const PoseidonT5ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT5
  );
  const PoseidonT6ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT6
  );
  const PoseidonT7ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT7
  );

  const poseidonT2 = await PoseidonT2ContractFactory.deploy();
  const poseidonT3 = await PoseidonT3ContractFactory.deploy();
  const poseidonT4 = await PoseidonT4ContractFactory.deploy();
  const poseidonT5 = await PoseidonT5ContractFactory.deploy();
  const poseidonT6 = await PoseidonT6ContractFactory.deploy();
  const poseidonT7 = await PoseidonT7ContractFactory.deploy();

  return {
    poseidonT2,
    poseidonT3,
    poseidonT4,
    poseidonT5,
    poseidonT6,
    poseidonT7,
  };
};

const deployParentContractFactory = async (childContracts: {
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}): Promise<Factory> => {
  const contractFactory = await ethers.getContractFactory("Factory", {
    libraries: {
      PoseidonT2: childContracts.poseidonT2.address,
      PoseidonT3: childContracts.poseidonT3.address,
      PoseidonT4: childContracts.poseidonT4.address,
      PoseidonT5: childContracts.poseidonT5.address,
      PoseidonT6: childContracts.poseidonT6.address,
      PoseidonT7: childContracts.poseidonT7.address,
    },
  });

  const factoryContract = await contractFactory.deploy();
  return factoryContract;
};

const deployParentContract = async (childContracts: {
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}) => {
  const factoryContract = await deployParentContractFactory(childContracts);
  const salt =
    "0x0000000000000000000000000000000000000000000000000000000000000001";
  await factoryContract.deploy(salt);

  const hasherAddress = await factoryContract.getAddress();
  const hasherContract = await ethers.getContractAt("Hasher", hasherAddress);
  return { hasherContract, factoryContract };
};

const deploy = async () => {
  const childContracts = await deployChildContracts();
  const { hasherContract, factoryContract } = await deployParentContract(
    childContracts
  );

  try {
    expect(await hasherContract.hash2(["1", "2"])).to.equal(
      ethers.BigNumber.from(
        "0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a"
      )
    );

    expect(await hasherContract.hash4(["1", "2", "3", "4"])).to.equal(
      ethers.BigNumber.from(
        "0x299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465"
      )
    );

    const signers = await ethers.getSigners();
    console.log("sender address: " + signers[0].address);
    console.log("factory contract address: " + factoryContract.address);
    console.log("poseidon main contract address: " + hasherContract.address);
    console.log();
    console.log("PoseidonT2: " + childContracts.poseidonT2.address);
    console.log("PoseidonT3: " + childContracts.poseidonT3.address);
    console.log("PoseidonT4: " + childContracts.poseidonT4.address);
    console.log("PoseidonT5: " + childContracts.poseidonT5.address);
    console.log("PoseidonT6: " + childContracts.poseidonT6.address);
    console.log("PoseidonT7: " + childContracts.poseidonT7.address);
  } catch (e) {
    console.error("[ERROR] poseidon didn't deployed properly: " + e);
  }
};

deploy();

export { deployChildContracts, deployParentContract };
