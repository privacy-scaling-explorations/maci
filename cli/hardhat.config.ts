/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import "@nomiclabs/hardhat-ethers";

import { DEFAULT_ETH_SK, DEFAULT_ETH_PROVIDER } from "./build/defaults";

const config = {
    defaultNetwork: "localhost",
    networks: {
        localhost: {
            url: process.env.ETH_PROVIDER || DEFAULT_ETH_PROVIDER,
            accounts: [process.env.ETH_SK || DEFAULT_ETH_SK],
            loggingEnabled: false,
        },
    },
    paths: {
        sources: "../contracts/contracts/",
        artifacts: "../contracts/artifacts",
    },
};

export default config;
