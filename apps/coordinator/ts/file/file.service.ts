import { EMode } from "@maci-protocol/sdk";
import { Injectable, Logger } from "@nestjs/common";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import fs from "fs";
import path from "path";

import type { IGetPrivateKeyData, IGetPublicKeyData, IGetZkeyFilePathsData } from "./types";
import type { Hex } from "viem";

import { ErrorCodes } from "../common";

/**
 * Internal storage structure type.
 * named: keys can be queried by name
 */
type TStorage = Record<string, Hex>;

/**
 * FileService is responsible for working with local files like:
 * 1. RSA public/private keys
 * 2. Zkey files
 */
@Injectable()
export class FileService {
  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Json file database instance
   */
  private db: low.LowdbSync<TStorage>;

  /**
   * Initialize service
   */
  constructor() {
    this.logger = new Logger(FileService.name);
    this.db = low(new FileSync<TStorage>(path.resolve(process.cwd(), "./session-keys.json")));
  }

  /**
   * Store session key
   *
   * @param sessionKey - session key
   * @param address - key address
   */
  storeSessionKey(sessionKey: Hex, address: string): void {
    this.db.set(address, sessionKey).write();
  }

  /**
   * Delete session key
   *
   * @param address - key address
   */
  deleteSessionKey(address: string): void {
    this.db.unset(address).write();
  }

  /**
   * Get session key
   *
   * @param address - key name
   * @returns session key
   */
  getSessionKey(address: string): Hex | undefined {
    const sessionkey: Hex | undefined = this.db.get(address).value();
    return sessionkey;
  }

  /**
   * Get RSA private key for coordinator service
   *
   * @returns serialized RSA public key
   */
  async getPublicKey(): Promise<IGetPublicKeyData> {
    const publicKey = await fs.promises.readFile(path.resolve(process.env.COORDINATOR_PUBLIC_KEY_PATH!));

    return { publicKey: publicKey.toString() };
  }

  /**
   * Get RSA private key for coordinator service
   *
   * @returns serialized RSA private key
   */
  async getPrivateKey(): Promise<IGetPrivateKeyData> {
    const privateKey = await fs.promises.readFile(path.resolve(process.env.COORDINATOR_PRIVATE_KEY_PATH!));

    return { privateKey: privateKey.toString() };
  }

  /**
   * Get zkey, wasm and witness generator filepaths for zkey set
   *
   * @param name - zkey set name
   * @param mode - voting mode
   * @returns zkey and wasm filepaths
   */
  getZkeyFilePaths(name: string, mode?: EMode): IGetZkeyFilePathsData {
    const root = path.resolve(process.env.COORDINATOR_ZKEY_PATH!);
    const index = name.indexOf("_");
    const type = name.slice(0, index);
    const params = name.slice(index + 1);

    const modePrefixes = {
      [EMode.QV]: "Qv",
      [EMode.NON_QV]: "NonQv",
      [EMode.FULL]: "Full",
    };

    const filename = `${type}${mode === undefined ? "" : modePrefixes[mode]}_${params}`;

    const zkey = path.resolve(root, `${filename}/${filename}.0.zkey`);
    const wasm = path.resolve(root, `${filename}/${filename}_js/${filename}.wasm`);
    const witnessGenerator = path.resolve(root, `${filename}/${filename}_cpp/${filename}`);

    if (!fs.existsSync(zkey) || (!fs.existsSync(wasm) && !fs.existsSync(witnessGenerator))) {
      this.logger.error(
        `Error: ${ErrorCodes.FILE_NOT_FOUND}, zkey: ${zkey}, wasm: ${wasm}, witnessGenerator: ${witnessGenerator}`,
      );
      throw new Error(ErrorCodes.FILE_NOT_FOUND.toString());
    }

    return {
      zkey,
      wasm,
      witnessGenerator,
    };
  }
}
