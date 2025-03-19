import { PubKey } from "@maci-protocol/domainobjs";
import {
  ContractStorage,
  EPolicies,
  Verifier__factory as VerifierFactory,
  VkRegistry__factory as VkRegistryFactory,
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
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpPolicy,
  deployAnonAadhaarPolicy,
  deploySignupTokenPolicy,
  deployMerkleProofPolicy,
  deploySemaphoreSignupPolicy,
  deployZupassSignUpPolicy,
  deployGitcoinPassportPolicy,
  deployEASSignUpPolicy,
  deployHatsSignupPolicy,
  BasePolicy,
  deployMaci,
  setVerifyingKeys,
  deployVkRegistryContract,
  ConstantInitialVoiceCreditProxy,
  genEmptyBallotRoots,
} from "@maci-protocol/sdk";
import { Injectable } from "@nestjs/common";
import { BaseContract, Signer } from "ethers";
import { type Hex } from "viem";

import path from "path";

import { ErrorCodes, ESupportedNetworks } from "../common";
import { FileService } from "../file/file.service";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

import {
  IDeployMaciArgs,
  IDeployPollArgs,
  IPolicyArgs,
  IInitialVoiceCreditProxyArgs,
  IVkRegistryArgs,
  IAnonAadhaarPolicyArgs,
  IEASPolicyArgs,
  IGitcoinPassportPolicyArgs,
  IHatsPolicyArgs,
  IZupassPolicyArgs,
  ISemaphorePolicyArgs,
  IMerkleProofPolicyArgs,
  ISignUpPolicyArgs,
} from "./types";

/**
 * DeployerService is responsible for deploying contracts.
 */
