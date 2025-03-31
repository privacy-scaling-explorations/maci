import { Keypair, PrivKey, PubKey } from "@maci-protocol/domainobjs";
import {
  Deployment,
  EContracts,
  ProofGenerator,
  type Poll,
  type MACI,
  type IGenerateProofsOptions,
  Poll__factory as PollFactory,
  MACI__factory as MACIFactory,
  Prover,
  VkRegistry,
  Verifier,
  MessageProcessor,
  Tally,
  getPoll,
  mergeSignups,
} from "@maci-protocol/sdk";
import { IProof, ITallyData } from "@maci-protocol/sdk";
import { Logger, Injectable } from "@nestjs/common";
import { ZeroAddress } from "ethers";
import hre from "hardhat";
import { Hex } from "viem";

import fs from "fs";
import path from "path";

import type { IGenerateArgs, IGenerateData, IMergeArgs, ISubmitProofsArgs } from "./types";

import { ErrorCodes } from "../common";
import { getPublicClient } from "../common/accountAbstraction";
import { CryptoService } from "../crypto/crypto.service";
import { FileService } from "../file/file.service";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

/**
 * ProofGeneratorService is responsible for generating message processing and tally proofs.
 */
@Injectable()
export class ProofGeneratorService {
  /**
   * Deployment helper
   */
  private readonly deployment: Deployment;

  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Proof generator initialization
   */
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly fileService: FileService,
    private readonly sessionKeysService: SessionKeysService,
  ) {
    this.deployment = Deployment.getInstance({ hre });
    this.deployment.setHre(hre);
    this.logger = new Logger(ProofGeneratorService.name);
  }

  /**
   * Read and parse proofs
   * @param folder - folder path to read proofs from
   * @param type - type of proofs to read (tally or process)
   * @returns proofs
   */
  async readProofs(folder: string, type: "tally" | "process"): Promise<IProof[]> {
    const files = await fs.promises.readdir(folder);
    return Promise.all(
      files
        .filter((f) => f.startsWith(`${type}_`) && f.endsWith(".json"))
        .sort()
        .map(async (file) =>
          fs.promises.readFile(`${folder}/${file}`, "utf8").then((result) => JSON.parse(result) as IProof),
        ),
    );
  }

  /**
   * Generate proofs for message processing and tally
   *
   * @param args - generate proofs arguments
   * @returns - generated proofs for message processing and tally
   */
  async generate(
    {
      poll,
      maciContractAddress,
      tallyContractAddress,
      useQuadraticVoting,
      encryptedCoordinatorPrivateKey,
      startBlock,
      endBlock,
      blocksPerBatch,
    }: IGenerateArgs,
    options?: IGenerateProofsOptions,
  ): Promise<IGenerateData> {
    try {
      const maciContract = await this.deployment.getContract<MACI>({
        name: EContracts.MACI,
        address: maciContractAddress,
      });
      const signer = await this.deployment.getDeployer();
      const pollData = await getPoll({
        maciAddress: maciContractAddress,
        pollId: poll,
        signer,
      });

      const pollContract = await this.deployment.getContract<Poll>({
        name: EContracts.Poll,
        address: pollData.address,
      });
      const [coordinatorPublicKey, isStateAqMerged] = await Promise.all([
        pollContract.coordinatorPubKey(),
        pollContract.stateMerged(),
      ]);

      if (!isStateAqMerged) {
        this.logger.error(`Error: ${ErrorCodes.NOT_MERGED_STATE_TREE}, state tree is not merged`);
        throw new Error(ErrorCodes.NOT_MERGED_STATE_TREE.toString());
      }

      const { privateKey } = await this.fileService.getPrivateKey();
      const maciPrivateKey = PrivKey.deserialize(
        this.cryptoService.decrypt(privateKey, encryptedCoordinatorPrivateKey),
      );
      const coordinatorKeypair = new Keypair(maciPrivateKey);
      const publicKey = new PubKey([
        BigInt(coordinatorPublicKey.x.toString()),
        BigInt(coordinatorPublicKey.y.toString()),
      ]);

      if (!coordinatorKeypair.pubKey.equals(publicKey)) {
        this.logger.error(`Error: ${ErrorCodes.PRIVATE_KEY_MISMATCH}, wrong private key`);
        throw new Error(ErrorCodes.PRIVATE_KEY_MISMATCH.toString());
      }

      const outputDir = path.resolve("./proofs");

      const maciState = await ProofGenerator.prepareState({
        maciContract,
        pollContract,
        maciPrivateKey,
        coordinatorKeypair,
        pollId: poll,
        signer,
        outputDir,
        options: {
          startBlock,
          endBlock,
          blocksPerBatch,
        },
      });

      const foundPoll = maciState.polls.get(BigInt(poll));

      if (!foundPoll) {
        this.logger.error(`Error: ${ErrorCodes.POLL_NOT_FOUND}, Poll ${poll} not found in maci state`);
        throw new Error(ErrorCodes.POLL_NOT_FOUND.toString());
      }

      const proofGenerator = new ProofGenerator({
        poll: foundPoll,
        maciContractAddress,
        tallyContractAddress,
        tally: this.fileService.getZkeyFilePaths(process.env.COORDINATOR_TALLY_ZKEY_NAME!, useQuadraticVoting),
        mp: this.fileService.getZkeyFilePaths(process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!, useQuadraticVoting),
        rapidsnark: process.env.COORDINATOR_RAPIDSNARK_EXE,
        outputDir,
        tallyOutputFile: path.resolve("./tally.json"),
        useQuadraticVoting,
      });

      const processProofs = await proofGenerator.generateMpProofs(options);
      const { proofs: tallyProofs, tallyData } = await proofGenerator.generateTallyProofs(
        hre.network.name,
        String(hre.network.config.chainId || 1),
        options,
      );

      return {
        processProofs,
        tallyProofs,
        tallyData,
      };
    } catch (error) {
      options?.onFail?.(error as Error);
      throw error;
    }
  }

  /**
   * Merge state and message trees
   *
   * @param args - merge arguments
   * @returns whether the proofs were successfully merged
   */
  async merge({ maciContractAddress, pollId, approval, sessionKeyAddress, chain }: IMergeArgs): Promise<boolean> {
    // get a kernel client
    const kernelClient = await this.sessionKeysService.generateClientFromSessionKey(sessionKeyAddress, approval, chain);
    const signer = await this.sessionKeysService.getKernelClientSigner(kernelClient);

    await mergeSignups({
      maciAddress: maciContractAddress,
      pollId: BigInt(pollId),
      signer,
    });

    return true;
  }

  /**
   * Submit proofs on-chain
   *
   * @param args - submit proofs on-chain arguments
   */
  async submit({ maciContractAddress, pollId, chain }: ISubmitProofsArgs): Promise<boolean> {
    const publicClient = getPublicClient(chain);

    // get the poll address
    const pollContracts = await publicClient.readContract({
      address: maciContractAddress as Hex,
      abi: MACIFactory.abi,
      functionName: "getPoll",
      args: [BigInt(pollId)],
    });

    const pollAddress = pollContracts.poll;
    if (pollAddress.toLowerCase() === ZeroAddress.toLowerCase()) {
      this.logger.error(`Error: ${ErrorCodes.POLL_NOT_FOUND}, Poll ${pollId} not found`);
      throw new Error(ErrorCodes.POLL_NOT_FOUND.toString());
    }

    // check if state tree has been merged
    const isStateMerged = await publicClient.readContract({
      address: pollAddress,
      abi: PollFactory.abi,
      functionName: "stateMerged",
    });
    if (!isStateMerged) {
      this.logger.error(`Error: ${ErrorCodes.NOT_MERGED_STATE_TREE}, state tree is not merged`);
      throw new Error(ErrorCodes.NOT_MERGED_STATE_TREE.toString());
    }

    const [maciContract, mpContract, pollContract, tallyContract, vkRegistryContract, verifierContract] =
      await Promise.all([
        this.deployment.getContract<MACI>({
          name: EContracts.MACI,
          address: maciContractAddress,
        }),
        this.deployment.getContract<MessageProcessor>({
          name: EContracts.MessageProcessor,
          address: pollContracts.messageProcessor,
        }),
        this.deployment.getContract<Poll>({
          name: EContracts.Poll,
          address: pollContracts.poll,
        }),
        this.deployment.getContract<Tally>({
          name: EContracts.Tally,
          address: pollContracts.tally,
        }),
        this.deployment.getContract<VkRegistry>({ name: EContracts.VkRegistry }),
        this.deployment.getContract<Verifier>({ name: EContracts.Verifier }),
      ]);
    const prover = new Prover({
      maciContract,
      mpContract,
      pollContract,
      tallyContract,
      vkRegistryContract,
      verifierContract,
    });

    const data = {
      processProofs: await this.readProofs(path.resolve("./proofs"), "process"),
      tallyProofs: await this.readProofs(path.resolve("./proofs"), "tally"),
    };
    // prove message processing
    await prover.proveMessageProcessing(data.processProofs);
    // read tally data
    const tallyData = await fs.promises
      .readFile("./tally.json", "utf8")
      .then((result) => JSON.parse(result) as unknown as ITallyData);
    // prove tally
    await prover.proveTally(data.tallyProofs);
    // submit results
    const voteOptions = Number(await pollContract.voteOptions());
    await prover.submitResults(tallyData, voteOptions);

    return true;
  }
}
