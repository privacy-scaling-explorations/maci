import {
    SNARK_FIELD_SIZE,
    formatPrivKeyForBabyJub,
    PrivKey as RawPrivKey,
} from "maci-crypto";
import { SERIALIZED_PRIV_KEY_PREFIX } from "./constants";

/**
 * @notice PrivKey is a TS Class representing a MACI PrivateKey (on the jubjub curve)
 */
export class PrivKey {
    public rawPrivKey: RawPrivKey;

    /**
     * Generate a new Private key object
     * @param rawPrivKey the raw private key (a bigint)
     */
    constructor(rawPrivKey: RawPrivKey) {
        this.rawPrivKey = rawPrivKey;
    }

    /**
     * Create a copy of this Private key
     * @returns a copy of the Private key
     */
    public copy = (): PrivKey => {
        return new PrivKey(BigInt(this.rawPrivKey.toString()));
    };

    /**
     * Return this Private key as a circuit input
     * @returns the Private key as a circuit input
     */
    public asCircuitInputs = () => {
        return formatPrivKeyForBabyJub(this.rawPrivKey).toString();
    };

    /**
     * Serialize the private key
     * @returns the serialized private key
     */
    public serialize = (): string => {
        return SERIALIZED_PRIV_KEY_PREFIX + this.rawPrivKey.toString(16);
    };

    /**
     * Deserialize the private key
     * @param s the serialized private key
     * @returns the deserialized private key
     */
    public static deserialize = (s: string): PrivKey => {
        const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);
        return new PrivKey(BigInt("0x" + x));
    };

    /**
     * Check if the serialized private key is valid
     * @param s the serialized private key
     * @returns whether it is a valid serialized private key
     */
    public static isValidSerializedPrivKey = (s: string): boolean => {
        const correctPrefix = s.startsWith(SERIALIZED_PRIV_KEY_PREFIX);
        const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);

        let validValue = false;
        try {
            const value = BigInt("0x" + x);
            validValue = value < SNARK_FIELD_SIZE;
        } catch {
            // comment to make linter happy
        }

        return correctPrefix && validValue;
    };

    /**
     * Serialize this object
     */
    public toJSON() {
        return {
            privKey: this.serialize(),
        };
    }

    /**
     * Deserialize this object from a JSON object
     * @param json - the json object
     * @returns the deserialized object as a PrivKey instance
     */
    static fromJSON(json: any): PrivKey {
        return PrivKey.deserialize(json.privKey);
    }
}