@Injectable()
export class DeployerService {
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
    this.storage = ContractStorage.getInstance(path.join(process.cwd(), "deployed-contracts.json"));
  }

  /**
   * Get the policy contract object
   * always deploy and save it
   *
   * @param signer - the signer
   * @param policyType - the policy type
   * @param network - the network
   * @param args - the policy args
   * @returns - the policy contract
   */
  async deployAndSavePolicy(
    signer: Signer,
    policyType: EPolicies,
    network: ESupportedNetworks,
    args?: IPolicyArgs,
  ): Promise<BasePolicy> {
    let contract: BasePolicy;

    // based on the policy type, we need to deploy the correct policy
    switch (policyType) {
      case EPolicies.FreeForAll: {
        [contract] = await deployFreeForAllSignUpPolicy(signer, true);
        break;
      }
      case EPolicies.EAS: {
        [contract] = await deployEASSignUpPolicy(
          {
            eas: (args as IEASPolicyArgs).easAddress,
            attester: (args as IEASPolicyArgs).attester,
            schema: (args as IEASPolicyArgs).schema,
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.GitcoinPassport: {
        [contract] = await deployGitcoinPassportPolicy(
          {
            decoderAddress: (args as IGitcoinPassportPolicyArgs).decoderAddress,
            minimumScore: Number((args as IGitcoinPassportPolicyArgs).passingScore),
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.Hats: {
        [contract] = await deployHatsSignupPolicy(
          {
            hats: (args as IHatsPolicyArgs).hatsProtocolAddress,
            criterionHats: (args as IHatsPolicyArgs).critrionHats.map((c) => BigInt(c)),
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.Zupass: {
        [contract] = await deployZupassSignUpPolicy(
          {
            eventId: (args as IZupassPolicyArgs).eventId,
            signer1: (args as IZupassPolicyArgs).signer1,
            signer2: (args as IZupassPolicyArgs).signer2,
            verifier: (args as IZupassPolicyArgs).zupassVerifier,
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.Semaphore: {
        [contract] = await deploySemaphoreSignupPolicy(
          {
            semaphore: (args as ISemaphorePolicyArgs).semaphoreContract,
            groupId: BigInt((args as ISemaphorePolicyArgs).groupId),
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.MerkleProof: {
        [contract] = await deployMerkleProofPolicy(
          {
            root: (args as IMerkleProofPolicyArgs).root,
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.Token: {
        [contract] = await deploySignupTokenPolicy(
          {
            token: (args as ISignUpPolicyArgs).token,
          },
          signer,
          true,
        );
        break;
      }
      case EPolicies.AnonAadhaar: {
        [contract] = await deployAnonAadhaarPolicy(
          {
            verifierAddress: (args as IAnonAadhaarPolicyArgs).verifier,
            nullifierSeed: (args as IAnonAadhaarPolicyArgs).nullifierSeed,
          },
          signer,
          true,
        );
        break;
      }

      default:
        throw new Error(ErrorCodes.UNSUPPORTED_POLICY.toString());
    }

    await this.storage.register({
      id: policyType,
      contract,
      args: args ? Object.values(args).map((arg) => String(arg)) : [],
      network,
    });

    return contract;
  }

  /**
   * Get the voice credit proxy contract object
   * always deploy and save it
   *
   * @param signer - the signer
   * @param voiceCreditProxyType - the voice credit proxy type
   * @param network - the network
   * @param args - the args
   * @returns - the voice credit proxy contract
   */
  async deployAndSaveVoiceCreditProxy(
    signer: Signer,
    voiceCreditProxyType: EInitialVoiceCreditProxies,
    network: ESupportedNetworks,
    args?: IInitialVoiceCreditProxyArgs,
  ): Promise<ConstantInitialVoiceCreditProxy> {
    let contract: ConstantInitialVoiceCreditProxy;

    switch (voiceCreditProxyType) {
      case EInitialVoiceCreditProxies.Constant: {
        [contract] = await deployConstantInitialVoiceCreditProxy(
          {
            amount: args!.amount,
          },
          signer,
          undefined,
          true,
        );
        break;
      }
      default:
        throw new Error(ErrorCodes.UNSUPPORTED_VOICE_CREDIT_PROXY.toString());
    }

    await this.storage.register({
      id: voiceCreditProxyType,
      contract,
      args: args ? Object.values(args).map((arg) => String(arg)) : [],
      network,
    });

    return contract;
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
    vkRegistryAddress: Hex,
    vkRegistryArgs: IVkRegistryArgs,
  ): Promise<ISetVerifyingKeysArgs> {
    const pollJoiningZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINING_ZKEY_NAME!,
      true,
    ).zkey;
    const pollJoinedZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINED_ZKEY_NAME!,
      true,
    ).zkey;
    const processMessagesQVZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
      true,
    ).zkey;
    const tallyVotesQVZkeyPath = this.fileService.getZkeyFilePaths(process.env.COORDINATOR_TALLY_ZKEY_NAME!, true).zkey;
    const processMessagesNONQVZkeyPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
      false,
    ).zkey;
    const tallyVotesZkeyNONQVPath = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_TALLY_ZKEY_NAME!,
      false,
    ).zkey;
    const {
      pollJoiningVk,
      pollJoinedVk,
      processVk: processQVVk,
      tallyVk: tallyQVVk,
    } = await extractAllVks({
      pollJoiningZkeyPath,
      pollJoinedZkeyPath,
      processMessagesZkeyPath: processMessagesQVZkeyPath,
      tallyVotesZkeyPath: tallyVotesQVZkeyPath,
    });
    const { processVk: processNOQVVk, tallyVk: tallyNOQVVk } = await extractAllVks({
      pollJoiningZkeyPath,
      pollJoinedZkeyPath,
      processMessagesZkeyPath: processMessagesNONQVZkeyPath,
      tallyVotesZkeyPath: tallyVotesZkeyNONQVPath,
    });
    const { stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, messageBatchSize } = vkRegistryArgs;
    return {
      pollJoiningVk: pollJoiningVk!,
      pollJoinedVk: pollJoinedVk!,
      processMessagesVks: [processQVVk!, processNOQVVk!],
      tallyVotesVks: [tallyQVVk!, tallyNOQVVk!],
      stateTreeDepth: Number(stateTreeDepth),
      intStateTreeDepth: Number(intStateTreeDepth),
      voteOptionTreeDepth: Number(voteOptionTreeDepth),
      messageBatchSize: Number(messageBatchSize),
      signer,
      modes: [EMode.QV, EMode.NON_QV],
      vkRegistryAddress,
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
    const kernelClient = await this.sessionKeysService.generateClientFromSessionKey(sessionKeyAddress, approval, chain);
    const signer = await this.sessionKeysService.getKernelClientSigner(kernelClient);

    const policyContract = await this.deployAndSavePolicy(signer, config.policy.type, chain, config.policy.args);
    const policyAddress = await policyContract.getAddress();

    const verifierFactory = new VerifierFactory(signer);
    const verifierContract = await verifierFactory.deploy();

    const vkRegistryAddress = await deployVkRegistryContract({ signer });

    const verifyingKeysArgs = await this.getVerifyingKeysArgs(signer, vkRegistryAddress as Hex, config.VkRegistry.args);
    await setVerifyingKeys(verifyingKeysArgs);

    // deploy the smart contracts
    const maciAddresses = await deployMaci({
      ...{
        stateTreeDepth: config.MACI.stateTreeDepth,
      },
      signer,
      signupPolicyAddress: policyAddress,
    });

    // store the contracts
    await Promise.all([
      this.storage.register({
        id: EContracts.Verifier,
        contract: verifierContract,
        network: chain,
      }),
      this.storage.register({
        id: EContracts.VkRegistry,
        contract: new BaseContract(vkRegistryAddress, VkRegistryFactory.abi),
        network: chain,
      }),
      this.storage.register({
        id: EContracts.MACI,
        contract: new BaseContract(maciAddresses.maciContractAddress, MACIFactory.abi),
        args: [
          maciAddresses.pollFactoryContractAddress,
          maciAddresses.messageProcessorFactoryContractAddress,
          maciAddresses.tallyFactoryContractAddress,
          policyAddress,
          config.MACI.stateTreeDepth,
          genEmptyBallotRoots(config.MACI.stateTreeDepth).map((root) => root.toString()),
        ],
        network: chain,
      }),
    ]);

    return { address: maciAddresses.maciContractAddress };
  }

  /**
   * Deploy a poll
   *
   * @param args - deploy poll dto
   * @returns poll id
   */
  async deployPoll({ approval, sessionKeyAddress, chain, config }: IDeployPollArgs): Promise<{ pollId: string }> {
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

    // check if policy address was given
    let policyAddress = config.policy.address;
    if (!policyAddress) {
      const policyContract = await this.deployAndSavePolicy(signer, config.policy.type, chain, config.policy.args);
      policyAddress = (await policyContract.getAddress()) as Hex;
    }

    // check if initial voice credit proxy address was given
    let initialVoiceCreditProxyAddress = config.initialVoiceCreditsProxy.address;
    if (!initialVoiceCreditProxyAddress) {
      const initialVoiceCreditProxyContract = await this.deployAndSaveVoiceCreditProxy(
        signer,
        config.initialVoiceCreditsProxy.type,
        chain,
        config.initialVoiceCreditsProxy.args,
      );
      initialVoiceCreditProxyAddress = (await initialVoiceCreditProxyContract.getAddress()) as Hex;
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
          deployPollArgs.pollStartTimestamp,
          deployPollArgs.pollEndTimestamp,
          {
            intStateTreeDepth: deployPollArgs.intStateTreeDepth,
            voteOptionTreeDepth: deployPollArgs.intStateTreeDepth,
          },
          deployPollArgs.messageBatchSize,
          deployPollArgs.coordinatorPubKey.asContractParam(),
          extContracts,
          emptyBallotRoot.toString(),
          pollId.toString(),
          deployPollArgs.relayers,
          deployPollArgs.voteOptions,
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
