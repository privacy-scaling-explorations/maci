import { Injectable, Logger } from "@nestjs/common";
import { BaseContract, InterfaceAbi, Signer } from "ethers";
import { extractVk, genEmptyBallotRoots, IVerifyingKeyStruct, VkRegistry } from "maci-contracts";
import { IVkObjectParams, PubKey, VerifyingKey } from "maci-domainobjs";
import {
  ConstantInitialVoiceCreditProxy__factory as ConstantInitialVoiceCreditProxyFactory,
  ContractStorage,
  EGatekeepers,
  FreeForAllGatekeeper__factory as FreeForAllGatekeeperFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  HatsGatekeeperSingle__factory as HatsGatekeeperSingleFactory,
  SemaphoreGatekeeper__factory as SemaphoreGatekeeperFactory,
  GitcoinPassportGatekeeper__factory as GitcoinPassportGatekeeperFactory,
  Verifier__factory as VerifierFactory,
  PoseidonT3__factory as PoseidonT3Factory,
  PoseidonT4__factory as PoseidonT4Factory,
  PoseidonT5__factory as PoseidonT5Factory,
  PoseidonT6__factory as PoseidonT6Factory,
  VkRegistry__factory as VkRegistryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  PollFactory__factory as PollFactoryFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Tally__factory as TallyFactory,
  Poll__factory as PollFactory,
  MACI__factory as MACIFactory,
  EContracts,
  EInitialVoiceCreditProxies,
  EMode,
  deployPoll,
  ISetVerifyingKeysArgs,
  extractAllVks,
} from "maci-sdk";
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
  IEASGatekeeperArgs,
  IGatekeeperArgs,
  IGitcoinPassportGatekeeperArgs,
  IHatsGatekeeperArgs,
  IInitialVoiceCreditProxyArgs,
  ISemaphoreGatekeeperArgs,
  IUserOperation,
  IVkRegistryArgs,
  IZupassGatekeeperArgs,
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
   * Get the gatekeeper abi and bytecode based on the gatekeeper type
   * and also check if there is already an instance deployed
   *
   * @param gatekeeperType - the gatekeeper type
   * @param network - the network
   * @param args - the gatekeeper args
   * @returns - the gatekeeper abi and bytecode
   */
  getGatekeeperData(gatekeeperType: EGatekeepers, network: ESupportedNetworks, args?: IGatekeeperArgs): IContractData {
    const address = this.storage.getAddress(gatekeeperType as unknown as EContracts, network);
    let storedArgs: string[] | undefined;
    let isAlreadyDeployed: boolean;

    // based on the gatekeeper type, we need to deploy the correct gatekeeper
    switch (gatekeeperType) {
      case EGatekeepers.FreeForAll: {
        return {
          address,
          abi: FreeForAllGatekeeperFactory.abi,
          bytecode: FreeForAllGatekeeperFactory.bytecode,
          alreadyDeployed: !!address,
        };
      }

      case EGatekeepers.EAS: {
        storedArgs = this.storage.getContractArgs(gatekeeperType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 3 &&
          storedArgs[0] === (args as IEASGatekeeperArgs).easAddress &&
          storedArgs[1] === (args as IEASGatekeeperArgs).schema &&
          storedArgs[2] === (args as IEASGatekeeperArgs).attester;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: EASGatekeeperFactory.abi,
          bytecode: EASGatekeeperFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EGatekeepers.Zupass: {
        storedArgs = this.storage.getContractArgs(gatekeeperType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 4 &&
          storedArgs[0] === (args as IZupassGatekeeperArgs).signer1 &&
          storedArgs[1] === (args as IZupassGatekeeperArgs).signer2 &&
          storedArgs[2] === (args as IZupassGatekeeperArgs).eventId &&
          storedArgs[3] === (args as IZupassGatekeeperArgs).zupassVerifier;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: ZupassGatekeeperFactory.abi,
          bytecode: ZupassGatekeeperFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EGatekeepers.HatsSingle: {
        storedArgs = this.storage.getContractArgs(gatekeeperType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as IHatsGatekeeperArgs).hatsProtocolAddress &&
          JSON.stringify(storedArgs[1]) === JSON.stringify((args as IHatsGatekeeperArgs).critrionHats);

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: HatsGatekeeperSingleFactory.abi,
          bytecode: HatsGatekeeperSingleFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EGatekeepers.Semaphore: {
        storedArgs = this.storage.getContractArgs(gatekeeperType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as ISemaphoreGatekeeperArgs).semaphoreContract &&
          storedArgs[1] === (args as ISemaphoreGatekeeperArgs).groupId;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: SemaphoreGatekeeperFactory.abi,
          bytecode: SemaphoreGatekeeperFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      case EGatekeepers.GitcoinPassport: {
        storedArgs = this.storage.getContractArgs(gatekeeperType as unknown as EContracts, network);
        isAlreadyDeployed =
          !!storedArgs &&
          storedArgs.length === 2 &&
          storedArgs[0] === (args as IGitcoinPassportGatekeeperArgs).decoderAddress &&
          storedArgs[1] === (args as IGitcoinPassportGatekeeperArgs).passingScore;

        return {
          address: isAlreadyDeployed ? address : undefined,
          abi: GitcoinPassportGatekeeperFactory.abi,
          bytecode: GitcoinPassportGatekeeperFactory.bytecode,
          alreadyDeployed: isAlreadyDeployed,
        };
      }

      default:
        throw new Error(ErrorCodes.UNSUPPORTED_GATEKEEPER.toString());
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
   * @param vkRegistryContract - the deployed vk registry contract
   * @param vkRegistryArgs - the arguments send to the endpoint
   * @param mode - use QV or NON_QV
   * @returns SetVerifyingKeysArgs
   */
  async getVerifyingKeysArgs(
    signer: Signer,
    vkRegistryContract: VkRegistry,
    vkRegistryArgs: IVkRegistryArgs,
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
    const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
      pollJoiningZkeyPath,
      pollJoinedZkeyPath,
      processMessagesZkeyPath,
      tallyVotesZkeyPath,
    });
    const { stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, messageBatchSize } = vkRegistryArgs;
    return {
      pollJoiningVk: pollJoiningVk!,
      pollJoinedVk: pollJoinedVk!,
      processMessagesVk: processVk!,
      tallyVotesVk: tallyVk!,
      stateTreeDepth: Number(stateTreeDepth),
      intStateTreeDepth: Number(intStateTreeDepth),
      voteOptionTreeDepth: Number(voteOptionTreeDepth),
      messageBatchSize: Number(messageBatchSize),
      signer,
      mode,
      vkRegistryAddress: await vkRegistryContract.getAddress(),
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

    let gatekeeperAddress = this.storage.getAddress(config.gatekeeper.type as unknown as EContracts, chain);
    const gatekeeperData = this.getGatekeeperData(config.gatekeeper.type, chain, config.gatekeeper.args);

    // if the gatekeeper is not already deployed, we need to deploy it
    if (!gatekeeperData.alreadyDeployed) {
      gatekeeperAddress = await this.deployAndStore(
        config.gatekeeper.type as unknown as EContracts,
        config.gatekeeper.args ? Object.values(config.gatekeeper.args) : [],
        gatekeeperData.abi,
        gatekeeperData.bytecode,
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

    // 4. VkRegistry
    const vkRegistryAddress = await this.deployAndStore(
      EContracts.VkRegistry,
      [],
      VkRegistryFactory.abi,
      VkRegistryFactory.bytecode,
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

      const [qvProcessVk, qvTallyVk, nonQvProcessVk, nonQvTallyVk, pollJoiningVk, pollJoinedVk] = await Promise.all([
        extractVk(processMessagesZkeyPathQv.zkey),
        extractVk(tallyVotesZkeyPathQv.zkey),
        extractVk(processMessagesZkeyPathNonQv.zkey),
        extractVk(tallyVotesZkeyPathNonQv.zkey),
        extractVk(pollJoiningZkeyPath.zkey),
        extractVk(pollJoinedZkeyPath.zkey),
      ]).then((vks) =>
        vks.map(
          (vk: IVkObjectParams | "" | undefined) =>
            vk && (VerifyingKey.fromObj(vk).asContractParam() as IVerifyingKeyStruct),
        ),
      );

      const processZkeys = [qvProcessVk, nonQvProcessVk].filter(Boolean) as IVerifyingKeyStruct[];
      const tallyZkeys = [qvTallyVk, nonQvTallyVk].filter(Boolean) as IVerifyingKeyStruct[];

      // check if the keys are already set
      const [isProcessVkSet, isProcessNonQvVkSet, isTallyVkSet, isTallyNonQvVkSet] = await Promise.all([
        publicClient.readContract({
          address: vkRegistryAddress,
          abi: VkRegistryFactory.abi,
          functionName: "hasProcessVk",
          args: [
            config.VkRegistry.args.stateTreeDepth as bigint,
            config.VkRegistry.args.voteOptionTreeDepth as bigint,
            config.VkRegistry.args.messageBatchSize,
            EMode.QV,
          ],
        }),
        publicClient.readContract({
          address: vkRegistryAddress,
          abi: VkRegistryFactory.abi,
          functionName: "hasProcessVk",
          args: [
            config.VkRegistry.args.stateTreeDepth as bigint,
            config.VkRegistry.args.voteOptionTreeDepth as bigint,
            config.VkRegistry.args.messageBatchSize,
            EMode.NON_QV,
          ],
        }),
        publicClient.readContract({
          address: vkRegistryAddress,
          abi: VkRegistryFactory.abi,
          functionName: "hasTallyVk",
          args: [
            config.VkRegistry.args.stateTreeDepth as bigint,
            config.VkRegistry.args.intStateTreeDepth as bigint,
            config.VkRegistry.args.voteOptionTreeDepth as bigint,
            EMode.QV,
          ],
        }),
        publicClient.readContract({
          address: vkRegistryAddress,
          abi: VkRegistryFactory.abi,
          functionName: "hasTallyVk",
          args: [
            config.VkRegistry.args.stateTreeDepth as bigint,
            config.VkRegistry.args.intStateTreeDepth as bigint,
            config.VkRegistry.args.voteOptionTreeDepth as bigint,
            EMode.NON_QV,
          ],
        }),
      ]);

      if (isProcessVkSet && isProcessNonQvVkSet && isTallyVkSet && isTallyNonQvVkSet) {
        this.logger.debug("Verifying keys are already set on the vk registry");
      } else {
        await this.estimateGasAndSend(
          vkRegistryAddress,
          0n,
          VkRegistryFactory.abi,
          "setVerifyingKeysBatch",
          [
            config.VkRegistry.args.stateTreeDepth,
            config.VkRegistry.args.intStateTreeDepth,
            config.VkRegistry.args.voteOptionTreeDepth,
            config.VkRegistry.args.messageBatchSize,
            [EMode.QV, EMode.NON_QV],
            pollJoiningVk as IVerifyingKeyStruct,
            pollJoinedVk as IVerifyingKeyStruct,
            processZkeys,
            tallyZkeys,
          ],
          ErrorCodes.FAILED_TO_SET_VERIFYING_KEYS_ON_VK_REGISTRY.toString(),
          kernelClient,
          bundlerClient,
        );
      }
    } catch (error) {
      this.logger.error("Failed to set verifying keys on vk registry: ", error);
      throw error;
    }

    // 5. maci (here we don't check whether one is already deployed, we just deploy it)
    const emptyBallotRoots = genEmptyBallotRoots(config.MACI.stateTreeDepth);
    const maciAddress = await this.deployAndStore(
      EContracts.MACI,
      [
        pollFactoryAddress,
        messageProcessorFactoryAddress,
        tallyFactoryAddress,
        gatekeeperAddress,
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

    // set the gate on the gatekeeper
    await this.estimateGasAndSend(
      gatekeeperAddress as Hex,
      0n,
      gatekeeperData.abi,
      "setTarget",
      [maciAddress],
      ErrorCodes.FAILED_TO_SET_MACI_INSTANCE_ON_GATEKEEPER.toString(),
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

    // check if there is a vk registry deployed on this chain
    const vkRegistryAddress = this.storage.getAddress(EContracts.VkRegistry, chain);
    if (!vkRegistryAddress) {
      throw new Error(ErrorCodes.VK_REGISTRY_NOT_DEPLOYED.toString());
    }

    // check if gatekeeper address was given
    let gatekeeperAddress = config.gatekeeper.address;
    if (!gatekeeperAddress) {
      const gatekeeperData = this.getGatekeeperData(config.gatekeeper.type, chain, config.gatekeeper.args);
      gatekeeperAddress = gatekeeperData.address as Hex;
      // if the gatekeeper is not already deployed, we need to deploy it
      if (!gatekeeperData.alreadyDeployed) {
        gatekeeperAddress = await this.deployAndStore(
          config.gatekeeper.type as unknown as EContracts,
          config.gatekeeper.args ? Object.values(config.gatekeeper.args) : [],
          gatekeeperData.abi,
          gatekeeperData.bytecode,
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
      coordinatorPubKey: PubKey.deserialize(config.coordinatorPubkey),
      verifierContractAddress: verifierAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      mode,
      gatekeeperContractAddress: gatekeeperAddress,
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
        args: [verifierAddress, vkRegistryAddress, pollContractAddress, mode],
        network: chain,
      }),
      this.storage.register({
        id: EContracts.Tally,
        key: `poll-${pollId}`,
        contract: new BaseContract(tallyContractAddress, TallyFactory.abi),
        args: [verifierAddress, vkRegistryAddress, pollContractAddress, messageProcessorContractAddress, mode],
        network: chain,
      }),
    ]);

    return { pollId: pollId.toString() };
  }
}
