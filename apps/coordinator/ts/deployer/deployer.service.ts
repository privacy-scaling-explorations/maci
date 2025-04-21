import { IVerifyingKeyObjectParams, PublicKey, VerifyingKey } from "@maci-protocol/domainobjs";
import {
  ConstantInitialVoiceCreditProxy__factory as ConstantInitialVoiceCreditProxyFactory,
  ContractStorage,
  EPolicies,
  FreeForAllPolicy__factory as FreeForAllPolicyFactory,
  EASPolicy__factory as EASPolicyFactory,
  ZupassPolicy__factory as ZupassPolicyFactory,
  HatsPolicy__factory as HatsPolicyFactory,
  SemaphorePolicy__factory as SemaphorePolicyFactory,
  GitcoinPassportPolicy__factory as GitcoinPassportPolicyFactory,
  Verifier__factory as VerifierFactory,
  PoseidonT3__factory as PoseidonT3Factory,
  PoseidonT4__factory as PoseidonT4Factory,
  PoseidonT5__factory as PoseidonT5Factory,
  PoseidonT6__factory as PoseidonT6Factory,
  VerifyingKeysRegistry__factory as VerifyingKeysRegistryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  PollFactory__factory as PollFactoryFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  ERC20VotesPolicy__factory as ERC20VotesPolicyFactory,
  ERC20Policy__factory as ERC20PolicyFactory,
  Tally__factory as TallyFactory,
  Poll__factory as PollFactory,
  MACI__factory as MACIFactory,
  EContracts,
  EInitialVoiceCreditProxies,
  EMode,
  deployPoll,
  type ISetVerifyingKeysArgs,
  extractAllVerifyingKeys,
  extractVerifyingKey,
  generateEmptyBallotRoots,
  type IVerifyingKeyStruct,
  VerifyingKeysRegistry,
} from "@maci-protocol/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { BaseContract, InterfaceAbi, Signer } from "ethers";
import { GetUserOperationReceiptReturnType } from "permissionless";
import { Abi, encodeFunctionData, type Hex } from "viem";

import path from "path";

import { ErrorCodes, ESupportedNetworks, KernelClientType, BundlerClientType, PublicClientType } from "../common";
import { getBundlerClient, getDeployedContractAddress, getPublicClient } from "../common/accountAbstraction";
import { FileService } from "../file/file.service";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

import { MAX_GAS_LIMIT } from "./constants";
import {
  IContractData,
  IDeployMaciArgs,
  IDeployPollArgs,
  IEASPolicyArgs,
  IPolicyArgs,
  IGitcoinPassportPolicyArgs,
  IHatsPolicyArgs,
  IInitialVoiceCreditProxyArgs,
  ISemaphorePolicyArgs,
  IUserOperation,
  IVerifyingKeysRegistryArgs,
  IZupassPolicyArgs,
  IERC20VotesPolicyArgs,
  IERC20PolicyArgs,
} from "./types";
import { estimateExtraGasLimit } from "./utils";

/**
 * DeployerService is responsible for deploying contracts.
 */
@Injectable()
export class DeployerService {
  /**
   * Logger
   */
  private readonly logger = new Logger(DeployerService.name);

  /**
   * Contract storage instance
   */
  private readonly storage: ContractStorage;

  /**
   * Create a new instance of DeployerService
   *
   * @param fileService - file service
   */
  constructor(
    private readonly sessionKeysService: SessionKeysService,
    private readonly fileService: FileService,
  ) {
    this.logger = new Logger(DeployerService.name);
    this.storage = ContractStorage.getInstance(path.join(process.cwd(), "deployed-contracts.json"));
  }

