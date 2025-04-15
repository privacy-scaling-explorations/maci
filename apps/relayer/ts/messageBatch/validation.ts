import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

/**
 * Check if the string is a valid base58 encoded CIDv1 hash
 */
const IPFS_REGEX = /^Qm[a-zA-Z0-9]{44}$/;

/**
 * Validate public key
 */
@ValidatorConstraint({ name: "ipfsHash", async: false })
export class IpfsHashValidator implements ValidatorConstraintInterface {
  /**
   * Validate ipfs hash
   *
   * @param text text to validate
   * @returns status of validation
   */
  validate(text: string): boolean {
    return IPFS_REGEX.test(text);
  }

  /**
   * Return default validation message
   *
   * @returns default validation message
   */
  defaultMessage(): string {
    return "IPFS hash is invalid";
  }
}
