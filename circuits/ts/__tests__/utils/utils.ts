import { CircuitT } from "./types"

/**
 * Convert a string to a bigint
 * @param s - the string to convert
 * @returns the bigint representation of the string 
 */
export const str2BigInt = (s: string): bigint => {
    return BigInt(parseInt(
        Buffer.from(s).toString('hex'), 16
    ))
}

// @note thanks https://github.com/Rate-Limiting-Nullifier/circom-rln/blob/main/test/utils.ts
// for the code below
/**
 * Get a signal from the circuit
 * @param circuit - the circuit object
 * @param witness - the witness
 * @param name - the name of the signal
 * @returns the signal value
 */
export const getSignal = async (circuit: CircuitT, witness: bigint[], name: string): Promise<bigint> => {
    const prefix = "main"
    // E.g. the full name of the signal "root" is "main.root"
    // You can look up the signal names using `circuit.getDecoratedOutput(witness))`
    const signalFullName = `${prefix}.${name}`;
    await circuit.loadSymbols();

    // symbols[n] = { labelIdx: 1, varIdx: 1, componentIdx: 142 },
    const signalMeta = circuit.symbols[signalFullName];

    // Assigned value of the signal is located in the `varIdx`th position
    // of the witness array
    const indexInWitness = signalMeta.varIdx;
    return BigInt(witness[indexInWitness]);
};

/**
 * Generate a random number within a certain threshold
 * @param upper - the upper bound 
 * @returns the random index
 */
export const generateRandomIndex = (upper: number): number => {
    return Math.floor(Math.random() * (upper - 1))
}
