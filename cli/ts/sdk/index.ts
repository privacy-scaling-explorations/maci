import { genKeyPair } from "../commands/genKeyPair";
import { genMaciPubKey } from "../commands/genPubKey";
import { getPoll } from "../commands/poll";
import { publish, publishBatch } from "../commands/publish";
import { signup, isRegisteredUser } from "../commands/signup";
import { verify } from "../commands/verify";

export { genKeyPair, genMaciPubKey, publish, publishBatch, signup, isRegisteredUser, verify, getPoll };

export type { ISnarkJSVerificationKey } from "maci-circuits";

export {
  linkPoseidonLibraries,
  Deployment,
  ContractStorage,
  EContracts,
  EMode,
  PollFactory__factory as PollFactoryFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  MACI__factory as MACIFactory,
  type MACI,
  type EASGatekeeper,
  type IVerifyingKeyStruct,
  type VkRegistry,
} from "maci-contracts";

export { VerifyingKey, type IVkObjectParams } from "maci-domainobjs";

export type {
  TallyData,
  PublishArgs,
  SignupArgs,
  ISignupData,
  VerifyArgs,
  IGetPollArgs,
  IGetPollData,
  IRegisteredUserArgs,
  IPublishBatchArgs,
  IGenKeypairArgs,
  IPublishBatchData,
  IPublishMessage,
} from "../utils";
