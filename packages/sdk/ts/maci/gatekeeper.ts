import {
  MACI__factory as MACIFactory,
  SignUpGatekeeper__factory as SignUpGatekeeperFactory,
  SemaphoreGatekeeper__factory as SemaphoreGatekeeperFactory,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  HatsGatekeeperSingle__factory as HatsSingleGatekeeperFactory,
  MerkleProofGatekeeper__factory as MerkleProofGatekeeperFactory,
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

  const gatekeeperType = await gatekeeperContract.getTrait();

  return gatekeeperType as EGatekeeperTrait;
};

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

  const [validEventId, validSigner1, validSigner2] = await Promise.all([
    gatekeeperContract.validEventId(),
    gatekeeperContract.validSigner1(),
    gatekeeperContract.validSigner2(),
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
