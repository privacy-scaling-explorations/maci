// @flow
const { getLatestDeployedAddress } = require('./helpers')

export type EnvType = "DEV" | "PROD";

export type ContractAddresses = {
    MACI_CONTRACT_ADDRESS: ?String,
    STATE_TREE_ADDRESS: ?String,
    RESULT_TREE_ADDRESS: ?String
};

export type DbCredentials = {
    DB_USER: String,
    DB_PASSWORD: String,
    DB_HOST: String,
    DB_PORT: Number
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

const getDbCredentials = (): DbCredentials => {
  // Development by default
  const envType: EnvType = process.env.ENV_TYPE || 'DEV'

  const DB_USER = process.env.ENV_TYPE
  const DB_PASSWORD = process.env.DB_PASSWORD
  const DB_HOST = process.env.DB_HOST
  const DB_PORT = process.env.DB_PORT

  if (envType === 'DEV') {
    return {
      DB_USER: DB_USER || 'maci',
      DB_PASSWORD: DB_PASSWORD || 'maci',
      DB_HOST: DB_HOST || '127.0.0.1',
      DB_PORT: DB_PORT || 5432
    }
  } else if (envType === 'PROD') {
    // Otherwise get addresses from the ENV Variables
    if (DB_USER === undefined ||
        DB_PASSWORD === undefined ||
        DB_HOST === undefined ||
        DB_PORT === undefined) {
      throw new Error('ENV_TYPE = PROD, however not all contract addresses are provided.')
    }

    return {
      DB_USER: DB_USER,
      DB_PASSWORD: DB_PASSWORD,
      DB_HOST: DB_HOST,
      DB_PORT: DB_PORT
    }
  }

  throw new Error('Environment variable ENV_TYPE is invalid')
}

module.exports = {
  getContractAddresses,
  getDbCredentials
}
