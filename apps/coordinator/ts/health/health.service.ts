import { EMode } from "@maci-protocol/sdk";
import { Injectable } from "@nestjs/common";
import { formatEther } from "ethers";
import { zeroAddress } from "viem";

import fs from "fs";
import path from "path";

import type { ICheckRapidsnark, ICheckWalletFunds, ICheckZkeysDirectory, IHealthCheckResponse } from "./types";

import { ESupportedNetworks, getSigner } from "../common";
import { FileService } from "../file/file.service";
import { RedisService } from "../redis/redis.service";

/**
 * Health service functions to check the status of the coordinator service.
 */
@Injectable()
export class HealthService {
  /**
   * Create a new instance of the HealthService.
   *
   * @param fileService - file service
   */
  constructor(
    private readonly fileService: FileService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Check if rapidsnark is available and executable.
   * @returns the rapidsnark executable path and its executability status
   */
  async checkRapidsnark(): Promise<ICheckRapidsnark> {
    const rapidsnarkExecutablePath = process.env.COORDINATOR_RAPIDSNARK_EXE || "";

    const [rapidsnarkIsAccessible, rapidsnarkIsExecutable] = await Promise.all([
      fs.promises
        // eslint-disable-next-line no-bitwise
        .access(rapidsnarkExecutablePath, fs.constants.F_OK | fs.constants.X_OK)
        .then(() => true)
        .catch(() => false),
      fs.promises
        // eslint-disable-next-line no-bitwise
        .stat(rapidsnarkExecutablePath)
        .then((stats) => stats.isFile())
        .catch(() => false),
    ]);

    return {
      rapidsnarkExecutablePath,
      rapidsnarkIsAccessible,
      rapidsnarkIsExecutable,
    };
  }

  /**
   * Check if zkeys directory exists
   * @returns the existence of the zkeys directory and the required zkeys
   */
  async checkZkeysDirectory(): Promise<ICheckZkeysDirectory> {
    const zkeysDirectoryPath = path.resolve(process.env.COORDINATOR_ZKEY_PATH!);
    const requiredZkeyNames = [
      {
        name: process.env.COORDINATOR_TALLY_ZKEY_NAME,
        modes: [EMode.QV, EMode.NON_QV],
      },
      {
        name: process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME,
        modes: [EMode.QV, EMode.NON_QV, EMode.FULL],
      },
      {
        name: process.env.COORDINATOR_POLL_JOINING_ZKEY_NAME,
      },
      {
        name: process.env.COORDINATOR_POLL_JOINED_ZKEY_NAME,
      },
    ];

    const zkeysDirectoryExists = await fs.promises
      .stat(zkeysDirectoryPath)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    const availableZkeys = requiredZkeyNames.reduce<ICheckZkeysDirectory["availableZkeys"]>((acc, { name, modes }) => {
      if (!modes) {
        try {
          acc[name!] = this.fileService.getZkeyFilePaths(name!);
        } catch (error) {
          acc[name!] = undefined;
        }

        return acc;
      }

      const modeEntries = modes.reduce<ICheckZkeysDirectory["availableZkeys"]>((modeAcc, mode) => {
        const pathname = `${name!}_Mode_${String(mode)}`;

        try {
          // eslint-disable-next-line no-param-reassign
          modeAcc[pathname] = this.fileService.getZkeyFilePaths(name!, mode);
        } catch (error) {
          // eslint-disable-next-line no-param-reassign
          modeAcc[pathname] = undefined;
        }

        return modeAcc;
      }, {});

      return { ...acc, ...modeEntries };
    }, {});

    return {
      zkeysDirectoryExists,
      availableZkeys,
    };
  }

  /**
   * Check if coordinator wallet has funds
   * @returns the address and its funds in all networks
   */
  async checkWalletFunds(): Promise<ICheckWalletFunds> {
    let address: string;
    const networks = Object.values(ESupportedNetworks);

    try {
      const signer = getSigner(networks[0]);
      address = await signer.getAddress();
    } catch (error) {
      return {
        address: zeroAddress,
        fundsInNetworks: [],
      };
    }

    const fundsInNetworks = await Promise.all(
      networks.map(async (network) => {
        const signer = getSigner(network);

        return signer.provider
          ?.getBalance(address)
          .then((balance) => ({
            network,
            balance: formatEther(balance),
            status: true,
          }))
          .catch(() => ({
            network,
            balance: formatEther(0n),
            status: false,
          }));
      }),
    );

    return {
      address,
      fundsInNetworks,
    };
  }

  /**
   * Check redis client is connected and open
   * @return true if the redis client is connected and open, false otherwise
   */
  checkRedisConnection(): boolean {
    return this.redisService.isOpen();
  }

  /**
   * Check coordinator service health
   * @returns an object containing the results of all the health checks
   */
  async checkCoordinatorHealth(): Promise<IHealthCheckResponse> {
    const [rapidsnark, zkeysDirectory, coordinatorWalletFunds] = await Promise.all([
      this.checkRapidsnark(),
      this.checkZkeysDirectory(),
      this.checkWalletFunds(),
    ]);
    const isRedisOpen = this.checkRedisConnection();

    return {
      rapidsnark,
      zkeysDirectory,
      coordinatorWalletFunds,
      isRedisOpen,
    };
  }
}
