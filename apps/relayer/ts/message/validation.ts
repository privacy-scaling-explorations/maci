import { PublicKey } from "@maci-protocol/domainobjs";
import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

/**
 * Validate public key
 */
@ValidatorConstraint({ name: "publicKey", async: false })
export class PublicKeyValidator implements ValidatorConstraintInterface {
  /**
   * Try to deserialize public key from text and return status of validation
   *
   * @param text text to validate
   * @returns status of validation
   */
  validate(text: string): boolean {
    try {
      const [x, y] = PublicKey.deserialize(text).asArray();
      return Boolean(new PublicKey([x, y]));
    } catch (error) {
      return false;
    }
  }

  /**
   * Return default validation message
   *
   * @returns default validation message
   */
  defaultMessage(): string {
    return "Public key is invalid";
  }
}
