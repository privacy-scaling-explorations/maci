import { EPolicies, MerkleProofChecker__factory as MerkleProofCheckerFactory } from "@maci-protocol/contracts";
import {
  MACI__factory as MACIFactory,
  IBasePolicy__factory as SignUpPolicyFactory,
  SemaphorePolicy__factory as SemaphorePolicyFactory,
  ZupassPolicy__factory as ZupassPolicyFactory,
  EASPolicy__factory as EASPolicyFactory,
  MerkleProofPolicy__factory as MerkleProofPolicyFactory,
  ZupassChecker__factory as ZupassCheckerFactory,
  EASChecker__factory as EASCheckerFactory,
  SemaphoreChecker__factory as SemaphoreCheckerFactory,
} from "@maci-protocol/contracts/typechain-types";

import type {
  IGetPolicyTraitArgs,
  IGetPolicyDataArgs,
  ISemaphorePolicyData,
  IZupassPolicyData,
  IEASPolicyData,
  IMerkleProofPolicyData,
} from "./types";

import { EPolicyTrait } from "./types";

/**
 * Get the policy type of the MACI contract
 * @param IGetPolicyTraitArgs - The arguments for the get policy type command
 * @returns The policy type
 */
export const getPolicyTrait = async ({ maciAddress, signer }: IGetPolicyTraitArgs): Promise<EPolicyTrait> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup policy
  const policyContractAddress = await maciContract.signUpPolicy();

  const policyContract = SignUpPolicyFactory.connect(policyContractAddress, signer);

  const policyType = await policyContract.trait();

  return policyType as EPolicyTrait;
};

const POLICY_CONTRACT_NAMES_BY_TRAIT = {
  [EPolicyTrait.EAS]: EPolicies.EAS,
  [EPolicyTrait.FreeForAll]: EPolicies.FreeForAll,
  [EPolicyTrait.GitcoinPassport]: EPolicies.GitcoinPassport,
  [EPolicyTrait.Hats]: EPolicies.Hats,
  [EPolicyTrait.Semaphore]: EPolicies.Semaphore,
  [EPolicyTrait.Token]: EPolicies.Token,
  [EPolicyTrait.Zupass]: EPolicies.Zupass,
  [EPolicyTrait.MerkleProof]: EPolicies.MerkleProof,
};

/**
 * Get policy contract names associated with the trait provided.
 *
 * @param trait the policy trait
 * @returns the policy contract names
 */
export const getPolicyContractNamesByTrait = (trait: EPolicyTrait): EPolicies => POLICY_CONTRACT_NAMES_BY_TRAIT[trait];

/**
 * Get the semaphore policy data
 * @param IGetSemaphorePolicyDataArgs - The arguments for the get semaphore policy data command
 * @returns The semaphore policy data
 */
export const getSemaphorePolicyData = async ({
  maciAddress,
  signer,
}: IGetPolicyDataArgs): Promise<ISemaphorePolicyData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup policy
  const policyContractAddress = await maciContract.signUpPolicy();

  const policyContract = SemaphorePolicyFactory.connect(policyContractAddress, signer);
  const checkerAddress = await policyContract.BASE_CHECKER();
  const checkerContract = SemaphoreCheckerFactory.connect(checkerAddress, signer);

  // get the group ID and semaphore contract address
  const [groupId, semaphoreContractAddress] = await Promise.all([
    checkerContract.groupId(),
    checkerContract.semaphore(),
  ]);

  return {
    address: semaphoreContractAddress,
    groupId: groupId.toString(),
  };
};

/**
 * Get the zupass policy data
 * @param IGetPolicyDataArgs - The arguments for the get zupass policy data command
 * @returns The zupass policy data
 */
export const getZupassPolicyData = async ({ maciAddress, signer }: IGetPolicyDataArgs): Promise<IZupassPolicyData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup policy
  const policyContractAddress = await maciContract.signUpPolicy();

  const policyContract = ZupassPolicyFactory.connect(policyContractAddress, signer);
  const checkerAddress = await policyContract.BASE_CHECKER();
  const checkerContract = ZupassCheckerFactory.connect(checkerAddress, signer);

  const [validEventId, validSigner1, validSigner2] = await Promise.all([
    checkerContract.validEventId(),
    checkerContract.validSigner1(),
    checkerContract.validSigner2(),
  ]);

  return {
    eventId: validEventId.toString(),
    signer1: validSigner1.toString(),
    signer2: validSigner2.toString(),
  };
};

/**
 * Get the EAS policy data
 * @param IGetPolicyDataArgs - The arguments for the get eas policy data command
 * @returns The eas policy data
 */
export const getEASPolicyData = async ({ maciAddress, signer }: IGetPolicyDataArgs): Promise<IEASPolicyData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const policyContractAddress = await maciContract.signUpPolicy();

  const policyContract = EASPolicyFactory.connect(policyContractAddress, signer);
  const checkerAddress = await policyContract.BASE_CHECKER();
  const checkerContract = EASCheckerFactory.connect(checkerAddress, signer);

  const [eas, schema, attester] = await Promise.all([
    checkerContract.eas(),
    checkerContract.schema(),
    checkerContract.attester(),
  ]);

  return {
    eas: eas.toString(),
    schema: schema.toString(),
    attester: attester.toString(),
  };
};

/**
 * Get the merkleproof policy data
 * @param IGetPolicyDataArgs - The arguments for the get merkleproof policy data command
 * @returns The merkleproof policy data
 */
export const getMerkleProofPolicyData = async ({
  maciAddress,
  signer,
}: IGetPolicyDataArgs): Promise<IMerkleProofPolicyData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup policy
  const policyContractAddress = await maciContract.signUpPolicy();

  const policyContract = MerkleProofPolicyFactory.connect(policyContractAddress, signer);
  const checkerAddress = await policyContract.BASE_CHECKER();
  const checkerContract = MerkleProofCheckerFactory.connect(checkerAddress, signer);

  const [validRoot] = await Promise.all([checkerContract.root()]);

  return {
    root: validRoot.toString(),
  };
};
