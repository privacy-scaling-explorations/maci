import type { IVerificationSubtaskArgs } from "./types";
import type { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";

export class ContractVerifier {
  private hre: HardhatRuntimeEnvironment;

  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre;
  }

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
