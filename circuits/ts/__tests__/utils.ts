export const str2BigInt = (s: string): BigInt => {
    return BigInt(parseInt(Buffer.from(s).toString("hex"), 16));
};

// thanks https://github.com/Rate-Limiting-Nullifier/circom-rln/blob/main/test/utils.ts
// for the code below

// ffjavascript has no types so leave circuit with untyped
type CircuitT = any;

export const getSignal = async (
    circuit: CircuitT,
    witness: bigint[],
    name: string
): Promise<bigint> => {
    const prefix = "main";
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

export const STATE_TREE_DEPTH = 10;
