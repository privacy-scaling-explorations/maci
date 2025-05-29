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
   * @param contract - contract name
   * @param libraries - stringified libraries which can't be detected automatically
   * @param implementation - proxy implementation address
   * @returns
   */
  async verify(
    address: string,
    constructorArguments: string,
    contract?: string,
    libraries?: string,
    implementation?: string,
  ): Promise<[boolean, string]> {
    const params: IVerificationSubtaskArgs = {
      address,
      constructorArguments: JSON.parse(constructorArguments) as unknown[],
      contract,
    };

    if (libraries) {
      params.libraries = JSON.parse(libraries) as Libraries;
    }

    const { Etherscan } = await import("@nomicfoundation/hardhat-verify/etherscan");

    const customChain = this.hre.config.etherscan.customChains.find((chain) => chain.network === this.hre.network.name);
    const { apiKey } = this.hre.config.etherscan;

    const etherscanInstance = new Etherscan(
      typeof apiKey === "string" ? apiKey : apiKey[this.hre.network.name],
      `https://api.etherscan.io/v2/api?chainid=${this.hre.network.config.chainId}`,
      customChain?.urls.browserURL ?? "",
      this.hre.network.config.chainId,
    );

    // Run etherscan task
    const error = await this.hre
      .run("verify:verify", params)
      .then(() => "")
      .catch((err: Error) => {
        if (err.message.includes("already verified")) {
          return "";
        }

        return err.message;
      });

    const isEtherscanVerified = await etherscanInstance.isVerified(params.address);

    if (!isEtherscanVerified) {
      // eslint-disable-next-line no-console
      console.warn(`Contract is not verified ${params.address}\n`, error);
    }

    // Manually check if proxy is verified.
    // Etherscan api doesn't return verification status but it's available in etherscan ui.
    // This is related to clones because deployed bytecode is not available directly.
    const isVerified =
      implementation && !isEtherscanVerified && customChain
        ? await fetch(`${customChain.urls.browserURL}/address/${params.address}#code`)
            .then((response) => response.text())
            .then((text) => {
              const regex = new RegExp(`Minimal Proxy Contract.*?for\\s+<a[^>]*?>\\s*(${implementation})\\s*</a>`, "i");
              return regex.test(text);
            })
        : isEtherscanVerified;

    return isVerified ? [true, ""] : [!error, error];
  }
}
