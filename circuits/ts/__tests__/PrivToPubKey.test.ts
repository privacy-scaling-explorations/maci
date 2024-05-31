import { Base8, inCurve, mulPointEscalar, r } from "@zk-kit/baby-jubjub";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";
import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import { L } from "./utils/constants";
import { circomkitInstance, getSignal } from "./utils/utils";

describe("Public key derivation circuit", function test() {
  this.timeout(900000);

  let circuit: WitnessTester<["privKey"], ["pubKey"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("privToPubKey", {
      file: "./utils/privToPubKey",
      template: "PrivToPubKey",
    });
  });

  it("should correctly compute a public key", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privKey: keypair.privKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(derivedPubkey0.toString()).to.be.eq(keypair.pubKey.rawPubKey[0].toString());
    expect(derivedPubkey1.toString()).to.be.eq(keypair.pubKey.rawPubKey[1].toString());
  });

  it("should produce an output that is within the baby jubjub curve", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privKey: keypair.privKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(inCurve([derivedPubkey0, derivedPubkey1])).to.eq(true);
  });

  it("should throw error if private key is not in the prime subgroup l", async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: L, max: r - 1n }), async (privKey: bigint) => {
        const error = await circuit.expectFail({ privKey });

        return error.includes("Assert Failed");
      }),
    );
  });

  it("should correctly produce different public keys for the different private keys [fuzz]", async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 1n, max: L - 1n }), async (x: bigint) => {
        const publicKeys = new Map<string, PubKey>();
        const privateKeys: PrivKey[] = [];

        let i = 0n;

        while (x + i * r <= 2n ** 253n) {
          privateKeys.push(new PrivKey(x + i * r));
          i += 1n;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const privateKey of privateKeys) {
          const publicKey = mulPointEscalar(Base8, BigInt(privateKey.rawPrivKey));

          // eslint-disable-next-line no-await-in-loop
          const witness = await circuit.calculateWitness({
            privKey: BigInt(privateKey.rawPrivKey),
          });
          // eslint-disable-next-line no-await-in-loop
          await circuit.expectConstraintPass(witness);
          // eslint-disable-next-line no-await-in-loop
          const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
          // eslint-disable-next-line no-await-in-loop
          const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");

          expect(publicKey[0]).to.eq(derivedPubkey0);
          expect(publicKey[1]).to.eq(derivedPubkey1);

          publicKeys.set(privateKey.serialize(), new PubKey([derivedPubkey0, derivedPubkey1]));
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
        const { pubKey, privKey } = new Keypair(new PrivKey(salt));

        const witness = await circuit.calculateWitness({ privKey: BigInt(privKey.asCircuitInputs()) });
        await circuit.expectConstraintPass(witness);

        const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
        const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");

        return (
          derivedPubkey0 === pubKey.rawPubKey[0] &&
          derivedPubkey1 === pubKey.rawPubKey[1] &&
          inCurve([derivedPubkey0, derivedPubkey1])
        );
      }),
      { numRuns: 10_000 },
    );
  });
});
