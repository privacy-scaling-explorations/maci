import * as assert from "assert";
import * as ethers from "ethers";
import { babyJub } from "circomlib";

// The BN254 group order p
export const SNARK_FIELD_SIZE = BigInt(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

// A nothing-up-my-sleeve zero value
// Should be equal to 8370432830353022751713833565135785980866757267633941821328460903436894336785
export const NOTHING_UP_MY_SLEEVE =
    BigInt(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Maci"))) %
    SNARK_FIELD_SIZE;

assert(
    NOTHING_UP_MY_SLEEVE ===
        BigInt(
            "8370432830353022751713833565135785980866757267633941821328460903436894336785"
        )
);

// The largest value in the babyjub curve
export const babyJubMaxValue = BigInt(babyJub.p);
