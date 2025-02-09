import { IpfsHashValidator } from "../validation.js";

import { defaultIpfsHash } from "./utils.js";

describe("IpfsHashValidator", () => {
  test("should validate valid ipfs hash", () => {
    const validator = new IpfsHashValidator();

    const result = validator.validate(defaultIpfsHash);

    expect(result).toBe(true);
  });

  test("should validate invalid ipfs hash", () => {
    const validator = new IpfsHashValidator();

    const result = validator.validate("invalid");

    expect(result).toBe(false);
  });

  test("should return default message properly", () => {
    const validator = new IpfsHashValidator();

    const result = validator.defaultMessage();

    expect(result).toBe("IPFS hash is invalid");
  });
});