  /**
   * Get the policy abi and bytecode based on the policy type
   * and also check if there is already an instance deployed
   *
   * @param policyType - the policy type
   * @param network - the network
   * @param args - the policy args
   * @returns - the policy abi and bytecode
   */
  getPolicyData(policyType: EPolicies, network: ESupportedNetworks, args?: IPolicyArgs): IContractData {
    const address = this.storage.getAddress(policyType as unknown as EContracts, network);
    let storedArgs: string[] | undefined;
    let isAlreadyDeployed: boolean;

    // based on the policy type, we need to deploy the correct policy
    switch (policyType) {
      case EPolicies.FreeForAll: {
        return {
          address,
          abi: FreeForAllPolicyFactory.abi,
          bytecode: FreeForAllPolicyFactory.bytecode,
          alreadyDeployed: !!address,
        };
      }

      case EPolicies.EAS: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 3 &&
          storedArgs[0] === (args as IEASPolicyArgs).easAddress &&
          storedArgs[1] === (args as IEASPolicyArgs).schema &&
          storedArgs[2] === (args as IEASPolicyArgs).attester;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: EASPolicyFactory.abi,
          bytecode: EASPolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.Zupass: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 4 &&
          storedArgs[0] === (args as IZupassPolicyArgs).signer1 &&
          storedArgs[1] === (args as IZupassPolicyArgs).signer2 &&
          storedArgs[2] === (args as IZupassPolicyArgs).eventId &&
          storedArgs[3] === (args as IZupassPolicyArgs).zupassVerifier;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: ZupassPolicyFactory.abi,
          bytecode: ZupassPolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.Hats: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as IHatsPolicyArgs).hatsProtocolAddress &&
          JSON.stringify(storedArgs[1]) === JSON.stringify((args as IHatsPolicyArgs).critrionHats);

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: HatsPolicyFactory.abi,
          bytecode: HatsPolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.Semaphore: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as ISemaphorePolicyArgs).semaphoreContract &&
          storedArgs[1] === (args as ISemaphorePolicyArgs).groupId;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: SemaphorePolicyFactory.abi,
          bytecode: SemaphorePolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.GitcoinPassport: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as IGitcoinPassportPolicyArgs).decoderAddress &&
          storedArgs[1] === (args as IGitcoinPassportPolicyArgs).passingScore;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: GitcoinPassportPolicyFactory.abi,
          bytecode: GitcoinPassportPolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.ERC20Votes: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 3 &&
          storedArgs[0] === (args as IERC20VotesPolicyArgs).token &&
          storedArgs[1] === (args as IERC20VotesPolicyArgs).factor &&
          storedArgs[2] === (args as IERC20VotesPolicyArgs).snapshotBlock;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: ERC20VotesPolicyFactory.abi,
          bytecode: ERC20VotesPolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EPolicies.ERC20: {
        storedArgs = this.storage.getContractArgs(policyType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as IERC20PolicyArgs).token &&
          storedArgs[1] === (args as IERC20PolicyArgs).threshold;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: ERC20PolicyFactory.abi,
          bytecode: ERC20PolicyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      default:
        throw new Error(ErrorCodes.UNSUPPORTED_POLICY.toString());
    }
  }

  /**
   * Get the voice credit proxy abi and bytecode based on the voice credit proxy type
   * and also check if there is already an instance deployed
   *
   * @param voiceCreditProxyType - the voice credit proxy type
   * @param network - the network
   * @param args - the voice credit proxy args
   * @returns - the voice credit proxy abi and bytecode
   */
  getVoiceCreditProxyData(
    voiceCreditProxyType: EInitialVoiceCreditProxies,
    network: ESupportedNetworks,
    args: IInitialVoiceCreditProxyArgs,
  ): IContractData {
    let storedArgs: string[] | undefined;
    let isAlreadyDeployed: boolean;
    const address = this.storage.getAddress(voiceCreditProxyType, network);

    switch (voiceCreditProxyType) {
      case EInitialVoiceCreditProxies.Constant: {
        storedArgs = this.storage.getContractArgs(voiceCreditProxyType as unknown as EContracts, network);
        isAlreadyDeployed = !!storedArgs && storedArgs[0] === args.amount;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: ConstantInitialVoiceCreditProxyFactory.abi,
          bytecode: ConstantInitialVoiceCreditProxyFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      default:
        throw new Error(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY.toString());
    }
  }

  /**
   * @param abi - the abi
   * @param bytecode - the bytecode
   * @param args - the args
   * @param publicClient - the public client
   * @returns - the address
   */
  async deployAndGetAddress(
    kernelClient: KernelClientType,
    abi: Abi,
    bytecode: Hex,
    args: unknown[],
    bundlerClient: BundlerClientType,
    publicClient: PublicClientType,
  ): Promise<string | undefined> {
    const deployCallData = await kernelClient.account.encodeDeployCallData({
      abi,
      args,
      bytecode,
    });

    const gasPrice = await kernelClient.getUserOperationGasPrice();

    const opEstimate = await kernelClient.prepareUserOperation({
      callData: deployCallData,
      sender: kernelClient.account.address,
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    });

    const callGasLimitMultiplier = estimateExtraGasLimit(opEstimate.callGasLimit);

    const tx = await kernelClient.sendUserOperation({
      callData: deployCallData,
      sender: kernelClient.account.address,
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      callGasLimit:
        opEstimate.callGasLimit + callGasLimitMultiplier < MAX_GAS_LIMIT
          ? opEstimate.callGasLimit + callGasLimitMultiplier
          : MAX_GAS_LIMIT,
    });

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: tx,
    });

    const txReceipt = await publicClient.getTransactionReceipt({
      hash: receipt.receipt.transactionHash,
    });

    return getDeployedContractAddress(txReceipt);
  }

  /**
   * Deploy a contract and store the address
   *
   * @param contract - the contract to deploy
   * @param args - the args
   * @param abi - the abi
   * @param bytecode - the bytecode
   * @param kernelClient - the kernel client
   * @param publicClient - the public client
   * @param chain - the chain
   * @returns - the address of the deployed contract
   */
  async deployAndStore(
    contract: EContracts,
    args: unknown[],
    abi: Abi,
    bytecode: Hex,
    kernelClient: KernelClientType,
    bundlerClient: BundlerClientType,
    publicClient: PublicClientType,
    chain: ESupportedNetworks,
  ): Promise<Hex> {
    let address = this.storage.getAddress(contract, chain);

    if (!address) {
      address = await this.deployAndGetAddress(kernelClient, abi, bytecode, args, bundlerClient, publicClient);

      if (!address) {
        this.logger.error(`Failed to deploy contract: ${contract}`);
        throw new Error(`${ErrorCodes.FAILED_TO_DEPLOY_CONTRACT} ${contract}`);
      }

      await this.storage.register({
        id: contract,
        contract: new BaseContract(address, abi as unknown as InterfaceAbi),
        args: args.map((arg) => {
          if (Array.isArray(arg)) {
            return arg.map((a) => String(a));
          }
          return String(arg);
        }),
        network: chain,
      });
    }

    return address as Hex;
  }

  /**
   * Estimate gas, add a bit extra and send the user operation (aka. transaction)
   * @param to - the to address of the user operation
   * @param value - the value of the user operation
   * @param abi - the abi
   * @param functionName - the function name
   * @param args - the args
   * @param errorMessage - the error message
   * @param kernelClient - the kernel client
   * @param bundlerClient - the bundler client
   */
  async estimateGasAndSend(
    to: Hex,
    value: bigint,
    abi: Abi,
    functionName: string,
    args: unknown[],
    errorMessage: string,
    kernelClient: KernelClientType,
    bundlerClient: BundlerClientType,
  ): Promise<GetUserOperationReceiptReturnType> {
    const gasEstimates = await kernelClient.getUserOperationGasPrice();
    const userOperation: IUserOperation = {
      sender: kernelClient.account.address,
      maxFeePerGas: gasEstimates.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimates.maxPriorityFeePerGas,
      callData: await kernelClient.account.encodeCalls([
        {
          to,
          value,
          data: encodeFunctionData({
            abi,
            functionName,
            args,
          }),
        },
      ]),
    };
    const opEstimate = await kernelClient.prepareUserOperation(userOperation);
    const callGasLimitMultiplier = estimateExtraGasLimit(opEstimate.callGasLimit);

    const userOperationHash = await kernelClient.sendUserOperation({
      ...userOperation,
      callGasLimit:
        opEstimate.callGasLimit + callGasLimitMultiplier < MAX_GAS_LIMIT
          ? opEstimate.callGasLimit + callGasLimitMultiplier
          : MAX_GAS_LIMIT,
    });
    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash });

    if (!receipt.success) {
      throw new Error(errorMessage);
    }

    return receipt;
  }

  /**
   * Get verifying keys arguments (specially zkey paths)
   * @param signer - the signer
   * @param verifyingKeysRegistryContract - the deployed verifyingKey registry contract
   * @param verifyingKeysRegistryArgs - the arguments send to the endpoint
   * @param mode - use QV or NON_QV
   * @returns SetVerifyingKeysArgs
   */
  async getVerifyingKeysArgs(
    signer: Signer,
    verifyingKeysRegistryContract: VerifyingKeysRegistry,
    verifyingKeysRegistryArgs: IVerifyingKeysRegistryArgs,
    mode: EMode,
  ): Promise<ISetVerifyingKeysArgs> {
    const pollJoiningZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINING_ZKEY_NAME!,
      true,
    ).zkey;
    const pollJoinedZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINED_ZKEY_NAME!,
      true,
    ).zkey;
    const processMessagesZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
      mode === EMode.QV,
    ).zkey;
    const tallyVotesZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_TALLY_ZKEY_NAME!,
      mode === EMode.QV,
    ).zkey;
    const { pollJoiningVerifyingKey, pollJoinedVerifyingKey, processVerifyingKey, tallyVerifyingKey } =
      await extractAllVerifyingKeys({
        pollJoiningZkeyPath,
        pollJoinedZkeyPath,
        processMessagesZkeyPath,
        tallyVotesZkeyPath,
      });
    const { stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, pollStateTreeDepth, messageBatchSize } =
      verifyingKeysRegistryArgs;
    return {
      pollJoiningVerifyingKey: pollJoiningVerifyingKey!,
      pollJoinedVerifyingKey: pollJoinedVerifyingKey!,
      processMessagesVerifyingKey: processVerifyingKey!,
      tallyVotesVerifyingKey: tallyVerifyingKey!,
      stateTreeDepth: Number(stateTreeDepth),
      intStateTreeDepth: Number(intStateTreeDepth),
      voteOptionTreeDepth: Number(voteOptionTreeDepth),
      messageBatchSize: Number(messageBatchSize),
      pollStateTreeDepth: Number(pollStateTreeDepth),
      signer,
      mode,
      verifyingKeysRegistryAddress: await verifyingKeysRegistryContract.getAddress(),
    };
  }

  /**
   * Deploy MACI contracts
   *
   * @param args - deploy maci arguments
   * @param options - ws hooks
   * @returns - deployed maci contract
   * @returns the address of the deployed maci contract
   */
  async deployMaci({ approval, sessionKeyAddress, chain, config }: IDeployMaciArgs): Promise<{ address: string }> {
    const publicClient = getPublicClient(chain);
    const bundlerClient = getBundlerClient(chain);

    const kernelClient = await this.sessionKeysService.generateClientFromSessionKey(sessionKeyAddress, approval, chain);

    let policyAddress = this.storage.getAddress(config.policy.type as unknown as EContracts, chain);
    const policyData = this.getPolicyData(config.policy.type, chain, config.policy.args);

    // if the policy is not already deployed, we need to deploy it
    if (!policyData.alreadyDeployed) {
      policyAddress = await this.deployAndStore(
        config.policy.type as unknown as EContracts,
        config.policy.args ? Object.values(config.policy.args) : [],
        policyData.abi,
        policyData.bytecode,
        kernelClient,
        bundlerClient,
        publicClient,
        chain,
      );
    }

    // deploy all maci contracts
    // (we are not using Promise.all because the write tx nonce should be sequential)
    // 1. verifier
    await this.deployAndStore(
      EContracts.Verifier,
      [],
      VerifierFactory.abi,
      VerifierFactory.bytecode,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    // 2. poseidon
    let poseidonT3Address: Hex;
    let poseidonT4Address: Hex;
    let poseidonT5Address: Hex;
    let poseidonT6Address: Hex;
    if (config.Poseidon) {
      // Some times the poseidon contracts are already deployed so we don't need to deploy them again
      poseidonT3Address = config.Poseidon.poseidonT3;
      poseidonT4Address = config.Poseidon.poseidonT4;
      poseidonT5Address = config.Poseidon.poseidonT5;
      poseidonT6Address = config.Poseidon.poseidonT6;
    } else {
      poseidonT3Address = await this.deployAndStore(
        EContracts.PoseidonT3,
        [],
        PoseidonT3Factory.abi,
        PoseidonT3Factory.bytecode,
        kernelClient,
        bundlerClient,
        publicClient,
        chain,
      );
      poseidonT4Address = await this.deployAndStore(
        EContracts.PoseidonT4,
        [],
        PoseidonT4Factory.abi,
        PoseidonT4Factory.bytecode,
        kernelClient,
        bundlerClient,
        publicClient,
        chain,
      );
      poseidonT5Address = await this.deployAndStore(
        EContracts.PoseidonT5,
        [],
        PoseidonT5Factory.abi,
        PoseidonT5Factory.bytecode,
        kernelClient,
        bundlerClient,
        publicClient,
        chain,
      );
      poseidonT6Address = await this.deployAndStore(
        EContracts.PoseidonT6,
        [],
        PoseidonT6Factory.abi,
        PoseidonT6Factory.bytecode,
        kernelClient,
        bundlerClient,
        publicClient,
        chain,
      );
    }

    // 3. factories
    const pollFactoryAddress = await this.deployAndStore(
      EContracts.PollFactory,
      [],
      PollFactoryFactory.abi as unknown as Abi,
      PollFactoryFactory.linkBytecode({
        "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3Address,
        "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4Address,
        "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5Address,
        "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6Address,
      }) as Hex,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    const tallyFactoryAddress = await this.deployAndStore(
      EContracts.TallyFactory,
      [],
      TallyFactoryFactory.abi as unknown as Abi,
      TallyFactoryFactory.linkBytecode({
        "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3Address,
        "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4Address,
        "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5Address,
        "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6Address,
      }) as Hex,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    const messageProcessorFactoryAddress = await this.deployAndStore(
      EContracts.MessageProcessorFactory,
      [],
      MessageProcessorFactoryFactory.abi,
      MessageProcessorFactoryFactory.linkBytecode({
        "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3Address,
        "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4Address,
        "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5Address,
        "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6Address,
      }) as Hex,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    // 4. VerifyingKeysRegistry
    const verifyingKeysRegistryAddress = await this.deployAndStore(
      EContracts.VerifyingKeysRegistry,
      [],
      VerifyingKeysRegistryFactory.abi,
      VerifyingKeysRegistryFactory.bytecode,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    try {
      const processMessagesZkeyPathQv = this.fileService.getZkeyFilePaths(
        process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
        true,
      );
      const tallyVotesZkeyPathQv = this.fileService.getZkeyFilePaths(process.env.COORDINATOR_TALLY_ZKEY_NAME!, true);
      const processMessagesZkeyPathNonQv = this.fileService.getZkeyFilePaths(
        process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
        false,
      );
      const tallyVotesZkeyPathNonQv = this.fileService.getZkeyFilePaths(
        process.env.COORDINATOR_TALLY_ZKEY_NAME!,
        false,
      );
      const pollJoiningZkeyPath = this.fileService.getZkeyFilePaths(
        process.env.COORDINATOR_POLL_JOINING_ZKEY_NAME!,
        true,
      );
      const pollJoinedZkeyPath = this.fileService.getZkeyFilePaths(
        process.env.COORDINATOR_POLL_JOINED_ZKEY_NAME!,
        true,
      );

      const [
        qvProcessVerifyingKey,
        qvTallyVerifyingKey,
        nonQvProcessVerifyingKey,
        nonQvTallyVerifyingKey,
        pollJoiningVerifyingKey,
        pollJoinedVerifyingKey,
      ] = await Promise.all([
        extractVerifyingKey(processMessagesZkeyPathQv.zkey),
        extractVerifyingKey(tallyVotesZkeyPathQv.zkey),
        extractVerifyingKey(processMessagesZkeyPathNonQv.zkey),
        extractVerifyingKey(tallyVotesZkeyPathNonQv.zkey),
        extractVerifyingKey(pollJoiningZkeyPath.zkey),
        extractVerifyingKey(pollJoinedZkeyPath.zkey),
      ]).then((verifyingKeys) =>
        verifyingKeys.map(
          (verifyingKey: IVerifyingKeyObjectParams | "" | undefined) =>
            verifyingKey && (VerifyingKey.fromObj(verifyingKey).asContractParam() as IVerifyingKeyStruct),
        ),
      );

      const processZkeys = [qvProcessVerifyingKey, nonQvProcessVerifyingKey].filter(Boolean) as IVerifyingKeyStruct[];
      const tallyZkeys = [qvTallyVerifyingKey, nonQvTallyVerifyingKey].filter(Boolean) as IVerifyingKeyStruct[];

      // check if the keys are already set
      const [
        isProcessVerifyingKeySet,
        isProcessNonQvVerifyingKeySet,
        isTallyVerifyingKeySet,
        isTallyNonQvVerifyingKeySet,
      ] = await Promise.all([
        publicClient.readContract({
          address: verifyingKeysRegistryAddress,
          abi: VerifyingKeysRegistryFactory.abi,
          functionName: "hasProcessVerifyingKey",
          args: [
            config.VerifyingKeysRegistry.args.stateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.voteOptionTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.messageBatchSize,
            EMode.QV,
          ],
        }),
        publicClient.readContract({
          address: verifyingKeysRegistryAddress,
          abi: VerifyingKeysRegistryFactory.abi,
          functionName: "hasProcessVerifyingKey",
          args: [
            config.VerifyingKeysRegistry.args.stateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.voteOptionTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.messageBatchSize,
            EMode.NON_QV,
          ],
        }),
        publicClient.readContract({
          address: verifyingKeysRegistryAddress,
          abi: VerifyingKeysRegistryFactory.abi,
          functionName: "hasTallyVerifyingKey",
          args: [
            config.VerifyingKeysRegistry.args.stateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.intStateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.voteOptionTreeDepth as bigint,
            EMode.QV,
          ],
        }),
        publicClient.readContract({
          address: verifyingKeysRegistryAddress,
          abi: VerifyingKeysRegistryFactory.abi,
          functionName: "hasTallyVerifyingKey",
          args: [
            config.VerifyingKeysRegistry.args.stateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.intStateTreeDepth as bigint,
            config.VerifyingKeysRegistry.args.voteOptionTreeDepth as bigint,
            EMode.NON_QV,
          ],
        }),
      ]);

      if (
        isProcessVerifyingKeySet &&
        isProcessNonQvVerifyingKeySet &&
        isTallyVerifyingKeySet &&
        isTallyNonQvVerifyingKeySet
      ) {
        this.logger.debug("Verifying keys are already set on the verifyingKey registry");
      } else {
        await this.estimateGasAndSend(
          verifyingKeysRegistryAddress,
          0n,
          VerifyingKeysRegistryFactory.abi,
          "setVerifyingKeysBatch",
          [
            config.VerifyingKeysRegistry.args.stateTreeDepth,
            config.VerifyingKeysRegistry.args.pollStateTreeDepth,
            config.VerifyingKeysRegistry.args.intStateTreeDepth,
            config.VerifyingKeysRegistry.args.voteOptionTreeDepth,
            config.VerifyingKeysRegistry.args.messageBatchSize,
            [EMode.QV, EMode.NON_QV],
            pollJoiningVerifyingKey as IVerifyingKeyStruct,
            pollJoinedVerifyingKey as IVerifyingKeyStruct,
            processZkeys,
            tallyZkeys,
          ],
          ErrorCodes.FAILED_TO_SET_VERIFYING_KEYS.toString(),
          kernelClient,
          bundlerClient,
        );
      }
    } catch (error) {
      this.logger.error("Failed to set verifying keys on verifyingKey registry: ", error);
      throw error;
    }

    // 5. maci (here we don't check whether one is already deployed, we just deploy it)
    const emptyBallotRoots = generateEmptyBallotRoots(config.MACI.stateTreeDepth);
    const maciAddress = await this.deployAndStore(
      EContracts.MACI,
      [
        pollFactoryAddress,
        messageProcessorFactoryAddress,
        tallyFactoryAddress,
        policyAddress,
        config.MACI.stateTreeDepth,
        emptyBallotRoots,
      ],
      MACIFactory.abi,
      MACIFactory.linkBytecode({
        "contracts/crypto/PoseidonT3.sol:PoseidonT3": "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233",
        "contracts/crypto/PoseidonT4.sol:PoseidonT4": "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d",
        "contracts/crypto/PoseidonT5.sol:PoseidonT5": "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679",
        "contracts/crypto/PoseidonT6.sol:PoseidonT6": "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F",
      }) as Hex,
      kernelClient,
      bundlerClient,
      publicClient,
      chain,
    );

    // set the gate on the policy
    await this.estimateGasAndSend(
      policyAddress as Hex,
      0n,
      policyData.abi,
      "setTarget",
      [maciAddress],
      ErrorCodes.FAILED_TO_SET_MACI_INSTANCE_ON_POLICY.toString(),
      kernelClient,
      bundlerClient,
    );

    return { address: maciAddress };
  }

  /**
   * Deploy a poll
   *
   * @param args - deploy poll dto
   * @returns poll id
   */
  async deployPoll({ approval, sessionKeyAddress, chain, config }: IDeployPollArgs): Promise<{ pollId: string }> {
    const publicClient = getPublicClient(chain);
    const bundlerClient = getBundlerClient(chain);
    const kernelClient = await this.sessionKeysService.generateClientFromSessionKey(sessionKeyAddress, approval, chain);
    const signer = await this.sessionKeysService.getKernelClientSigner(kernelClient);

    // check if there is a maci contract deployed on this chain
    const maciAddress = this.storage.getAddress(EContracts.MACI, chain);
    if (!maciAddress) {
      throw new Error(ErrorCodes.MACI_NOT_DEPLOYED.toString());
    }

    // check if there is a verifier deployed on this chain
    const verifierAddress = this.storage.getAddress(EContracts.Verifier, chain);
    if (!verifierAddress) {
      throw new Error(ErrorCodes.VERIFIER_NOT_DEPLOYED.toString());
    }

    // check if there is a verifyingKey registry deployed on this chain
    const verifyingKeysRegistryAddress = this.storage.getAddress(EContracts.VerifyingKeysRegistry, chain);
    if (!verifyingKeysRegistryAddress) {
      throw new Error(ErrorCodes.VERIFYING_KEYS_REGISTRY_NOT_DEPLOYED.toString());
    }

    // check if policy address was given
    let policyAddress = config.policy.address;
    if (!policyAddress) {
      const policyData = this.getPolicyData(config.policy.type, chain, config.policy.args);
      policyAddress = policyData.address as Hex;
      // if the policy is not already deployed, we need to deploy it
      if (!policyData.alreadyDeployed) {
        policyAddress = await this.deployAndStore(
          config.policy.type as unknown as EContracts,
          config.policy.args ? Object.values(config.policy.args) : [],
          policyData.abi,
          policyData.bytecode,
          kernelClient,
          bundlerClient,
          publicClient,
          chain,
        );
      }
    }

    // check if initial voice credit proxy address was given
    let initialVoiceCreditProxyAddress = config.initialVoiceCreditsProxy.address;
    if (!initialVoiceCreditProxyAddress) {
      const voiceCreditProxyData = this.getVoiceCreditProxyData(
        config.initialVoiceCreditsProxy.type,
        chain,
        config.initialVoiceCreditsProxy.args,
      );
      initialVoiceCreditProxyAddress = voiceCreditProxyData.address as Hex;
      // if the voice credit proxy is not already deployed, we need to deploy it
      if (!voiceCreditProxyData.alreadyDeployed) {
        initialVoiceCreditProxyAddress = await this.deployAndStore(
          config.initialVoiceCreditsProxy.type as unknown as EContracts,
          Object.values(config.initialVoiceCreditsProxy.args),
          voiceCreditProxyData.abi,
          voiceCreditProxyData.bytecode,
          kernelClient,
          bundlerClient,
          publicClient,
          chain,
        );
      }
    }

    const mode = config.useQuadraticVoting ? EMode.QV : EMode.NON_QV;

    const deployPollArgs = {
      maciAddress,
      pollStartTimestamp: config.startDate,
      pollEndTimestamp: config.endDate,
      intStateTreeDepth: config.intStateTreeDepth,
      voteOptionTreeDepth: config.voteOptionTreeDepth,
      messageBatchSize: config.messageBatchSize,
      stateTreeDepth: config.pollStateTreeDepth,
      coordinatorPublicKey: PublicKey.deserialize(config.coordinatorPublicKey),
      verifierContractAddress: verifierAddress,
      verifyingKeysRegistryContractAddress: verifyingKeysRegistryAddress,
      mode,
      policyContractAddress: policyAddress,
      initialVoiceCreditProxyContractAddress: initialVoiceCreditProxyAddress,
      relayers: config.relayers ? config.relayers.map((address) => address as Hex) : [],
      voteOptions: Number(config.voteOptions),
      initialVoiceCredits: Number(config.initialVoiceCreditsProxy.args.amount),
      signer,
    };
    const { pollContractAddress, messageProcessorContractAddress, tallyContractAddress, pollId } =
      await deployPoll(deployPollArgs);

    const poll = PollFactory.connect(pollContractAddress, signer);
    // read the emptyBallotRoot and extContracts
    const emptyBallotRoot = await poll.emptyBallotRoot();
    const extContracts = await poll.extContracts();

    // store to storage
    await Promise.all([
      this.storage.register({
        id: EContracts.Poll,
        key: `poll-${pollId}`,
        contract: poll,
        args: [
          {
            ...deployPollArgs,
            extContracts,
            emptyBallotRoot: emptyBallotRoot.toString(),
          },
        ],
        network: chain,
      }),
      this.storage.register({
        id: EContracts.MessageProcessor,
        key: `poll-${pollId}`,
        contract: new BaseContract(messageProcessorContractAddress, MessageProcessorFactory.abi),
        args: [verifierAddress, verifyingKeysRegistryAddress, pollContractAddress, mode],
        network: chain,
      }),
      this.storage.register({
        id: EContracts.Tally,
        key: `poll-${pollId}`,
        contract: new BaseContract(tallyContractAddress, TallyFactory.abi),
        args: [
          verifierAddress,
          verifyingKeysRegistryAddress,
          pollContractAddress,
          messageProcessorContractAddress,
          mode,
        ],
        network: chain,
      }),
    ]);

    return { pollId: pollId.toString() };
  }
}
