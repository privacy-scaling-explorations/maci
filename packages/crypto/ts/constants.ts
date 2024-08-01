import { r } from "@zk-kit/baby-jubjub";
import { keccak256, toUtf8Bytes } from "ethers";

import assert from "assert";

export const SNARK_FIELD_SIZE = r;

// A nothing-up-my-sleeve zero value
// Should be equal to 8370432830353022751713833565135785980866757267633941821328460903436894336785
export const NOTHING_UP_MY_SLEEVE = BigInt(keccak256(toUtf8Bytes("Maci"))) % SNARK_FIELD_SIZE;

assert(NOTHING_UP_MY_SLEEVE === BigInt("8370432830353022751713833565135785980866757267633941821328460903436894336785"));
