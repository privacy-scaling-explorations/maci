import * as assert from "assert";
import { PubKey } from "./publicKey";
import { hash13 } from "maci-crypto";

/**
 * @notice An encrypted command and signature.
 */
export class Message {
    public msgType: bigint;
    public data: bigint[];
    public static DATA_LENGTH = 10;

    /**
     * Create a new instance of a Message
     * @param msgType the type of the message
     * @param data the data of the message
     */
    constructor(msgType: bigint, data: bigint[]) {
        assert(data.length === Message.DATA_LENGTH);
        this.msgType = msgType;
        this.data = data;
    }

    /**
     * Return the message as an array of bigints
     * @returns the message as an array of bigints
     */
    private asArray = (): bigint[] => {
        return [this.msgType].concat(this.data);
    };

    /**
     * Return the message as a contract param
     * @returns the message as a contract param
     */
    public asContractParam = () => {
        return {
            msgType: this.msgType.toString(),
            data: this.data.map((x: bigint) => x.toString()),
        };
    };

    /**
     * Return the message as a circuit input
     * @returns the message as a circuit input
     */
    public asCircuitInputs = (): bigint[] => {
        return this.asArray();
    };

    /**
     * Hash the message data and a public key
     * @param encPubKey the public key that is used to encrypt this message
     * @returns the hash of the message data and the public key
     */
    public hash = (encPubKey: PubKey): bigint => {
        return hash13([
            ...[this.msgType],
            ...this.data,
            ...encPubKey.rawPubKey,
        ]) as bigint;
    };

    /**
     * Create a copy of the message
     * @returns a copy of the message
     */
    public copy = (): Message => {
        return new Message(
            BigInt(this.msgType.toString()),
            this.data.map((x: bigint) => BigInt(x.toString()))
        );
    };

    /**
     * Check if two messages are equal
     * @param m the message to compare with
     * @returns the result of the comparison
     */
    public equals = (m: Message): boolean => {
        if (this.data.length !== m.data.length) {
            return false;
        }
        if (this.msgType !== m.msgType) {
            return false;
        }

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== m.data[i]) {
                return false;
            }
        }

        return true;
    };

    /**
     * Serialize to a JSON object
     */
    public toJSON() {
        return this.asContractParam();
    }

    /**
     * Deserialize into a Message instance
     * @param json - the json representation
     * @returns the deserialized object as a Message instance
     */
    static fromJSON(json: any): Message {
        return new Message(
            BigInt(json.msgType),
            json.data.map((x: any) => BigInt(x))
        );
    }
}
