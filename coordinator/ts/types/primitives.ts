export enum EnvType {
  Test = "TEST",
  Dev = "DEV",
  Prod = "PROD"
}

export interface ContractAddresses {
  MACI_CONTRACT_ADDRESS: string;
  CMD_TREE_ADDRESS: string;
  STATE_TREE_ADDRESS: string;
  SIGN_UP_TOKEN_ADDRESS: string;
}

export interface DbCredentials {
  DB_USER: string;
  DB_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
}

export interface RedisCredentials {
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_PASSWORD: string;
}
