import { Injectable, Logger } from "@nestjs/common";

import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import type { IDeploySubgraphArgs, IDeploySubgraphReturn } from "./types";

import { ErrorCodes, ESupportedNetworks } from "../common";

const execFile = promisify(childProcess.execFile);

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * SubgraphService is responsible for deploying subgraph.
 */
@Injectable()
export class SubgraphService {
  /**
   * Logger
   */
  private readonly logger = new Logger(SubgraphService.name);

  /**
   * Generate proofs for message processing and tally
   *
   * @param args - deploy subgraph arguments
   * @returns - deployed subgraph url
   * @throws error if deploy is not successful
   */
  async deploy(args: IDeploySubgraphArgs): Promise<IDeploySubgraphReturn> {
    try {
      if (!Object.values(ESupportedNetworks).includes(args.network)) {
        throw new Error("Invalid network");
      }

      const subgraphManifestPath = path.resolve(process.env.SUBGRAPH_FOLDER!, "subgraph.yaml");

      await execFile("cp", [
        path.resolve(process.env.SUBGRAPH_FOLDER!, "schemas/schema.v1.graphql"),
        path.resolve(process.env.SUBGRAPH_FOLDER!, "schema.graphql"),
      ]);

      await fs.promises.writeFile(
        path.resolve(process.env.SUBGRAPH_FOLDER!, `config/${args.network}.json`),
        `${JSON.stringify(
          {
            network: args.network,
            maciContractAddress: args.maciContractAddress,
            maciContractStartBlock: args.startBlock,
          },
          null,
          2,
        )}\n`,
        { flag: "w+" },
      );

      const mustacheOutput = await execFile("mustache", [
        path.resolve(process.env.SUBGRAPH_FOLDER!, `config/${args.network}.json`),
        path.resolve(process.env.SUBGRAPH_FOLDER!, "templates/subgraph.template.yaml"),
      ]);
      await fs.promises.writeFile(subgraphManifestPath, mustacheOutput.stdout, { flag: "w+" });

      await execFile("graph", [
        "codegen",
        subgraphManifestPath,
        "--output-dir",
        path.resolve(process.env.SUBGRAPH_FOLDER!, "generated"),
      ]);
      await execFile("graph", [
        "build",
        subgraphManifestPath,
        "--output-dir",
        path.resolve(process.env.SUBGRAPH_FOLDER!, "build"),
      ]);

      const deployOutput = await execFile("graph", [
        "deploy",
        process.env.SUBGRAPH_NAME!,
        subgraphManifestPath,
        "--node",
        process.env.SUBGRAPH_PROVIDER_URL!,
        "--deploy-key",
        process.env.SUBGRAPH_DEPLOY_KEY!,
        "--version-label",
        args.tag,
      ]);
      this.logger.log(deployOutput.stdout);

      const url = deployOutput.stdout.match(URL_REGEX)?.[1]?.trim().replace("\u001b[0m", "");

      if (!url) {
        throw new Error(ErrorCodes.SUBGRAPH_DEPLOY);
      }

      return { url };
    } catch (error) {
      this.logger.error("Error: ", error);
      throw new Error(ErrorCodes.SUBGRAPH_DEPLOY);
    }
  }
}
