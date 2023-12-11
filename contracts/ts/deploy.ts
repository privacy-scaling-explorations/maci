import { type Contract, type ContractFactory, BaseContract, Signer } from "ethers";
// eslint-disable-next-line
// @ts-ignore typedoc doesn't want to get types from toolbox
import { ethers } from "hardhat";

import {
  AccQueueQuinaryMaci,
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  MACI,
  MessageProcessor,
  MockVerifier,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  SignUpToken,
  SignUpTokenGatekeeper,
  Subsidy,
  Tally,
  TopupCredit,
  Verifier,
  VkRegistry,
} from "../typechain-types";

import { parseArtifact } from "./abi";
import { IDeployedMaci, IDeployedPoseidonContracts } from "./types";
import { getDefaultSigner, getFeeData, log } from "./utils";

/**
 * Link Poseidon libraries to a Smart Contract
 * @param solFileToLink - the name of the contract to link the libraries to
 * @param poseidonT3Address - the address of the PoseidonT3 contract
 * @param poseidonT4Address - the address of the PoseidonT4 contract
 * @param poseidonT5Address - the address of the PoseidonT5 contract
 * @param poseidonT6Address - the address of the PoseidonT6 contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns a contract factory with the libraries linked
 */
export const linkPoseidonLibraries = async (
  solFileToLink: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  signer?: Signer,
  quiet = false,
): Promise<ContractFactory> => {
  log(`Linking Poseidon libraries to ${solFileToLink}`, quiet);
  const contractFactory = await ethers.getContractFactory(solFileToLink, {
    signer: signer || (await getDefaultSigner()),
    libraries: {
      PoseidonT3: poseidonT3Address,
      PoseidonT4: poseidonT4Address,
      PoseidonT5: poseidonT5Address,
      PoseidonT6: poseidonT6Address,
    },
  });

  return contractFactory;
};

/**
 * Deploy a Smart Contract given a name and some arguments
 * @param contractName - the name of the contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @param args - the constructor arguments of the contract
 */
export const deployContract = async <T extends BaseContract>(
  contractName: string,
  signer?: Signer,
  quiet = false,
  ...args: unknown[]
): Promise<T> => {
  log(`Deploying ${contractName}`, quiet);
  const contractFactory = await ethers.getContractFactory(contractName, signer || (await getDefaultSigner()));
  const contract = await contractFactory.deploy(...args, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });
  await contract.deploymentTransaction()!.wait();

  return contract as unknown as T;
};

/**
 * Deploy a TopupCredit contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed TopupCredit contract
 */
export const deployTopupCredit = async (signer?: Signer, quiet = false): Promise<TopupCredit> =>
  deployContract<TopupCredit>("TopupCredit", signer, quiet);

/**
 * Deploy a VkRegistry contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed VkRegistry contract
 */
export const deployVkRegistry = async (signer?: Signer, quiet = false): Promise<VkRegistry> =>
  deployContract<VkRegistry>("VkRegistry", signer, quiet);

/**
 * Deploy a MockVerifier contract (testing only)
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed MockVerifier contract
 */
export const deployMockVerifier = async (signer?: Signer, quiet = false): Promise<MockVerifier> =>
  deployContract<MockVerifier>("MockVerifier", signer, quiet);

/**
 * Deploy a Verifier contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Verifier contract
 */
export const deployVerifier = async (signer?: Signer, quiet = false): Promise<Verifier> =>
  deployContract<Verifier>("Verifier", signer, quiet);

/**
 * Deploy a constant initial voice credit proxy contract
 * @param signer - the signer to use to deploy the contract
 * @param amount - the amount of initial voice credit to give to each user
 * @param quiet - whether to suppress console output
 * @returns the deployed ConstantInitialVoiceCreditProxy contract
 */
export const deployConstantInitialVoiceCreditProxy = async (
  amount: number,
  signer?: Signer,
  quiet = false,
): Promise<ConstantInitialVoiceCreditProxy> =>
  deployContract<ConstantInitialVoiceCreditProxy>("ConstantInitialVoiceCreditProxy", signer, quiet, amount.toString());

