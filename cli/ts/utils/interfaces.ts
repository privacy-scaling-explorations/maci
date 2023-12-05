export interface DeployedContracts {
  maciAddress: string;
  stateAqAddress: string;
  pollFactoryAddress: string;
  topupCreditAddress: string;
  poseidonT3Address: string;
  poseidonT4Address: string;
  poseidonT5Address: string;
  poseidonT6Address: string;
  initialVoiceCreditProxyAddress: string;
  signUpGatekeeperAddress: string;
  verifierAddress: string;
}

export interface PollContracts {
  messageProcessor: string;
  tally: string;
  subsidy: string;
  poll: string;
}
