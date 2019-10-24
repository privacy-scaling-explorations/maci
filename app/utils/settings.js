// @flow
export type EnvType = "TEST" | "DEV" | "PROD";

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

export type RedisCredentials = {
    REDIS_HOST: String,
    REDIS_PORT: String,
    REDIS_PASSWORD: String
};

const getContractAddresses = (): ContractAddresses => {
  // Development by default
  const envType: EnvType = process.env.ENV_TYPE || 'DEV'

  if (envType === 'DEV' || envType === 'TEST') {
    // If its development, just read from the compiled contract
    const deployedAddresses = require('../contracts/DeployedAddresses.json')

    return {
      MACI_CONTRACT_ADDRESS: deployedAddresses.maciAddress,
      STATE_TREE_ADDRESS: deployedAddresses.stateTreeAddress,
      RESULT_TREE_ADDRESS: deployedAddresses.resultsTreeAddress
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

  const DB_USER = process.env.DB_USER
  const DB_PASSWORD = process.env.DB_PASSWORD
  const DB_HOST = process.env.DB_HOST
  const DB_PORT = process.env.DB_PORT
  const DB_NAME = process.env.DB_NAME

  if (envType === 'DEV' || envType === 'TEST') {
    return {
      DB_USER: DB_USER || 'maci',
      DB_PASSWORD: DB_PASSWORD || 'maci',
      DB_HOST: DB_HOST || '127.0.0.1',
      DB_PORT: DB_PORT || 5432,
      DB_NAME: DB_NAME || 'maci'
    }
  } else if (envType === 'PROD') {
    // Otherwise get addresses from the ENV Variables
    if (DB_USER === undefined ||
        DB_PASSWORD === undefined ||
        DB_HOST === undefined ||
        DB_PORT === undefined ||
        DB_NAME === undefined) {
      throw new Error('ENV_TYPE = PROD, however not all database credentials are provided.')
    }

    return {
      DB_USER,
      DB_PASSWORD,
      DB_HOST,
      DB_PORT,
      DB_NAME
    }
  }

  throw new Error('Environment variable ENV_TYPE is invalid')
}

const getRedisCredentials = (): RedisCredentials => {
  const envType: EnvType = process.env.ENV_TYPE || 'DEV'

  const REDIS_HOST = process.env.REDIS_HOST
  const REDIS_PORT = process.env.REDIS_PORT
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD

  if (envType === 'DEV' || envType === 'TEST') {
    return {
      REDIS_HOST: REDIS_HOST || '127.0.0.1',
      REDIS_PORT: REDIS_PORT || '6379',
      REDIS_PASSWORD: REDIS_PASSWORD || 'maci'
    }
  } else if (envType === 'PROD') {
    // Otherwise get addresses from the ENV Variables
    if (REDIS_HOST === undefined ||
        REDIS_PORT === undefined ||
        REDIS_PASSWORD === undefined) {
      throw new Error('ENV_TYPE = PROD, however not all redis credentials are provided.')
    }

    return {
      REDIS_HOST,
      REDIS_PORT,
      REDIS_PASSWORD
    }
  }

  throw new Error('Environment variable ENV_TYPE is invalid')
}

module.exports = {
  getContractAddresses,
  getDbCredentials,
  getRedisCredentials
}
