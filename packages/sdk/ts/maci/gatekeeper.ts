import { EGatekeepers } from "maci-contracts";
import {
  MACI__factory as MACIFactory,
  SignUpGatekeeper__factory as SignUpGatekeeperFactory,
  SemaphoreGatekeeper__factory as SemaphoreGatekeeperFactory,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  HatsGatekeeperSingle__factory as HatsSingleGatekeeperFactory,
  MerkleProofGatekeeper__factory as MerkleProofGatekeeperFactory,
  ZupassChecker__factory as ZupassCheckerFactory,
} from "maci-contracts/typechain-types";

import type {
  IGetGatekeeperTraitArgs,
  IGetGatekeeperDataArgs,
  ISemaphoreGatekeeperData,
  IZupassGatekeeperData,
  IEASGatekeeperData,
  IHatsGatekeeperData,
  IMerkleProofGatekeeperData,
} from "./types";

import { EGatekeeperTrait } from "./types";

/**
 * Get the gatekeeper type of the MACI contract
 * @param IGetGatekeeperTraitArgs - The arguments for the get gatekeeper type command
 * @returns The gatekeeper type
 */
export const getGatekeeperTrait = async ({
  maciAddress,
  signer,
}: IGetGatekeeperTraitArgs): Promise<EGatekeeperTrait> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = SignUpGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const gatekeeperType = await gatekeeperContract.trait();

  return gatekeeperType as EGatekeeperTrait;
};

const GATEKEEPER_CONTRACT_NAMES_BY_TRAIT = {
  [EGatekeeperTrait.EAS]: EGatekeepers.EAS,
  [EGatekeeperTrait.FreeForAll]: EGatekeepers.FreeForAll,
  [EGatekeeperTrait.GitcoinPassport]: EGatekeepers.GitcoinPassport,
  [EGatekeeperTrait.Hats]: EGatekeepers.Hats,
  [EGatekeeperTrait.Semaphore]: EGatekeepers.Semaphore,
  [EGatekeeperTrait.Token]: EGatekeepers.Token,
  [EGatekeeperTrait.Zupass]: EGatekeepers.Zupass,
  [EGatekeeperTrait.MerkleProof]: EGatekeepers.MerkleProof,
};

/**
 * Get gatekeeper contract names associated with the trait provided.
 *
 * @param trait the gatekeeper trait
 * @returns the gatekeeper contract names
 */
export const getGatekeeperContractNamesByTrait = (trait: EGatekeeperTrait): EGatekeepers =>
  GATEKEEPER_CONTRACT_NAMES_BY_TRAIT[trait];

/**
 * Get the semaphore gatekeeper data
 * @param IGetSemaphoreGatekeeperDataArgs - The arguments for the get semaphore gatekeeper data command
 * @returns The semaphore gatekeeper data
 */
export const getSemaphoreGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<ISemaphoreGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = SemaphoreGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  // get the group ID and semaphore contract address
  const [groupId, semaphoreContractAddress] = await Promise.all([
    gatekeeperContract.groupId(),
    gatekeeperContract.semaphoreContract(),
  ]);

  return {
    address: semaphoreContractAddress,
    groupId: groupId.toString(),
  };
};

/**
 * Get the zupass gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get zupass gatekeeper data command
 * @returns The zupass gatekeeper data
 */
export const getZupassGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IZupassGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = ZupassGatekeeperFactory.connect(gatekeeperContractAddress, signer);
  const checkerAddress = await gatekeeperContract.BASE_CHECKER();
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
 * Get the EAS gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get eas gatekeeper data command
 * @returns The eas gatekeeper data
 */
export const getEASGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IEASGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = EASGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [eas, schema, attester] = await Promise.all([
    gatekeeperContract.eas(),
    gatekeeperContract.schema(),
    gatekeeperContract.attester(),
  ]);

  return {
    eas: eas.toString(),
    schema: schema.toString(),
    attester: attester.toString(),
  };
};

/**
 * Get the hats single gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get hats single gatekeeper data command
 * @returns The hats single gatekeeper data
 */
export const getHatsSingleGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IHatsGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = HatsSingleGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [criterionHat, hatsContract] = await Promise.all([
    gatekeeperContract.criterionHat(),
    gatekeeperContract.hats(),
  ]);

  return {
    criterionHat: [criterionHat.toString()],
    hatsContract: hatsContract.toString(),
  };
};

/**
 * Get the merkleproof gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get merkleproof gatekeeper data command
 * @returns The merkleproof gatekeeper data
 */
export const getMerkleProofGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IMerkleProofGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = MerkleProofGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [validRoot] = await Promise.all([gatekeeperContract.root()]);

  return {
    root: validRoot.toString(),
  };
};
