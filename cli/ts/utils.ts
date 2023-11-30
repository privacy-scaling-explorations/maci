import fs from "fs";
import prompt from "prompt-async";
import Web3 from "web3";
const { ethers } = require("hardhat");

import { SNARK_FIELD_SIZE } from "maci-crypto";
import { genJsonRpcDeployer } from "maci-contracts";

prompt.colors = false;
prompt.message = "";

const calcBinaryTreeDepthFromMaxLeaves = (maxLeaves: number) => {
  let result = 0;
  while (2 ** result < maxLeaves) {
    result++;
  }
  return result;
};

const calcQuinTreeDepthFromMaxLeaves = (maxLeaves: number) => {
  let result = 0;
  while (5 ** result < maxLeaves) {
    result++;
  }
  return result;
};

const validateEthAddress = (address: string) => {
  return address.match(/^0x[a-fA-F0-9]{40}$/) != null;
};

const promptPwd = async (name: string) => {
  prompt.start();
  const input = await prompt.get([
    {
      name,
      hidden: true,
    },
  ]);

  return input[name];
};

const checkDeployerProviderConnection = async (sk: string, ethProvider: string) => {
  const deployer = genJsonRpcDeployer(sk, ethProvider);
  try {
    await deployer.provider.getBlockNumber();
  } catch {
    return false;
  }

  return true;
};

const validateSaltFormat = (salt: string): boolean => {
  return salt.match(/^0x[a-fA-F0-9]+$/) != null;
};

const validateSaltSize = (salt: string): boolean => {
  return BigInt(salt) < SNARK_FIELD_SIZE;
};

const validateEthSk = (sk: string): boolean => {
  try {
    new ethers.Wallet(sk);
  } catch {
    return false;
  }
  return true;
};

const contractExists = async (provider: any, address: string) => {
  const code = await provider.getCode(address);
  return code.length > 2;
};

const batchTransactionRequests = async (provider: any, requests: Array<any>, fromAddress?: string) => {
  const web3 = new Web3(provider);
  const batch = new web3.BatchRequest();

  const callbacks = Array(requests.length).fill(async (error: any, result: any) => {
    if (error.message) {
      console.error(error.message);
      throw error;
    }

    return result;
  });

  callbacks.forEach((cb, index) => {
    batch.add(
      requests[index].call.request(
        {
          from: fromAddress ? fromAddress : web3.eth.defaultAccount,
        },
        cb,
      ),
    );
  });

  try {
    batch.execute();
    return await Promise.all(callbacks);
  } catch {
    return [];
  }
};

const currentBlockTimestamp = async (provider: any): Promise<number> => {
  const blockNum = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNum);
  return Number(block.timestamp);
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const isPathExist = (paths: Array<string>): [boolean, string] => {
  if (paths === undefined || paths.length === 0) {
    return [false, String()];
  }

  for (const path of paths) {
    if (!fs.existsSync(path)) {
      return [false, path];
    }
  }
  return [true, String()];
};

const compareOnChainValue = (name: string, onChainValue: any, offChainValue: any): boolean => {
  if (onChainValue !== offChainValue) {
    console.error(`Error: ${name} mismatch.`);
    console.error("     onchainValue: " + onChainValue);
    console.error("     offchainValue: " + offChainValue);
    return false;
  }
  return true;
};

export {
  promptPwd,
  calcBinaryTreeDepthFromMaxLeaves,
  calcQuinTreeDepthFromMaxLeaves,
  validateEthSk,
  checkDeployerProviderConnection,
  validateSaltSize,
  validateSaltFormat,
  validateEthAddress,
  contractExists,
  currentBlockTimestamp,
  batchTransactionRequests,
  delay,
  compareOnChainValue,
  isPathExist,
};
