import { type ContractFactory, type Signer, BaseContract } from "ethers";

import type { IDeployMaciArgs, IDeployedMaci, IDeployedPoseidonContracts } from "./types";
import type { TAbi } from "../tasks/helpers/types";

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
  Verifier,
  VkRegistry,
  PollFactory__factory as PollFactoryFactory,
  MACI__factory as MACIFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  GitcoinPassportGatekeeper,
  SemaphoreGatekeeper,
} from "../typechain-types";

import { genEmptyBallotRoots } from "./genEmptyBallotRoots";
import { log } from "./utils";

/**
 * Creates contract factory from abi and bytecode
 *
 * @param abi - Contract abi
 * @param bytecode - Contract bytecode
 * @param signer - the signer to use to deploy the contract
 * @returns a contract factory with the libraries linked
 */
export const createContractFactory = async (abi: TAbi, bytecode: string, signer?: Signer): Promise<ContractFactory> => {
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance(hre);
  deployment.setHre(hre);
  const deployer = signer || (await deployment.getDeployer());

  return deployment.createContractFactory(abi, bytecode, deployer);
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

  return deployment.deployContract({ name: contractName as EContracts, signer }, ...args);
};

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
 * Deploy a GitcoinPassportGatekeeper contract
 * @param decoderAddress - the address of the GitcoinPassportDecoder contract
 * @param minimumScore - the minimum score required to pass
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed GitcoinPassportGatekeeper contract
 */
export const deployGitcoinPassportGatekeeper = async (
  decoderAddress: string,
  minimumScore: number,
  signer?: Signer,
  quiet = false,
): Promise<GitcoinPassportGatekeeper> =>
  deployContract<GitcoinPassportGatekeeper>(
    "GitcoinPassportGatekeeper",
    signer,
    quiet,
    decoderAddress,
    minimumScore.toString(),
  );

/**
 * Deploy a SemaphoreGatekeeper contract
 * @param semaphoreAddress - the address of the Semaphore contract
 * @param groupId - The group id of the semaphore group
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed SemaphoreGatekeeper contract
 */
export const deploySemaphoreGatekeeper = async (
  semaphoreAddress: string,
  groupId: bigint,
  signer?: Signer,
  quiet = false,
): Promise<SemaphoreGatekeeper> =>
  deployContract<SemaphoreGatekeeper>("SemaphoreGatekeeper", signer, quiet, semaphoreAddress, groupId.toString());

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

  return deployment.deployContractWithLinkedLibraries({ contractFactory }, ...args);
};

/**
 * Deploy a Poll Factory contract
 * @param signer - the signer object to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Poll Factory contract
 */
export const deployPollFactory = async (
  signer: Signer,
  factory: typeof PollFactoryFactory | undefined,
  quiet = false,
): Promise<PollFactory> => {
  const poseidonContracts = await deployPoseidonContracts(signer, {}, quiet);
  const [poseidonT3Contract, poseidonT4Contract, poseidonT5Contract, poseidonT6Contract] = await Promise.all([
    poseidonContracts.PoseidonT3Contract.getAddress(),
    poseidonContracts.PoseidonT4Contract.getAddress(),
    poseidonContracts.PoseidonT5Contract.getAddress(),
    poseidonContracts.PoseidonT6Contract.getAddress(),
  ]);

  const pollFactory = factory || PollFactoryFactory;

  const contractFactory = await createContractFactory(
    pollFactory.abi,
    pollFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3Contract,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4Contract,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5Contract,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6Contract,
    }),
    signer,
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
  signer,
  poseidonAddresses,
  stateTreeDepth = 10,
  factories,
  quiet = true,
}: IDeployMaciArgs): Promise<IDeployedMaci> => {
  const emptyBallotRoots = genEmptyBallotRoots(stateTreeDepth);

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

  const contractsToLink = [MACIFactory, PollFactoryFactory, MessageProcessorFactoryFactory, TallyFactoryFactory];

  // Link Poseidon contracts to MACI
  const linkedContractFactories =
    factories ||
    (await Promise.all(
      contractsToLink.map(async (factory) =>
        createContractFactory(
          factory.abi,
          factory.linkBytecode({
            "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
            "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
            "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
            "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
          }),
          signer,
        ),
      ),
    ));

  const [maciContractFactory, pollFactoryContractFactory, messageProcessorFactory, tallyFactory] =
    linkedContractFactories;

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
    stateTreeDepth,
    emptyBallotRoots,
  );

  return {
    maciContract,
    pollFactoryContract,
    poseidonAddrs,
  };
};
