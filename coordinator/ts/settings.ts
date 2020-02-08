import {
  EnvType,
  ContractAddresses,
  DbCredentials,
  RedisCredentials
} from "./types/primitives";

export const getContractAddresses = (): ContractAddresses => {
  // Development by default
  const envType = process.env.ENV_TYPE || EnvType.Dev;

  if (envType === EnvType.Dev || envType === EnvType.Test) {
    // If its development, just read from the compiled contract
    const deployedAddresses = require("../contracts/DeployedAddresses.json");

    return {
      MACI_CONTRACT_ADDRESS: deployedAddresses.maciAddress,
      CMD_TREE_ADDRESS: deployedAddresses.cmdTreeAddress,
      STATE_TREE_ADDRESS: deployedAddresses.stateTreeAddress,
      SIGN_UP_TOKEN_ADDRESS: deployedAddresses.signUpTokenAddress
    };
  } else if (envType === EnvType.Prod) {
    // Otherwise get addresses from the ENV Variables
    if (
      process.env.MACI_CONTRACT_ADDRESS === undefined ||
      process.env.SIGN_UP_TOKEN_ADDRESS === undefined ||
      process.env.CMD_TREE_ADDRESS === undefined ||
      process.env.STATE_TREE_ADDRESS === undefined
    ) {
      throw new Error(
        "ENV_TYPE = PROD, however not all contract addresses are provided."
      );
    }

    return {
      MACI_CONTRACT_ADDRESS: process.env.MACI_CONTRACT_ADDRESS,
      CMD_TREE_ADDRESS: process.env.CMD_TREE_ADDRESS,
      STATE_TREE_ADDRESS: process.env.STATE_TREE_ADDRESS,
      SIGN_UP_TOKEN_ADDRESS: process.env.SIGN_UP_TOKEN_ADDRESS
    };
  }

  throw new Error("Environment variable ENV_TYPE is invalid");
};

export const getDbCredentials = (): DbCredentials => {
  // Development by default
  const envType = process.env.ENV_TYPE || EnvType.Dev;

  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_HOST = process.env.DB_HOST;
  const DB_PORT = process.env.DB_PORT;
  const DB_NAME = process.env.DB_NAME;

  if (envType === EnvType.Dev || envType === EnvType.Test) {
    return {
      DB_USER: DB_USER || "maci",
      DB_PASSWORD: DB_PASSWORD || "maci",
      DB_HOST: DB_HOST || "127.0.0.1",
      DB_PORT: DB_PORT || "5432",
      DB_NAME: DB_NAME || "maci"
    };
  } else if (envType === EnvType.Prod) {
    // Otherwise get addresses from the ENV Variables
    if (
      DB_USER === undefined ||
      DB_PASSWORD === undefined ||
      DB_HOST === undefined ||
      DB_PORT === undefined ||
      DB_NAME === undefined
    ) {
      throw new Error(
        "ENV_TYPE = PROD, however not all database credentials are provided."
      );
    }

    return {
      DB_USER,
      DB_PASSWORD,
      DB_HOST,
      DB_PORT,
      DB_NAME
    };
  }

  throw new Error("Environment variable ENV_TYPE is invalid");
};

export const getRedisCredentials = (): RedisCredentials => {
  const envType = process.env.ENV_TYPE || EnvType.Dev;

  const REDIS_HOST = process.env.REDIS_HOST;
  const REDIS_PORT = process.env.REDIS_PORT;
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

  if (envType === EnvType.Dev || envType === EnvType.Test) {
    return {
      REDIS_HOST: REDIS_HOST || "127.0.0.1",
      REDIS_PORT: REDIS_PORT || "6379",
      REDIS_PASSWORD: REDIS_PASSWORD || "maci"
    };
  } else if (envType === EnvType.Prod) {
    // Otherwise get addresses from the ENV Variables
    if (
      REDIS_HOST === undefined ||
      REDIS_PORT === undefined ||
      REDIS_PASSWORD === undefined
    ) {
      throw new Error(
        "ENV_TYPE = PROD, however not all redis credentials are provided."
      );
    }

    return {
      REDIS_HOST,
      REDIS_PORT,
      REDIS_PASSWORD
    };
  }

  throw new Error("Environment variable ENV_TYPE is invalid");
};
