/* eslint-disable import/no-extraneous-dependencies */
import { expect } from "chai";
import { BaseContract, Signer } from "ethers";
import { IncrementalQuinTree, AccQueue, calcDepthFromNumLeaves, hash2, hash5 } from "maci-crypto";
import { IVkContractParams, VerifyingKey } from "maci-domainobjs";

import type { EthereumProvider } from "hardhat/types";

import { getDefaultSigner } from "../ts";
import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployMaci,
  deployMockVerifier,
  deployPoseidonContracts,
  deployTopupCredit,
  deployVkRegistry,
  linkPoseidonLibraries,
} from "../ts/deploy";
import { IDeployedTestContracts } from "../ts/types";
import { AccQueue as AccQueueContract, FreeForAllGatekeeper } from "../typechain-types";

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
 * Deploy an AccQueue contract and setup a local TS instance of an AccQueue class
 * @param contractName - the name of the contract to deploy
 * @param SUB_DEPTH - the depth of the subtrees
 * @param HASH_LENGTH - the number of leaves in each subtree
 * @param ZERO - the zero value to be used as leaf
 * @returns the AccQueue class instance and the AccQueue contract
 */
export const deployTestAccQueues = async (
  contractName: string,
  SUB_DEPTH: number,
  HASH_LENGTH: number,
  ZERO: bigint,
): Promise<{ aq: AccQueue; aqContract: BaseContract }> => {
  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(await getDefaultSigner(), {}, true);

  const [poseidonT3ContractAddress, poseidonT4ContractAddress, poseidonT5ContractAddress, poseidonT6ContractAddress] =
    await Promise.all([
      PoseidonT3Contract.getAddress(),
      PoseidonT4Contract.getAddress(),
      PoseidonT5Contract.getAddress(),
      PoseidonT6Contract.getAddress(),
    ]);
  // Link Poseidon contracts
  const AccQueueFactory = await linkPoseidonLibraries(
    contractName,
    poseidonT3ContractAddress,
    poseidonT4ContractAddress,
    poseidonT5ContractAddress,
    poseidonT6ContractAddress,
    await getDefaultSigner(),
    true,
  );

  const aqContract = await AccQueueFactory.deploy(SUB_DEPTH);

  await aqContract.deploymentTransaction()?.wait();

  const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);

  return { aq, aqContract };
};

/**
 * Test whether fill() works for an empty subtree
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 * @param index - the index of the subtree
 */
export const testEmptySubtree = async (aq: AccQueue, aqContract: AccQueueContract, index: number): Promise<void> => {
  aq.fill();
  const tx = await aqContract.fill(fillGasLimit);
  await tx.wait();
  const subRoot = await aqContract.getSubRoot(index);
  expect(subRoot.toString()).to.equal(aq.getSubRoot(index).toString());
};

/**
 * Insert one leaf and compute the subroot
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 */
export const testIncompleteSubtree = async (aq: AccQueue, aqContract: AccQueueContract): Promise<void> => {
  const leaf = BigInt(1);

  aq.enqueue(leaf);
  await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());

  aq.fill();
  await aqContract.fill(fillGasLimit).then((tx) => tx.wait());

  const subRoot = await aqContract.getSubRoot(1);
  expect(subRoot.toString()).to.equal(aq.getSubRoot(1).toString());
};

/**
 * Test whether fill() works for every number of leaves in an incomplete subtree
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 * @param HASH_LENGTH - the number of leaves in each subtree
 */
export const testFillForAllIncompletes = async (
  aq: AccQueue,
  aqContract: AccQueueContract,
  HASH_LENGTH: number,
): Promise<void> => {
  for (let i = 0; i < HASH_LENGTH; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const leaf = BigInt(i + 1);
      aq.enqueue(leaf);
      // eslint-disable-next-line no-await-in-loop
      await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
    }
    aq.fill();
    // eslint-disable-next-line no-await-in-loop
    await aqContract.fill(fillGasLimit).then((tx) => tx.wait());

    // eslint-disable-next-line no-await-in-loop
    const subRoot = await aqContract.getSubRoot(3 + i);
    expect(subRoot.toString()).to.equal(aq.getSubRoot(3 + i).toString());
  }
};

/**
 * Test whether the AccQueue is empty upon deployment
 * @param aqContract - the AccQueue contract
 */
export const testEmptyUponDeployment = async (aqContract: AccQueueContract): Promise<void> => {
  const numLeaves = await aqContract.numLeaves();
  expect(numLeaves.toString()).to.equal("0");

  await expect(aqContract.getSubRoot(0)).to.be.revertedWithCustomError(aqContract, "InvalidIndex");
};

