import * as path from "path";
import * as fs from "fs";
import { expect } from "chai";
import {
    StateLeaf,
    PCommand,
    Keypair,
    PrivKey,
    PubKey,
    VerifyingKey,
} from "../";

import { genKeypair, unpackPubKey, genRandomSalt } from "maci-crypto";

describe("Domain objects", function () {
    this.timeout(100000);

    const { privKey, pubKey } = new Keypair();
    const k = new Keypair();

    const pubKey1 = k.pubKey;

    const newPubKey = k.pubKey;

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1);

    const random50bitBigInt = (): bigint => {
        return (
            ((BigInt(1) << BigInt(50)) - BigInt(1)) &
            BigInt(`${genRandomSalt()}`)
        );
    };

    const command: PCommand = new PCommand(
        random50bitBigInt(),
        newPubKey,
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        genRandomSalt()
    );

    describe("Verifying keys", () => {
        it("Should convert a JSON file from snarkjs to a VerifyingKey", () => {
            const file = path.join(__dirname, "test_vk.json");
            const j = fs.readFileSync(file).toString();
            const d = JSON.parse(j);
            const vk = VerifyingKey.fromJSON(j);

            expect(d.vk_alpha_1[0]).to.eq(vk.alpha1.x.toString());
            expect(d.vk_alpha_1[1]).to.eq(vk.alpha1.y.toString());

            expect(d.vk_beta_2[0][0]).to.eq(vk.beta2.x[1].toString());
            expect(d.vk_beta_2[0][1]).to.eq(vk.beta2.x[0].toString());
            expect(d.vk_beta_2[1][0]).to.eq(vk.beta2.y[1].toString());
            expect(d.vk_beta_2[1][1]).to.eq(vk.beta2.y[0].toString());

            expect(d.vk_gamma_2[0][0]).to.eq(vk.gamma2.x[1].toString());
            expect(d.vk_gamma_2[0][1]).to.eq(vk.gamma2.x[0].toString());
            expect(d.vk_gamma_2[1][0]).to.eq(vk.gamma2.y[1].toString());
            expect(d.vk_gamma_2[1][1]).to.eq(vk.gamma2.y[0].toString());

            expect(d.vk_delta_2[0][0]).to.eq(vk.delta2.x[1].toString());
            expect(d.vk_delta_2[0][1]).to.eq(vk.delta2.x[0].toString());
            expect(d.vk_delta_2[1][0]).to.eq(vk.delta2.y[1].toString());
            expect(d.vk_delta_2[1][1]).to.eq(vk.delta2.y[0].toString());

            expect(d.IC.length).to.eq(vk.ic.length);
            for (let i = 0; i < d.IC.length; i++) {
                expect(d.IC[i][0]).to.eq(vk.ic[i].x.toString());
                expect(d.IC[i][1]).to.eq(vk.ic[i].y.toString());
            }
        });
    });

    describe("State leaves", () => {
        it("The serialize() and unserialize() functions should work correctly", () => {
            const stateLeaf = new StateLeaf(
                pubKey,
                BigInt(123),
                BigInt(1231267)
            );

            const serialized = stateLeaf.serialize();
            const unserialized = StateLeaf.unserialize(serialized);

            expect(unserialized.voiceCreditBalance.toString()).to.eq(
                stateLeaf.voiceCreditBalance.toString()
            );
        });
    });

    describe("Keypairs", () => {
        it("the Keypair constructor should generate a random keypair if not provided a private key", () => {
            const k1 = new Keypair();
            const k2 = new Keypair();

            expect(k1.equals(k2)).to.be.false;

            expect(k1.privKey.rawPrivKey).not.to.eq(k2.privKey.rawPrivKey);
        });

        it("the Keypair constructor should generate the correct public key given a private key", () => {
            const rawKeyPair = genKeypair();
            const k = new Keypair(new PrivKey(rawKeyPair.privKey));
            expect(rawKeyPair.pubKey[0]).to.eq(k.pubKey.rawPubKey[0]);
            expect(rawKeyPair.pubKey[1]).to.eq(k.pubKey.rawPubKey[1]);
        });

        it("PrivKey.serialize() and unserialize() should work correctly", () => {
            const k = new Keypair();
            const sk1 = k.privKey;

            const s = sk1.serialize();
            expect(s.startsWith("macisk.")).to.be.true;

            const d = "0x" + s.slice(7);
            expect(sk1.rawPrivKey.toString()).to.eq(BigInt(d).toString());

            const c = PrivKey.unserialize(s);
            expect(sk1.rawPrivKey.toString()).to.eq(
                BigInt(`${c.rawPrivKey}`).toString()
            );
        });

        it("PrivKey.isValidSerializedPrivKey() should work correctly", () => {
            const k = new Keypair();
            const s = k.privKey.serialize();

            expect(PrivKey.isValidSerializedPrivKey(s)).to.be.true;
            expect(PrivKey.isValidSerializedPrivKey(s.slice(1))).to.be.false;
        });

        it("PubKey.isValidSerializedPubKey() should work correctly", () => {
            const k = new Keypair();
            const s = k.pubKey.serialize();

            expect(PubKey.isValidSerializedPubKey(s)).to.be.true;
            expect(
                PubKey.isValidSerializedPubKey(
                    s + "ffffffffffffffffffffffffffffff"
                )
            ).to.be.false;
            expect(PubKey.isValidSerializedPubKey(s.slice(1))).to.be.false;
        });

        it("PubKey.serialize() and unserialize() should work correctly", () => {
            const k = new Keypair();
            const pk1 = k.pubKey;

            const s = pk1.serialize();
            expect(s.startsWith("macipk.")).to.be.true;

            const d = s.slice(7);
            const unpacked = unpackPubKey(Buffer.from(d, "hex"));

            expect(unpacked[0].toString()).to.eq(pk1.rawPubKey[0].toString());
            expect(unpacked[1].toString()).to.eq(pk1.rawPubKey[1].toString());
        });

        it("PrivKey.copy() should produce a deep copy", () => {
            const k = new Keypair();
            const sk1 = k.privKey;

            // shallow copy
            const sk2 = sk1;

            expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());
            sk1.rawPrivKey = BigInt(0);
            expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());

            // deep copy
            const k1 = new Keypair();
            const sk3 = k1.privKey;
            const sk4 = sk3.copy();
            expect(sk3.rawPrivKey.toString()).to.eq(sk4.rawPrivKey.toString());
            sk4.rawPrivKey = BigInt(0);
            expect(sk3.rawPrivKey.toString()).not.to.eq(
                sk4.rawPrivKey.toString()
            );
        });

        it("PubKey.copy() should produce a deep copy", () => {
            const k = new Keypair();
            const pk1 = k.pubKey;

            // shallow copy
            const pk2 = pk1;

            expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());
            pk1.rawPubKey = [BigInt(0)];
            expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());

            // deep copy
            const k1 = new Keypair();
            const pk3 = k1.pubKey;
            const pk4 = pk3.copy();
            expect(pk3.rawPubKey.toString()).to.eq(pk4.rawPubKey.toString());
            pk4.rawPubKey = [BigInt(0)];
            expect(pk3.rawPubKey.toString()).not.to.eq(
                pk4.rawPubKey.toString()
            );
        });

        it("Keypair.copy() should produce a deep copy", () => {
            const k1 = new Keypair();

            // shallow copy
            const k2 = k1;

            expect(k1.privKey.rawPrivKey.toString()).to.eq(
                k2.privKey.rawPrivKey.toString()
            );
            k1.privKey.rawPrivKey = BigInt(0);
            expect(k1.privKey.rawPrivKey.toString()).to.eq(
                k2.privKey.rawPrivKey.toString()
            );

            // deep copy
            const k3 = new Keypair();
            const k4 = k3.copy();
            expect(k3.privKey.rawPrivKey.toString()).to.eq(
                k4.privKey.rawPrivKey.toString()
            );

            k3.privKey.rawPrivKey = BigInt(0);
            expect(k3.privKey.rawPrivKey.toString()).not.to.eq(
                k4.privKey.rawPrivKey.toString()
            );
        });
    });

    describe("Commands and Messages", () => {
        const signature = command.sign(privKey);
        const message = command.encrypt(signature, ecdhSharedKey);
        const decrypted = PCommand.decrypt(message, ecdhSharedKey);

        it("command.sign() should produce a valid signature", () => {
            expect(command.verifySignature(signature, pubKey)).to.be.true;
        });

        it("A decrypted message should match the original command", () => {
            expect(decrypted.command.equals(command)).to.be.true;
            expect(decrypted.signature.R8[0].toString()).to.eq(
                signature.R8[0].toString()
            );
            expect(decrypted.signature.R8[1].toString()).to.eq(
                signature.R8[1].toString()
            );
            expect(decrypted.signature.S.toString()).to.eq(
                signature.S.toString()
            );
        });

        it("A decrypted message should have a valid signature", () => {
            const isValid = decrypted.command.verifySignature(
                decrypted.signature,
                pubKey
            );
            expect(isValid).to.be.true;
        });

        it("Command.copy() should perform a deep copy", () => {
            const c1: PCommand = new PCommand(
                BigInt(10),
                newPubKey,
                BigInt(0),
                BigInt(9),
                BigInt(1),
                BigInt(123)
            );

            // shallow copy
            const c2 = c1;
            c1.nonce = BigInt(9999);
            expect(c1.nonce.toString()).to.eq(c2.nonce.toString());

            // deep copy
            const c3 = c1.copy();
            c1.nonce = BigInt(8888);

            expect(c1.nonce.toString()).not.to.eq(
                (c3 as PCommand).nonce.toString()
            );
        });
    });
});
