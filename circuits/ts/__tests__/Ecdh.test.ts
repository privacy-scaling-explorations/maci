import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { type WitnessTester } from "circomkit";
import { Keypair } from "maci-domainobjs";

import { circomkitInstance } from "./utils/utils";

chai.use(chaiAsPromised);

describe("Public key derivation circuit", () => {
  let circuit: WitnessTester<["privKey", "pubKey"], ["sharedKey"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("ecdh", {
      file: "ecdh",
      template: "Ecdh",
    });
  });

  it("correctly computes a public key", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const ecdhSharedKey = Keypair.genEcdhSharedKey(keypair.privKey, keypair2.pubKey);

    const circuitInputs = {
      privKey: BigInt(keypair.privKey.asCircuitInputs()),
      pubKey: keypair2.pubKey.rawPubKey as [bigint, bigint],
    };

    await circuit.expectPass(circuitInputs, { sharedKey: [ecdhSharedKey[0], ecdhSharedKey[1]] });
  });

  it("should generate the same ECDH key given the same inputs", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const circuitInputs = {
      privKey: BigInt(keypair.privKey.asCircuitInputs()),
      pubKey: keypair2.pubKey.asCircuitInputs() as unknown as bigint[],
    };

    // calculate first time witness and check contraints
    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    // read out
    const out = await circuit.readWitnessSignals(witness, ["sharedKey"]);

    // calculate again
    await circuit.expectPass(circuitInputs, { sharedKey: out.sharedKey });
  });

  it("should throw when given invalid inputs (pubKey too short)", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const circuitInputs = {
      privKey: BigInt(keypair.privKey.asCircuitInputs()),
      pubKey: keypair2.pubKey.asCircuitInputs().slice(0, 1) as unknown as [bigint, bigint],
    };

    await expect(circuit.calculateWitness(circuitInputs)).to.be.rejectedWith(
      "Not enough values for input signal pubKey",
    );
  });
});