/**
 * Enqueue leaves and check their subroots
 * @param aqContract - the AccQueue contract
 * @param HASH_LENGTH - the number of leaves in each subtree
 * @param SUB_DEPTH - the depth of the subtrees
 * @param ZERO - the zero value to be used as leaf
 */
export const testEnqueue = async (
  aqContract: AccQueueContract,
  HASH_LENGTH: number,
  SUB_DEPTH: number,
  ZERO: bigint,
): Promise<void> => {
  const hashFunc = HASH_LENGTH === 5 ? hash5 : hash2;
  const tree0 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, hashFunc);
  const subtreeCapacity = HASH_LENGTH ** SUB_DEPTH;

  // Insert up to a subtree
  for (let i = 0; i < subtreeCapacity; i += 1) {
    const leaf = BigInt(i + 1);
    tree0.insert(leaf);

    // eslint-disable-next-line no-await-in-loop
    await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
  }

  let numLeaves = await aqContract.numLeaves();
  expect(numLeaves.toString()).to.eq(subtreeCapacity.toString());

  const r = await aqContract.getSubRoot(0);
  expect(r.toString()).to.eq(tree0.root.toString());

  const tree1 = new IncrementalQuinTree(SUB_DEPTH, ZERO, HASH_LENGTH, hashFunc);

  // Insert the other subtree
  for (let i = 0; i < subtreeCapacity; i += 1) {
    const leaf = BigInt(i + 2);
    tree1.insert(leaf);

    // eslint-disable-next-line no-await-in-loop
    await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
  }

  numLeaves = await aqContract.numLeaves();
  expect(numLeaves.toString()).to.eq((subtreeCapacity * 2).toString());

  const subroot1 = await aqContract.getSubRoot(1);
  expect(subroot1.toString()).to.eq(tree1.root.toString());
};

/**
 * Insert subtrees directly
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 * @param NUM_SUBTREES - the number of subtrees to insert
 */
export const testInsertSubTrees = async (
  aq: AccQueue,
  aqContract: AccQueueContract,
  NUM_SUBTREES: number,
  MAIN_DEPTH: number,
): Promise<void> => {
  const leaves: bigint[] = [];
  for (let i = 0; i < NUM_SUBTREES; i += 1) {
    const subTree = new IncrementalQuinTree(aq.getSubDepth(), aq.getZeros()[0], aq.getHashLength(), aq.hashFunc);
    const leaf = BigInt(i);
    subTree.insert(leaf);
    leaves.push(leaf);

    // insert the subtree root
    aq.insertSubTree(subTree.root);
    // eslint-disable-next-line no-await-in-loop
    await aqContract.insertSubTree(subTree.root.toString(), insertSubTreeGasLimit).then((tx) => tx.wait());
  }

  let correctRoot: string;
  if (NUM_SUBTREES === 1) {
    correctRoot = aq.getSubRoots()[0].toString();
  } else {
    const depth = calcDepthFromNumLeaves(aq.getHashLength(), aq.getSubRoots().length);
    const tree = new IncrementalQuinTree(depth, aq.getZeros()[aq.getSubDepth()], aq.getHashLength(), aq.hashFunc);

    aq.getSubRoots().forEach((subRoot) => {
      tree.insert(subRoot);
    });

    correctRoot = tree.root.toString();
  }

  // Check whether mergeSubRoots() works
  aq.mergeSubRoots(0);
  await aqContract.mergeSubRoots(0, { gasLimit: 8000000 }).then((tx) => tx.wait());

  const expectedSmallSRTroot = aq.getSmallSRTroot().toString();

  expect(correctRoot).to.eq(expectedSmallSRTroot);

  const contractSmallSRTroot = await aqContract.getSmallSRTroot();
  expect(expectedSmallSRTroot.toString()).to.eq(contractSmallSRTroot.toString());

  // Check whether merge() works
  aq.merge(MAIN_DEPTH);
  await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 }).then((tx) => tx.wait());

  const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH];
  const contractMainRoot = await aqContract.getMainRoot(MAIN_DEPTH);

  expect(expectedMainRoot.toString()).to.eq(contractMainRoot.toString());
};

