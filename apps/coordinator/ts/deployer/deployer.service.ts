import { deployVerifier } from "@maci-protocol/contracts";
import { PublicKey } from "@maci-protocol/domainobjs";
import {
  ContractStorage,
  EPolicies,
  VerifyingKeysRegistry__factory as VerifyingKeysRegistryFactory,
  MessageProcessor__factory as MessageProcessorFactory,
  Tally__factory as TallyFactory,
  Poll__factory as PollFactory,
  MACI__factory as MACIFactory,
  EContracts,
  EInitialVoiceCreditProxies,
  EMode,
  deployPoll,
  ISetVerifyingKeysArgs,
  extractAllVerifyingKeys,
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpPolicy,
  deployERC20VotesPolicy,
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
  deployVerifyingKeysRegistryContract,
  ConstantInitialVoiceCreditProxy,
  generateEmptyBallotRoots,
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
  IAnonAadhaarPolicyArgs,
  IEASPolicyArgs,
  IGitcoinPassportPolicyArgs,
  IHatsPolicyArgs,
  IZupassPolicyArgs,
  ISemaphorePolicyArgs,
  IMerkleProofPolicyArgs,
  ITokenPolicyArgs,
  IERC20VotesPolicyArgs,
  IVerifyingKeysRegistryArgs,
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
        [contract] = await deployFreeForAllSignUpPolicy({}, signer, true);
        break;
      }
      case EPolicies.EAS: {
        [contract] = await deployEASSignUpPolicy(
          {
            eas: (args as IEASPolicyArgs).easAddress,
            attester: (args as IEASPolicyArgs).attester,
            schema: (args as IEASPolicyArgs).schema,
          },
          {},
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
          {},
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
          {},
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
          {},
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
          {},
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
          {},
          signer,
          true,
        );
        break;
      }
      case EPolicies.Token: {
        [contract] = await deploySignupTokenPolicy(
          {
            token: (args as ITokenPolicyArgs).token,
          },
          {},
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
          {},
          signer,
          true,
        );
        break;
      }
      case EPolicies.ERC20Votes: {
        [contract] = await deployERC20VotesPolicy(
          {
            snapshotBlock: BigInt((args as IERC20VotesPolicyArgs).snapshotBlock),
            threshold: BigInt((args as IERC20VotesPolicyArgs).threshold),
            token: (args as IERC20VotesPolicyArgs).token,
          },
          {},
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
   * @param verifyingKeysRegistryContract - the deployed verifyingKey registry contract
   * @param verifyingKeysRegistryArgs - the arguments send to the endpoint
   * @param mode - use QV or NON_QV
   * @returns SetVerifyingKeysArgs
   */
  async getVerifyingKeysArgs(
    signer: Signer,
    verifyingKeysRegistryAddress: Hex,
    verifyingKeysRegistryArgs: IVerifyingKeysRegistryArgs,
    mode: EMode,
  ): Promise<ISetVerifyingKeysArgs> {
    const { zkey: pollJoiningZkeyPath } = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINING_ZKEY_NAME!,
      EMode.QV,
    );
    const { zkey: pollJoinedZkeyPath } = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_POLL_JOINED_ZKEY_NAME!,
      EMode.QV,
    );
    const { zkey: processMessagesZkeyPath } = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!,
      mode,
    );
    const { zkey: tallyVotesZkeyPath } = this.fileService.getZkeyFilePaths(
      process.env.COORDINATOR_TALLY_ZKEY_NAME!,
      mode,
    );

    const { pollJoiningVerifyingKey, pollJoinedVerifyingKey, processVerifyingKey, tallyVerifyingKey } =
      await extractAllVerifyingKeys({
        pollJoiningZkeyPath,
        pollJoinedZkeyPath,
        processMessagesZkeyPath,
        tallyVotesZkeyPath,
      });

    const { stateTreeDepth, pollStateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, messageBatchSize } =
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
      verifyingKeysRegistryAddress,
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
    const signer = await this.sessionKeysService.getCoordinatorSigner(chain, sessionKeyAddress, approval);

    const policyContract = await this.deployAndSavePolicy(signer, config.policy.type, chain, config.policy.args);
    const policyAddress = await policyContract.getAddress();

    const verifierContract = await deployVerifier(signer, true);

    const verifyingKeysRegistryAddress = await deployVerifyingKeysRegistryContract({ signer });

    const verifyingKeysArgs = await this.getVerifyingKeysArgs(
      signer,
      verifyingKeysRegistryAddress as Hex,
      config.VerifyingKeysRegistry.args,
      EMode.QV,
    );
    await setVerifyingKeys(verifyingKeysArgs);

    // deploy the smart contracts
    const maciAddresses = await deployMaci({
      stateTreeDepth: config.MACI.stateTreeDepth,
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
        id: EContracts.VerifyingKeysRegistry,
        contract: new BaseContract(verifyingKeysRegistryAddress, VerifyingKeysRegistryFactory.abi),
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
          generateEmptyBallotRoots(config.MACI.stateTreeDepth).map((root) => root.toString()),
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
    const signer = await this.sessionKeysService.getCoordinatorSigner(chain, sessionKeyAddress, approval);

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
      mode: config.mode,
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

    // store to storage
    await Promise.all([
      this.storage.register({
        id: EContracts.Poll,
        key: `poll-${pollId}`,
        contract: poll,
        // clones do not have args for verification
        args: [],
        network: chain,
      }),
      this.storage.register({
        id: EContracts.MessageProcessor,
        key: `poll-${pollId}`,
        contract: MessageProcessorFactory.connect(messageProcessorContractAddress, signer),
        // clones do not have args for verification
        args: [],
        network: chain,
      }),
      this.storage.register({
        id: EContracts.Tally,
        key: `poll-${pollId}`,
        contract: TallyFactory.connect(tallyContractAddress, signer),
        // clones do not have args for verification
        args: [],
        network: chain,
      }),
    ]);

    return { pollId: pollId.toString() };
  }
}
