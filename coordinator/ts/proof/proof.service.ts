import { Logger, Injectable } from "@nestjs/common";
import { ZeroAddress } from "ethers";
import hre from "hardhat";
import {
  Deployment,
  EContracts,
  ProofGenerator,
  type Poll,
  type MACI,
  type AccQueue,
  type IGenerateProofsOptions,
} from "maci-contracts";
import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import path from "path";

import type { IGenerateArgs, IGenerateData } from "./types";

import { ErrorCodes } from "../common";
import { CryptoService } from "../crypto/crypto.service";
import { FileService } from "../file/file.service";

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
  ) {
    this.deployment = Deployment.getInstance(hre);
    this.deployment.setHre(hre);
    this.fileService = fileService;
    this.logger = new Logger(ProofGeneratorService.name);
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

      const [signer, pollContracts] = await Promise.all([this.deployment.getDeployer(), maciContract.polls(poll)]);

      if (pollContracts.poll.toLowerCase() === ZeroAddress.toLowerCase()) {
        this.logger.error(`Error: ${ErrorCodes.POLL_NOT_FOUND}, Poll ${poll} not found`);
        throw new Error(ErrorCodes.POLL_NOT_FOUND);
      }

      const pollContract = await this.deployment.getContract<Poll>({
        name: EContracts.Poll,
        address: pollContracts.poll,
      });
      const [{ messageAq: messageAqAddress }, coordinatorPublicKey, isStateAqMerged, messageTreeDepth] =
        await Promise.all([
          pollContract.extContracts(),
          pollContract.coordinatorPubKey(),
          pollContract.stateMerged(),
          pollContract.treeDepths().then((depths) => Number(depths[2])),
        ]);
      const messageAq = await this.deployment.getContract<AccQueue>({
        name: EContracts.AccQueue,
        address: messageAqAddress,
      });

      if (!isStateAqMerged) {
        this.logger.error(`Error: ${ErrorCodes.NOT_MERGED_STATE_TREE}, state tree is not merged`);
        throw new Error(ErrorCodes.NOT_MERGED_STATE_TREE);
      }

      const mainRoot = await messageAq.getMainRoot(messageTreeDepth.toString());

      if (mainRoot.toString() === "0") {
        this.logger.error(`Error: ${ErrorCodes.NOT_MERGED_MESSAGE_TREE}, message tree is not merged`);
        throw new Error(ErrorCodes.NOT_MERGED_MESSAGE_TREE);
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
        throw new Error(ErrorCodes.PRIVATE_KEY_MISMATCH);
      }

      const outputDir = path.resolve("./proofs");

      const maciState = await ProofGenerator.prepareState({
        maciContract,
        pollContract,
        messageAq,
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
        throw new Error(ErrorCodes.POLL_NOT_FOUND);
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
      const { proofs: tallyProofs, tallyData } = await proofGenerator.generateTallyProofs(hre.network, options);

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
}
