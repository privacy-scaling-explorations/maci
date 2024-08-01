import type { MACILibraryAddresses } from "../../typechain-types/factories/contracts/MACI__factory";
import type { MessageProcessorLibraryAddresses } from "../../typechain-types/factories/contracts/MessageProcessor__factory";
import type { PollFactoryLibraryAddresses } from "../../typechain-types/factories/contracts/PollFactory__factory";
import type { TallyLibraryAddresses } from "../../typechain-types/factories/contracts/Tally__factory";

/**
 * Create linked contract addresses object
 *
 * @param poseidonT3ContractAddress - PoseidonT3 contract address
 * @param poseidonT4ContractAddress - PoseidonT4 contract address
 * @param poseidonT5ContractAddress - PoseidonT5 contract address
 * @param poseidonT6ContractAddress - PoseidonT6 contract address
 * @returns
 */
export const linkPoseidonLibraries = (
  poseidonT3ContractAddress: string,
  poseidonT4ContractAddress: string,
  poseidonT5ContractAddress: string,
  poseidonT6ContractAddress: string,
): TallyLibraryAddresses | MessageProcessorLibraryAddresses | MACILibraryAddresses | PollFactoryLibraryAddresses => ({
  "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3ContractAddress,
  "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4ContractAddress,
  "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5ContractAddress,
  "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6ContractAddress,
});
