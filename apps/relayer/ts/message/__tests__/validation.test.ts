import { Keypair } from "maci-domainobjs";

import { PublicKeyValidator } from "../validation";

describe("PublicKeyValidator", () => {
  test("should validate valid public key", () => {
    const keypair = new Keypair();
    const validator = new PublicKeyValidator();

    const result = validator.validate(keypair.pubKey.serialize());

    expect(result).toBe(true);
  });

  test("should validate invalid public key", () => {
    const validator = new PublicKeyValidator();

    const result = validator.validate("invalid");

    expect(result).toBe(false);
  });

  test("should return default message properly", () => {
    const validator = new PublicKeyValidator();

    const result = validator.defaultMessage();

    expect(result).toBe("Public key is invalid");
  });
});
