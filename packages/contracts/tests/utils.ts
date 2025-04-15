/* eslint-disable import/no-extraneous-dependencies */
import { IVkContractParams, VerifyingKey } from "@maci-protocol/domainobjs";
import { expect } from "chai";

import type { IDeployedTestContracts, IDeployedTestContractsArgs } from "../ts/types";
import type { EthereumProvider } from "hardhat/types";

import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpPolicy,
  deployMaci,
  deployMockVerifier,
  deployVkRegistry,
} from "../ts/deploy";

export const insertSubTreeGasLimit = { gasLimit: 300000 };
export const enqueueGasLimit = { gasLimit: 500000 };
export const fillGasLimit = { gasLimit: 4000000 };

/**
 * Travel in time in a local blockchain node
 * @param provider the provider to use
 * @param seconds the number of seconds to travel for
 */
export async function timeTravel(provider: EthereumProvider, seconds: number): Promise<void> {
  await provider.send("evm_increaseTime", [Number(seconds)]);
  await provider.send("evm_mine", []);
}

/**
 * Compare two verifying keys
 * @param vk - the off chain vk
 * @param vkOnChain - the on chain vk
 */
export const compareVks = (vk: VerifyingKey, vkOnChain: IVkContractParams): void => {
  expect(vk.ic.length).to.eq(vkOnChain.ic.length);
  for (let i = 0; i < vk.ic.length; i += 1) {
    expect(vk.ic[i].x.toString()).to.eq(vkOnChain.ic[i].x.toString());
    expect(vk.ic[i].y.toString()).to.eq(vkOnChain.ic[i].y.toString());
  }
  expect(vk.alpha1.x.toString()).to.eq(vkOnChain.alpha1.x.toString());
  expect(vk.alpha1.y.toString()).to.eq(vkOnChain.alpha1.y.toString());
  expect(vk.beta2.x[0].toString()).to.eq(vkOnChain.beta2.x[0].toString());
  expect(vk.beta2.x[1].toString()).to.eq(vkOnChain.beta2.x[1].toString());
  expect(vk.beta2.y[0].toString()).to.eq(vkOnChain.beta2.y[0].toString());
  expect(vk.beta2.y[1].toString()).to.eq(vkOnChain.beta2.y[1].toString());
  expect(vk.delta2.x[0].toString()).to.eq(vkOnChain.delta2.x[0].toString());
  expect(vk.delta2.x[1].toString()).to.eq(vkOnChain.delta2.x[1].toString());
  expect(vk.delta2.y[0].toString()).to.eq(vkOnChain.delta2.y[0].toString());
  expect(vk.delta2.y[1].toString()).to.eq(vkOnChain.delta2.y[1].toString());
  expect(vk.gamma2.x[0].toString()).to.eq(vkOnChain.gamma2.x[0].toString());
  expect(vk.gamma2.x[1].toString()).to.eq(vkOnChain.gamma2.x[1].toString());
  expect(vk.gamma2.y[0].toString()).to.eq(vkOnChain.gamma2.y[0].toString());
  expect(vk.gamma2.y[1].toString()).to.eq(vkOnChain.gamma2.y[1].toString());
};

/**
 * Deploy a set of smart contracts that can be used for testing.
 * @param initialVoiceCreditBalance - the initial voice credit balance for each user
 * @param stateTreeDepth - the depth of the state tree
 * @param signer - the signer to use
 * @param quiet - whether to suppress console output
 * @param policy - the policy contract to use
 * @returns the deployed contracts
 */
export const deployTestContracts = async ({
  initialVoiceCreditBalance,
  stateTreeDepth,
  signer,
  quiet = true,
  factories,
  policy,
}: IDeployedTestContractsArgs): Promise<IDeployedTestContracts> => {
  const mockVerifierContract = await deployMockVerifier(signer, true);

  let policyContract = policy;

  if (!policyContract) {
    [policyContract] = await deployFreeForAllSignUpPolicy({}, signer, true);
  }

  const [constantInitialVoiceCreditProxyContract] = await deployConstantInitialVoiceCreditProxy(
    { amount: initialVoiceCreditBalance },
    signer,
    undefined,
    true,
  );

  // VkRegistry
  const vkRegistryContract = await deployVkRegistry(signer, true);
  const [policyContractAddress] = await Promise.all([policyContract.getAddress()]);

  const { maciContract } = await deployMaci({
    policyContractAddress,
    signer,
    stateTreeDepth,
    factories,
    quiet,
  });

  return {
    mockVerifierContract,
    policyContract,
    constantInitialVoiceCreditProxyContract,
    maciContract,
    vkRegistryContract,
  };
};