/**
 * The order of leaves when using enqueue() and insertSubTree() should be correct.
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 */
export const testEnqueueAndInsertSubTree = async (aq: AccQueue, aqContract: AccQueueContract): Promise<void> => {
  const [z] = aq.getZeros();
  const n = BigInt(1);

  const leaves: bigint[] = [];

  const subTree = new IncrementalQuinTree(aq.getSubDepth(), z, aq.getHashLength(), aq.hashFunc);

  for (let i = 0; i < aq.getHashLength() ** aq.getSubDepth(); i += 1) {
    leaves.push(z);
  }

  leaves.push(n);
  // leaves is now [z, z, z, z..., n]

  const depth = calcDepthFromNumLeaves(aq.getHashLength(), leaves.length);
  const tree = new IncrementalQuinTree(depth, z, aq.getHashLength(), aq.hashFunc);

  leaves.forEach((leaf) => {
    tree.insert(leaf);
  });

  const expectedRoot = tree.root.toString();

  aq.enqueue(n);
  await aqContract.enqueue(n.toString(), enqueueGasLimit).then((tx) => tx.wait());

  aq.insertSubTree(subTree.root);
  await aqContract.insertSubTree(subTree.root.toString(), insertSubTreeGasLimit).then((tx) => tx.wait());

  aq.fill();
  await aqContract.fill(fillGasLimit).then((tx) => tx.wait());

  aq.mergeSubRoots(0);
  await aqContract.mergeSubRoots(0, { gasLimit: 8000000 }).then((tx) => tx.wait());

  expect(expectedRoot).to.eq(aq.getSmallSRTroot().toString());

  const contractSmallSRTroot = await aqContract.getSmallSRTroot();
  expect(expectedRoot).to.eq(contractSmallSRTroot.toString());
};

/**
 * Insert a number of subtrees and merge them all into a main tree
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 */
export const testMerge = async (
  aq: AccQueue,
  aqContract: AccQueueContract,
  NUM_SUBTREES: number,
  MAIN_DEPTH: number,
): Promise<void> => {
  // The raw leaves of the main tree
  const leaves: bigint[] = [];
  for (let i = 0; i < NUM_SUBTREES; i += 1) {
    const leaf = BigInt(i);

    aq.enqueue(leaf);
    aq.fill();
    // eslint-disable-next-line no-await-in-loop
    await aqContract.enqueue(leaf.toString(), enqueueGasLimit).then((tx) => tx.wait());
    // eslint-disable-next-line no-await-in-loop
    await aqContract.fill(fillGasLimit).then((tx) => tx.wait());

    leaves.push(leaf);

    for (let j = 1; j < aq.getHashLength() ** aq.getSubDepth(); j += 1) {
      leaves.push(aq.getZeros()[0]);
    }
  }

  // Insert leaves into a main tree
  const tree = new IncrementalQuinTree(MAIN_DEPTH, aq.getZeros()[0], aq.getHashLength(), aq.hashFunc);

  leaves.forEach((leaf) => {
    tree.insert(leaf);
  });

  // minHeight should be the small SRT height
  const minHeight = await aqContract.calcMinHeight();
  const c = calcDepthFromNumLeaves(aq.getHashLength(), NUM_SUBTREES);
  expect(minHeight.toString()).to.eq(c.toString());

  // Check whether mergeSubRoots() works
  aq.mergeSubRoots(0);
  await (await aqContract.mergeSubRoots(0, { gasLimit: 8000000 })).wait();

  const expectedSmallSRTroot = aq.getSmallSRTroot().toString();
  const contractSmallSRTroot = (await aqContract.getSmallSRTroot()).toString();

  expect(expectedSmallSRTroot).to.eq(contractSmallSRTroot);

  if (NUM_SUBTREES === 1) {
    expect(expectedSmallSRTroot).to.eq(aq.getSubRoots()[0].toString());
  } else {
    // Check whether the small SRT root is correct
    const srtHeight = calcDepthFromNumLeaves(aq.getHashLength(), NUM_SUBTREES);
    const smallTree = new IncrementalQuinTree(
      srtHeight,
      aq.getZeros()[aq.getSubDepth()],
      aq.getHashLength(),
      aq.hashFunc,
    );

    aq.getSubRoots().forEach((subRoot) => {
      smallTree.insert(subRoot);
    });

    expect(expectedSmallSRTroot).to.eq(smallTree.root.toString());
  }

  // Check whether mergeDirect() works
  const aq2 = aq.copy();

  aq2.mergeDirect(MAIN_DEPTH);
  const directlyMergedRoot = aq2.getMainRoots()[MAIN_DEPTH].toString();
  expect(directlyMergedRoot.toString()).to.eq(tree.root.toString());

  // Check whether off-chain merge() works
  aq.merge(MAIN_DEPTH);

  const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH].toString();

  expect(expectedMainRoot).to.eq(directlyMergedRoot);

  // Check whether on-chain merge() works
  await (await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 })).wait();
  const contractMainRoot = (await aqContract.getMainRoot(MAIN_DEPTH)).toString();
  expect(expectedMainRoot).to.eq(contractMainRoot);
};

