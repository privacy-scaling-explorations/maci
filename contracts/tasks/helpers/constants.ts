export enum ESupportedChains {
  Sepolia = "sepolia",
  Goerli = "goerli",
  Mainnet = "mainnet",
  Coverage = "coverage",
  Hardhat = "hardhat",
  OptimismGoerli = "optimism_goerli",
  OptimismSepolia = "optimism_sepolia",
  Optimism = "optimism",
}

export enum EChainId {
  Hardhat = 31337,
  Goerli = 5,
  Sepolia = 11155111,
  Mainnet = 1,
  Coverage = 1337,
  OptimismGoerli = 420,
  OptimismSepolia = 11155420,
  Optimism = 10,
}

const GWEI = 1e9;

const gasPrice = (value: number) => value * GWEI;

export const NETWORKS_DEFAULT_GAS: Record<ESupportedChains, number | "auto"> = {
  [ESupportedChains.Sepolia]: gasPrice(2),
  [ESupportedChains.Goerli]: gasPrice(2),
  [ESupportedChains.Mainnet]: gasPrice(2),
  [ESupportedChains.Coverage]: gasPrice(2),
  [ESupportedChains.Hardhat]: gasPrice(2),
  [ESupportedChains.OptimismGoerli]: "auto",
  [ESupportedChains.OptimismSepolia]: "auto",
  [ESupportedChains.Optimism]: "auto",
};

export const getNetworkRpcUrls = (): Record<ESupportedChains, string> => {
  const INFURA_KEY = process.env.INFURA_KEY ?? "";

  return {
    [ESupportedChains.Sepolia]: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.Goerli]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.Mainnet]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.Coverage]: "http://localhost:8555",
    [ESupportedChains.Hardhat]: "http://localhost:8545",
    [ESupportedChains.OptimismGoerli]: `https://optimism-goerli.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.OptimismSepolia]: `https://optimism-sepolia.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.Optimism]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
  };
};
