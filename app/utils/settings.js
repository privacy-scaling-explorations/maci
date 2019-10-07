// @flow
const { getLatestDeployedAddress } = require('./helpers')

export type EnvType = "DEV" | "PROD";

export type ContractAddresses = {
    MACI_CONTRACT_ADDRESS: ?String,
    STATE_TREE_ADDRESS: ?String,
    RESULT_TREE_ADDRESS: ?String
};

export type Environment = {
    ENV_TYPE: EnvType,
    MACI_CONTRACT_ADDRESS: ?String,
    STATE_TREE_ADDRESS: ?String,
    RESULT_TREE_ADDRESS: ?String
};

const getContractAddresses = (): ContractAddresses => {
  // Development by default
  const envType: EnvType = process.env.ENV_TYPE || 'DEV'

  if (envType === 'DEV') {
    // If its development, just read from the compiled contract
    const maciContractDef = require('../contracts/MACI.json')
    const merkleTreeContractDef = require('../contracts/MerkleTree.json')
    const merkleTreeNetworkTimestamps = Object.keys(merkleTreeContractDef.networks)

    return {
      MACI_CONTRACT_ADDRESS: getLatestDeployedAddress(maciContractDef),
      STATE_TREE_ADDRESS: merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[1]].address,
      RESULT_TREE_ADDRESS: merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[0]].address
    }
  } else if (envType === 'PROD') {
    // Otherwise get addresses from the ENV Variables
    if (process.env.MACI_CONTRACT_ADDRESS === undefined ||
        process.env.STATE_TREE_ADDRESS === undefined ||
        process.env.RESULT_TREE_ADDRESS === undefined) {
      throw new Error('ENV_TYPE = PROD, however not all contract addresses are provided.')
    }

    return {
      MACI_CONTRACT_ADDRESS: process.env.MACI_CONTRACT_ADDRESS,
      STATE_TREE_ADDRESS: process.env.STATE_TREE_ADDRESS,
      RESULT_TREE_ADDRESS: process.env.RESULT_TREE_ADDRESS
    }
  }

  throw new Error('Environment variable ENV_TYPE is invalid')
}

module.exports = {
  getContractAddresses
}
