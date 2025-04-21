import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import { Base8, inCurve, mulPointEscalar, r } from "@zk-kit/baby-jubjub";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { L } from "./utils/constants";
import { circomkitInstance, getSignal } from "./utils/utils";

describe("Public key derivation circuit", function test() {
  this.timeout(900000);

  let circuit: WitnessTester<["privateKey"], ["publicKey"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("privateToPublicKey", {
      file: "./utils/PrivateToPublicKey",
      template: "PrivateToPublicKey",
    });
  });

  it("should correctly compute a public key", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privateKey: keypair.privateKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPublicKeyX = await getSignal(circuit, witness, "publicKey[0]");
    const derivedPublicKeyY = await getSignal(circuit, witness, "publicKey[1]");
    expect(derivedPublicKeyX.toString()).to.be.eq(keypair.publicKey.raw[0].toString());
    expect(derivedPublicKeyY.toString()).to.be.eq(keypair.publicKey.raw[1].toString());
  });

  it("should produce an output that is within the baby jubjub curve", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privateKey: keypair.privateKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPublicKeyX = await getSignal(circuit, witness, "publicKey[0]");
    const derivedPublicKeyY = await getSignal(circuit, witness, "publicKey[1]");
    expect(inCurve([derivedPublicKeyX, derivedPublicKeyY])).to.eq(true);
  });

  it("should throw error if private key is not in the prime subgroup l", async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: L, max: r - 1n }), async (privateKey: bigint) => {
        const error = await circuit.expectFail({ privateKey });

        return error.includes("Assert Failed");
      }),
    );
  });

  it("should correctly produce different public keys for the different private keys [fuzz]", async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 1n, max: L - 1n }), async (x: bigint) => {
        const publicKeys = new Map<string, PublicKey>();
        const privateKeys: PrivateKey[] = [];

        let i = 0n;

        while (x + i * r <= 2n ** 253n) {
          privateKeys.push(new PrivateKey(x + i * r));
          i += 1n;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const privateKey of privateKeys) {
          const publicKey = mulPointEscalar(Base8, BigInt(privateKey.raw));

          // eslint-disable-next-line no-await-in-loop
          const witness = await circuit.calculateWitness({
            privateKey: BigInt(privateKey.raw),
          });
          // eslint-disable-next-line no-await-in-loop
          await circuit.expectConstraintPass(witness);
          // eslint-disable-next-line no-await-in-loop
          const derivedPublicKeyX = await getSignal(circuit, witness, "publicKey[0]");
          // eslint-disable-next-line no-await-in-loop
          const derivedPublicKeyY = await getSignal(circuit, witness, "publicKey[1]");

          expect(publicKey[0]).to.eq(derivedPublicKeyX);
          expect(publicKey[1]).to.eq(derivedPublicKeyY);

          publicKeys.set(privateKey.serialize(), new PublicKey([derivedPublicKeyX, derivedPublicKeyY]));
        }

        const uniquePublicKeys = [...publicKeys.values()].filter(
          (value, index, array) => array.findIndex((publicKey) => publicKey.equals(value)) === index,
        );

        return uniquePublicKeys.length === privateKeys.length && uniquePublicKeys.length === publicKeys.size;
      }),
      { numRuns: 10_000 },
    );
  });

  it("should correctly compute a public key [fuzz]", async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt(), async (salt: bigint) => {
        const { publicKey, privateKey } = new Keypair(new PrivateKey(salt));

        const witness = await circuit.calculateWitness({ privateKey: BigInt(privateKey.asCircuitInputs()) });
        await circuit.expectConstraintPass(witness);

        const derivedPublicKeyX = await getSignal(circuit, witness, "publicKey[0]");
        const derivedPublicKeyY = await getSignal(circuit, witness, "publicKey[1]");

        return (
          derivedPublicKeyX === publicKey.raw[0] &&
          derivedPublicKeyY === publicKey.raw[1] &&
          inCurve([derivedPublicKeyX, derivedPublicKeyY])
        );
      }),
      { numRuns: 10_000 },
    );
  });
});