/**
 * Deploy a SignUpToken contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed SignUpToken contract
 */
export const deploySignupToken = async (signer?: Signer, quiet = false): Promise<SignUpToken> =>
  deployContract<SignUpToken>("SignUpToken", signer, quiet);

/**
 * Deploy a SignUpTokenGatekeeper contract
 * @param signUpTokenAddress - the address of the SignUpToken contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns a SignUpTokenGatekeeper contract
 */
export const deploySignupTokenGatekeeper = async (
  signUpTokenAddress: string,
  signer?: Signer,
  quiet = false,
): Promise<SignUpTokenGatekeeper> =>
  deployContract<SignUpTokenGatekeeper>("SignUpTokenGatekeeper", signer, quiet, signUpTokenAddress);

/**
 * Deploy a FreeForAllGatekeeper contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed FreeForAllGatekeeper contract
 */
export const deployFreeForAllSignUpGatekeeper = async (signer?: Signer, quiet = false): Promise<FreeForAllGatekeeper> =>
  deployContract<FreeForAllGatekeeper>("FreeForAllGatekeeper", signer, quiet);

/**
 * Deploy Poseidon contracts
 * @param signer - the signer to use to deploy the contracts
 * @param quiet - whether to suppress console output
 * @returns the deployed Poseidon contracts
 */
export const deployPoseidonContracts = async (signer?: Signer, quiet = false): Promise<IDeployedPoseidonContracts> => {
  const PoseidonT3Contract = await deployContract<PoseidonT3>("PoseidonT3", signer, quiet);
  const PoseidonT4Contract = await deployContract<PoseidonT4>("PoseidonT4", signer, quiet);
  const PoseidonT5Contract = await deployContract<PoseidonT5>("PoseidonT5", signer, quiet);
  const PoseidonT6Contract = await deployContract<PoseidonT6>("PoseidonT6", signer, quiet);

  return {
    PoseidonT3Contract,
    PoseidonT4Contract,
    PoseidonT5Contract,
    PoseidonT6Contract,
  };
};

/**
 * Deploy a PollFactory contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed PollFactory contract
 */
export const deployPollFactory = async (signer?: Signer, quiet = false): Promise<Contract> =>
  deployContract("PollFactory", signer, quiet);

/**
 * Deploy a contract with linked libraries
 * @param contractFactory - the contract factory to use
 * @param name - the name of the contract
 * @param quiet - whether to suppress console output
 * @param args - the constructor arguments of the contract
 * @returns the deployed contract instance
 */
export const deployContractWithLinkedLibraries = async <T extends BaseContract>(
  contractFactory: ContractFactory,
  name: string,
  quiet = false,
  ...args: unknown[]
): Promise<T> => {
  log(`Deploying ${name}`, quiet);
  const contract = await contractFactory.deploy(...args, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });
  await contract.deploymentTransaction()!.wait();

  return contract as T;
};

/**
 * Deploy a MessageProcessor contract
 * @param verifierAddress - the address of the Verifier contract
 * @param poseidonT3Address - the address of the PoseidonT3 contract
 * @param poseidonT4Address - the address of the PoseidonT4 contract
 * @param poseidonT5Address - the address of the PoseidonT5 contract
 * @param poseidonT6Address - the address of the PoseidonT6 contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed MessageProcessor contract
 */
export const deployMessageProcessor = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  signer?: Signer,
  quiet = false,
): Promise<MessageProcessor> => {
  // Link Poseidon contracts to MessageProcessor
  const mpFactory = await linkPoseidonLibraries(
    "MessageProcessor",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    signer,
    quiet,
  );

  return deployContractWithLinkedLibraries<MessageProcessor>(
    mpFactory,
    "MessageProcessor",
    quiet,
    verifierAddress,
    vkRegistryAddress,
  );
};

/**
 * Deploy a Tally contract
 * @param verifierAddress - the address of the Verifier contract
 * @param poseidonT3Address - the address of the PoseidonT3 contract
 * @param poseidonT4Address - the address of the PoseidonT4 contract
 * @param poseidonT5Address - the address of the PoseidonT5 contract
 * @param poseidonT6Address - the address of the PoseidonT6 contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Tally contract
 */
