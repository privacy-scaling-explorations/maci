import { type ContractFactory, type Signer, BaseContract } from "ethers";

import type { IDeployMaciArgs, IDeployedMaci, IDeployedPoseidonContracts } from "./types";

import { Deployment } from "../tasks/helpers/Deployment";
import { EContracts } from "../tasks/helpers/types";
import {
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  PoseidonT3__factory as PoseidonT3Factory,
  PoseidonT4__factory as PoseidonT4Factory,
  PoseidonT5__factory as PoseidonT5Factory,
  PoseidonT6__factory as PoseidonT6Factory,
  MACI,
  MockVerifier,
  PollFactory,
  MessageProcessorFactory,
  TallyFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  SignUpToken,
  SignUpTokenGatekeeper,
  TopupCredit,
  Verifier,
  VkRegistry,
  AccQueueQuinaryMaci__factory as AccQueueQuinaryMaciFactory,
} from "../typechain-types";

import { getDefaultSigner, log } from "./utils";

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
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance(hre);
  deployment.setHre(hre);
  const deployer = signer || (await deployment.getDeployer());

  return deployment.linkPoseidonLibraries(
    solFileToLink as EContracts,
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    deployer,
  );
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
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance(hre);
  deployment.setHre(hre);

  return deployment.deployContract(contractName as EContracts, signer, ...args);
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
export const deployPoseidonContracts = async (
  signer?: Signer,
  { poseidonT3, poseidonT4, poseidonT5, poseidonT6 }: IDeployMaciArgs["poseidonAddresses"] = {},
  quiet = false,
): Promise<IDeployedPoseidonContracts> => {
  const [PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract] = await Promise.all([
    !poseidonT3 ? await deployContract<PoseidonT3>("PoseidonT3", signer, quiet) : PoseidonT3Factory.connect(poseidonT3),
    !poseidonT4 ? await deployContract<PoseidonT4>("PoseidonT4", signer, quiet) : PoseidonT4Factory.connect(poseidonT4),
    !poseidonT5 ? await deployContract<PoseidonT5>("PoseidonT5", signer, quiet) : PoseidonT5Factory.connect(poseidonT5),
    !poseidonT6 ? await deployContract<PoseidonT6>("PoseidonT6", signer, quiet) : PoseidonT6Factory.connect(poseidonT6),
  ]);

  return {
    PoseidonT3Contract,
    PoseidonT4Contract,
    PoseidonT5Contract,
    PoseidonT6Contract,
  };
};

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
  ...args: unknown[]
): Promise<T> => {
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance(hre);
  deployment.setHre(hre);

  return deployment.deployContractWithLinkedLibraries(contractFactory, ...args);
};

/**
 * Deploy a Poll Factory contract
 * @param signer - the signer object to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Poll Factory contract
 */
export const deployPollFactory = async (signer: Signer, quiet = false): Promise<PollFactory> => {
  const poseidonContracts = await deployPoseidonContracts(signer, {}, quiet);
  const [poseidonT3Contract, poseidonT4Contract, poseidonT5Contract, poseidonT6Contract] = await Promise.all([
    poseidonContracts.PoseidonT3Contract.getAddress(),
    poseidonContracts.PoseidonT4Contract.getAddress(),
    poseidonContracts.PoseidonT5Contract.getAddress(),
    poseidonContracts.PoseidonT6Contract.getAddress(),
  ]);

  const contractFactory = await linkPoseidonLibraries(
    "PollFactory",
    poseidonT3Contract,
    poseidonT4Contract,
    poseidonT5Contract,
    poseidonT6Contract,
    signer,
    quiet,
  );

  return deployContractWithLinkedLibraries(contractFactory);
};

/**
 * Deploy a MACI contract
 * @param {IDeployMaciArgs} args - deploy arguments
 * @returns {IDeployedMaci} the deployed MACI contract
 */
export const deployMaci = async ({
  signUpTokenGatekeeperContractAddress,
  initialVoiceCreditBalanceAddress,
  topupCreditContractAddress,
  signer,
  poseidonAddresses,
  stateTreeDepth = 10,
  quiet = true,
}: IDeployMaciArgs): Promise<IDeployedMaci> => {
  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(signer, poseidonAddresses, quiet);

  const poseidonAddrs = await Promise.all([
    PoseidonT3Contract.getAddress(),
    PoseidonT4Contract.getAddress(),
    PoseidonT5Contract.getAddress(),
    PoseidonT6Contract.getAddress(),
  ]).then(([poseidonT3, poseidonT4, poseidonT5, poseidonT6]) => ({
    poseidonT3,
    poseidonT4,
    poseidonT5,
    poseidonT6,
  }));

  const contractsToLink = ["MACI", "PollFactory", "MessageProcessorFactory", "TallyFactory"];

  // Link Poseidon contracts to MACI
  const linkedContractFactories = await Promise.all(
    contractsToLink.map(async (contractName: string) =>
      linkPoseidonLibraries(
        contractName,
        poseidonAddrs.poseidonT3,
        poseidonAddrs.poseidonT4,
        poseidonAddrs.poseidonT5,
        poseidonAddrs.poseidonT6,
        signer,
        quiet,
      ),
    ),
  );

  const [maciContractFactory, pollFactoryContractFactory, messageProcessorFactory, tallyFactory] =
    await Promise.all(linkedContractFactories);

  const pollFactoryContract = await deployContractWithLinkedLibraries<PollFactory>(pollFactoryContractFactory);

  const messageProcessorFactoryContract =
    await deployContractWithLinkedLibraries<MessageProcessorFactory>(messageProcessorFactory);

  const tallyFactoryContract = await deployContractWithLinkedLibraries<TallyFactory>(tallyFactory);

  const [pollAddress, messageProcessorAddress, tallyAddress] = await Promise.all([
    pollFactoryContract.getAddress(),
    messageProcessorFactoryContract.getAddress(),
    tallyFactoryContract.getAddress(),
  ]);

  const maciContract = await deployContractWithLinkedLibraries<MACI>(
    maciContractFactory,
    pollAddress,
    messageProcessorAddress,
    tallyAddress,
    signUpTokenGatekeeperContractAddress,
    initialVoiceCreditBalanceAddress,
    topupCreditContractAddress,
    stateTreeDepth,
  );

  const [stateAqContractAddress, deployer] = await Promise.all([maciContract.stateAq(), getDefaultSigner()]);
  const stateAqContract = AccQueueQuinaryMaciFactory.connect(stateAqContractAddress, signer || deployer);

  return {
    maciContract,
    stateAqContract,
    pollFactoryContract,
    poseidonAddrs,
  };
};
