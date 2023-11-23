/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-ethers");
require("hardhat-artifactor");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
    solidity: {
        version: "0.8.10",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            accounts: {
                mnemonic:
                    "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
            },
            loggingEnabled: false,
            allowUnlimitedContractSize: true,
        },
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    paths: {
        tests: "./tests",
        artifacts: "./artifacts",
    },
};
