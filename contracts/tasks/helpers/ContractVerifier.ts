import type { IVerificationSubtaskArgs } from "./types";
import type { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";

/**
 * @notice Contract verifier allows to verify contract using hardhat-etherscan plugin.
 */
export class ContractVerifier {
  /**
   * Hardhat runtime environment
   */
  private hre: HardhatRuntimeEnvironment;

  /**
   * Initialize class properties
   *
   * @param hre - Hardhat runtime environment
   */
  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre;
  }

  /**
   * Verify contract through etherscan
   *
   * @param address - contract address
   * @param constructorArguments - stringified constructor arguments
   * @param libraries - stringified libraries which can't be detected automatically
   * @returns
   */
  async verify(address: string, constructorArguments: string, libraries?: string): Promise<[boolean, string]> {
    const params: IVerificationSubtaskArgs = {
      address,
      constructorArguments: JSON.parse(constructorArguments) as unknown[],
    };

    if (libraries) {
      params.libraries = JSON.parse(libraries) as Libraries;
    }

    // Run etherscan task
    const error = await this.hre
      .run("verify:verify", params)
      .then(() => "")
      .catch((err: Error) => {
        if (err.message === "Contract source code already verified") {
          return "";
        }

        return err.message;
      });

    return [!error, error];
  }
}