export const deployTally = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  signer?: Signer,
  quiet = false,
): Promise<Tally> => {
  // Link Poseidon contracts to Tally
  const tallyFactory = await linkPoseidonLibraries(
    "Tally",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    signer,
    quiet,
  );

  return deployContractWithLinkedLibraries<Tally>(tallyFactory, "Tally", quiet, verifierAddress, vkRegistryAddress);
};

/**
 * Depoloy a Subsidy contract
 * @param verifierAddress - the address of the Verifier contract
 * @param poseidonT3Address - the address of the PoseidonT3 contract
 * @param poseidonT4Address - the address of the PoseidonT4 contract
 * @param poseidonT5Address - the address of the PoseidonT5 contract
 * @param poseidonT6Address - the address of the PoseidonT6 contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Subsidy contract
 */
export const deploySubsidy = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  signer?: Signer,
  quiet = false,
): Promise<Subsidy> => {
  // Link Poseidon contracts to Subsidy
  const subsidyFactory = await linkPoseidonLibraries(
    "Subsidy",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    signer,
    quiet,
  );

  return deployContractWithLinkedLibraries<Subsidy>(
    subsidyFactory,
    "Subsidy",
    quiet,
    verifierAddress,
    vkRegistryAddress,
  );
};

/**
 * Deploy a MACI contract
 * @param signUpTokenGatekeeperContractAddress - the address of the SignUpTokenGatekeeper contract
 * @param initialVoiceCreditBalanceAddress - the address of the ConstantInitialVoiceCreditProxy contract
 * @param verifierContractAddress - the address of the Verifier contract
 * @param vkRegistryContractAddress - the address of the VkRegistry contract
 * @param topupCreditContractAddress - the address of the TopupCredit contract
 * @param stateTreeDepth - the depth of the state tree
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed MACI contract
 */
export const deployMaci = async (
  signUpTokenGatekeeperContractAddress: string,
  initialVoiceCreditBalanceAddress: string,
  verifierContractAddress: string,
  topupCreditContractAddress: string,
  signer?: Signer,
  stateTreeDepth = 10,
  quiet = false,
): Promise<IDeployedMaci> => {
  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(signer, quiet);

  const poseidonAddrs = await Promise.all([
    PoseidonT3Contract.getAddress(),
    PoseidonT4Contract.getAddress(),
    PoseidonT5Contract.getAddress(),
    PoseidonT6Contract.getAddress(),
  ]);

  const contractsToLink = ["MACI", "PollFactory"];

  // Link Poseidon contracts to MACI
  const linkedContractFactories = await Promise.all(
    contractsToLink.map(async (contractName: string) =>
      linkPoseidonLibraries(
        contractName,
        poseidonAddrs[0],
        poseidonAddrs[1],
        poseidonAddrs[2],
        poseidonAddrs[3],
        signer,
        quiet,
      ),
    ),
  );

  const [maciContractFactory, pollFactoryContractFactory] = await Promise.all(linkedContractFactories);

  const pollFactoryContract = await deployContractWithLinkedLibraries<PollFactory>(
    pollFactoryContractFactory,
    "PollFactory",
    quiet,
  );

  const maciContract = await deployContractWithLinkedLibraries<MACI>(
    maciContractFactory,
    "MACI",
    quiet,
    await pollFactoryContract.getAddress(),
    signUpTokenGatekeeperContractAddress,
    initialVoiceCreditBalanceAddress,
    topupCreditContractAddress,
    stateTreeDepth,
  );

  const [AccQueueQuinaryMaciAbi] = parseArtifact("AccQueue");
  const stateAqContractAddress = await maciContract.stateAq();
  const stateAqContract = new BaseContract(
    stateAqContractAddress,
    AccQueueQuinaryMaciAbi,
    await getDefaultSigner(),
  ) as AccQueueQuinaryMaci;

  log(`Verifier contract address: ${verifierContractAddress}`, quiet);

  return {
    maciContract,
    stateAqContract,
    pollFactoryContract,
    poseidonAddrs,
  };
};
