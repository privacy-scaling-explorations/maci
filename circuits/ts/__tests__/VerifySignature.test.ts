import { stringifyBigInts, verifySignature, hash4 } from "maci-crypto";
import { Keypair, PCommand } from "maci-domainobjs";
import { join } from 'path'
import { expect } from 'chai'
const tester = require("circom_tester").wasm
import { 
  getSignal
} from './utils/utils'

describe("Signature verification circuit", function () {
    this.timeout(90000);

    let circuit: any;
    before(async () => {
        const circuitPath = join(
            __dirname,
            "../../circom/test",
            `verifySignature_test.circom`
        );
        circuit = await tester(circuitPath);
    });

    it("verifies a valid signature", async () => {
        const keypair = new Keypair();
        const command = new PCommand(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3)
        );

        const signer = new Keypair();
        const sig = command.sign(signer.privKey);
        const plaintext = hash4(command.asArray());

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.be
            .true;

        const circuitInputs = stringifyBigInts({
            pubKey: signer.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S: sig.S,
            preimage: command.asCircuitInputs(),
        });

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.checkConstraints(witness);
        const isValid = await getSignal(circuit, witness, "valid");
        expect(isValid.toString()).to.be.eq("1");
    });

    it("rejects an invalid signature (wrong signer)", async () => {
        const keypair = new Keypair();
        const command = new PCommand(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3)
        );

        const signer = new Keypair();
        const wrongSigner = new Keypair();

        expect(signer.privKey.rawPrivKey).not.to.be.eq(
            wrongSigner.privKey.rawPrivKey
        );

        const sig = command.sign(signer.privKey);

        const plaintext = hash4(command.asArray());

        // The signature is signed by `signer`
        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.be
            .true;

        // The signature is not signed by `wrongSigner`
        expect(verifySignature(plaintext, sig, wrongSigner.pubKey.rawPubKey)).to
            .be.false;

        const circuitInputs = stringifyBigInts({
            pubKey: wrongSigner.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S: sig.S,
            preimage: command.asCircuitInputs(),
        });

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.checkConstraints(witness);
        const isValid = await getSignal(circuit, witness, "valid");
        expect(isValid.toString()).to.be.eq("0");
        expect(
            (
                await getSignal(circuit, witness, "verifier.isCcZero.out")
            ).toString()
        ).to.be.eq("1");
    });

    it("rejects an invalid signature", async () => {
        const keypair = new Keypair();
        const command = new PCommand(
            BigInt(0),
            keypair.pubKey,
            BigInt(123),
            BigInt(123),
            BigInt(1),
            BigInt(2),
            BigInt(3)
        );

        const signer = new Keypair();
        const sig = command.sign(signer.privKey);
        const plaintext = hash4(command.asArray());

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.be
            .true;

        const circuitInputs = stringifyBigInts({
            pubKey: signer.pubKey.asCircuitInputs(),
            R8: sig.R8,
            S:
                BigInt(
                    "2736030358979909402780800718157159386076813972158567259200215660948447373040"
                ) + BigInt(1),
            preimage: command.asCircuitInputs(),
        });

        expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.be
            .true;

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.checkConstraints(witness);
        const isValid = await getSignal(circuit, witness, "valid");
        expect(isValid.toString()).to.be.eq("0");
        expect(
            (
                await getSignal(circuit, witness, "verifier.isCcZero.out")
            ).toString()
        ).to.be.eq("0");
    });
});