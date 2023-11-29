import * as assert from "assert";
import {
    SNARK_FIELD_SIZE,
    hashLeftRight,
    packPubKey,
    unpackPubKey,
    PubKey as RawPubKey,
} from "maci-crypto";
import { SERIALIZED_PUB_KEY_PREFIX } from "./constants";

/**
 * @notice A class representing a public key
 * @note This is a MACI public key, which is not to be
 * confused with an EVM public key.
 * A serialized MACI public key is prefixed by 'macipk.'
 * A raw MACI public key can be thought as a pair of
 * BigIntegers (x, y) representing a point on the baby jubjub curve
 */
export class PubKey {
    public rawPubKey: RawPubKey;

    /**
     * Create a new instance of a public key
     * @param rawPubKey the raw public key
     */
    constructor(rawPubKey: RawPubKey) {
        assert(rawPubKey.length === 2);
        assert((rawPubKey[0] as bigint) < SNARK_FIELD_SIZE);
        assert((rawPubKey[1] as bigint) < SNARK_FIELD_SIZE);
        this.rawPubKey = rawPubKey;
    }

    /**
     * Create a copy of the public key
     * @returns a copy of the public key
     */
    public copy = (): PubKey => {
        return new PubKey([
            BigInt(this.rawPubKey[0].toString()),
            BigInt(this.rawPubKey[1].toString()),
        ]);
    };

    /**
     * Return this public key as smart contract parameters
     * @returns the public key as smart contract parameters
     */
    public asContractParam = (): any => {
        return {
            x: this.rawPubKey[0].toString(),
            y: this.rawPubKey[1].toString(),
        };
    };

    /**
     * Return this public key as circuit inputs
     * @returns an array of strings
     */
    public asCircuitInputs = (): string[] => {
        return this.rawPubKey.map((x) => x.toString());
    };

    /**
     * Return this public key as an array of bigints
     * @returns the public key as an array of bigints
     */
    public asArray = (): bigint[] => {
        return [this.rawPubKey[0] as bigint, this.rawPubKey[1] as bigint];
    };

    /**
     * Generate a serialized public key from this public key object
     * @returns the string representation of a serialized public key
     */
    public serialize = (): string => {
        // Blank leaves have pubkey [0, 0], which packPubKey does not support
        if (
            BigInt(`${this.rawPubKey[0]}`) === BigInt(0) &&
            BigInt(`${this.rawPubKey[1]}`) === BigInt(0)
        ) {
            return SERIALIZED_PUB_KEY_PREFIX + "z";
        }
        const packed = packPubKey(this.rawPubKey).toString("hex");
        return SERIALIZED_PUB_KEY_PREFIX + packed.toString();
    };

    /**
     * Hash the two baby jubjub coordinates
     * @returns the hash of this public key
     */
    public hash = (): bigint => {
        return hashLeftRight(this.rawPubKey[0], this.rawPubKey[1]);
    };

    /**
     * Check whether this public key equals to another public key
     * @param p the public key to compare with
     * @returns whether they match
     */
    public equals = (p: PubKey): boolean => {
        return (
            this.rawPubKey[0] === p.rawPubKey[0] &&
            this.rawPubKey[1] === p.rawPubKey[1]
        );
    };

    /**
     * Deserialize a serialized public key
     * @param s the serialized public key
     * @returns the deserialized public key
     */
    public static deserialize = (s: string): PubKey => {
        // Blank leaves have pubkey [0, 0], which packPubKey does not support
        if (s === SERIALIZED_PUB_KEY_PREFIX + "z") {
            return new PubKey([BigInt(0), BigInt(0)]);
        }

        const len = SERIALIZED_PUB_KEY_PREFIX.length;
        const packed = Buffer.from(s.slice(len), "hex");
        return new PubKey(unpackPubKey(packed));
    };

    /**
     * Check whether a serialized public key is serialized correctly
     * @param s the serialized public key
     * @returns whether the serialized public key is valid
     */
    public static isValidSerializedPubKey = (s: string): boolean => {
        const correctPrefix = s.startsWith(SERIALIZED_PUB_KEY_PREFIX);

        try {
            PubKey.deserialize(s);
            return correctPrefix && true;
        } catch {
            return false;
        }
    };

    /**
     * Serialize this object
     */
    public toJSON() {
        return {
            pubKey: this.serialize(),
        };
    }

    /**
     * Deserialize a JSON object into a PubKey instance
     * @param json - the json object
     * @returns PubKey
     */
    static fromJSON(json: any): PubKey {
        return PubKey.deserialize(json.pubKey);
    }
}