/**
 * Enqueue, merge, enqueue, and merge again
 * @param aq - the AccQueue class instance
 * @param aqContract - the AccQueue contract
 */
export const testMergeAgain = async (aq: AccQueue, aqContract: AccQueueContract, MAIN_DEPTH: number): Promise<void> => {
  const tree = new IncrementalQuinTree(MAIN_DEPTH, aq.getZeros()[0], aq.getHashLength(), aq.hashFunc);
  const leaf = BigInt(123);

  // Enqueue
  aq.enqueue(leaf);
  await aqContract.enqueue(leaf.toString()).then((tx) => tx.wait());
  tree.insert(leaf);

  // Merge
  aq.mergeDirect(MAIN_DEPTH);
  await aqContract.mergeSubRoots(0, { gasLimit: 8000000 }).then((tx) => tx.wait());
  await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 }).then((tx) => tx.wait());

  for (let i = 1; i < aq.getHashLength() ** aq.getSubDepth(); i += 1) {
    tree.insert(aq.getZeros()[0]);
  }

  const mainRoot = (await aqContract.getMainRoot(MAIN_DEPTH)).toString();
  const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH].toString();
  expect(expectedMainRoot).to.eq(mainRoot);
  expect(expectedMainRoot).to.eq(tree.root.toString());

  const leaf2 = BigInt(456);

  // Enqueue
  aq.enqueue(leaf2);
  await aqContract.enqueue(leaf2.toString()).then((tx) => tx.wait());
  tree.insert(leaf2);

  // Merge
  aq.mergeDirect(MAIN_DEPTH);
  await aqContract.mergeSubRoots(0, { gasLimit: 8000000 }).then((tx) => tx.wait());
  await aqContract.merge(MAIN_DEPTH, { gasLimit: 8000000 }).then((tx) => tx.wait());

  for (let i = 1; i < aq.getHashLength() ** aq.getSubDepth(); i += 1) {
    tree.insert(aq.getZeros()[0]);
  }

  const mainRoot2 = (await aqContract.getMainRoot(MAIN_DEPTH)).toString();
  const expectedMainRoot2 = aq.getMainRoots()[MAIN_DEPTH].toString();
  expect(expectedMainRoot2).to.eq(tree.root.toString());

  expect(expectedMainRoot2).not.to.eq(expectedMainRoot);
  expect(expectedMainRoot2).to.eq(mainRoot2);
};

/**
 * Deploy a set of smart contracts that can be used for testing.
 * @param initialVoiceCreditBalance - the initial voice credit balance for each user
 * @param stateTreeDepth - the depth of the state tree
 * @param signer - the signer to use
 * @param quiet - whether to suppress console output
 * @param gatekeeper - the gatekeeper contract to use
 * @returns the deployed contracts
 */
export const deployTestContracts = async (
  initialVoiceCreditBalance: number,
  stateTreeDepth: number,
  signer?: Signer,
  quiet = false,
  gatekeeper: FreeForAllGatekeeper | undefined = undefined,
): Promise<IDeployedTestContracts> => {
  const mockVerifierContract = await deployMockVerifier(signer, true);

  let gatekeeperContract = gatekeeper;
  if (!gatekeeperContract) {
    gatekeeperContract = await deployFreeForAllSignUpGatekeeper(signer, true);
  }

  const constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
    initialVoiceCreditBalance,
    signer,
    true,
  );

  // VkRegistry
  const vkRegistryContract = await deployVkRegistry(signer, true);
  const topupCreditContract = await deployTopupCredit(signer, true);
  const [gatekeeperContractAddress, constantIntialVoiceCreditProxyContractAddress, topupCreditContractAddress] =
    await Promise.all([
      gatekeeperContract.getAddress(),
      constantIntialVoiceCreditProxyContract.getAddress(),
      topupCreditContract.getAddress(),
    ]);

  const { maciContract, stateAqContract } = await deployMaci({
    signUpTokenGatekeeperContractAddress: gatekeeperContractAddress,
    initialVoiceCreditBalanceAddress: constantIntialVoiceCreditProxyContractAddress,
    topupCreditContractAddress,
    signer,
    stateTreeDepth,
    quiet,
  });

  return {
    mockVerifierContract,
    gatekeeperContract,
    constantIntialVoiceCreditProxyContract,
    maciContract,
    stateAqContract,
    vkRegistryContract,
    topupCreditContract,
  };
};
