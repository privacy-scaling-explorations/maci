/**
 * Calculates the total of a tally result
 * @param tallyResult - the tally result
 * @returns the total of the tally result
 */
export const calculateTotal = (tallyResult: bigint[]): bigint => tallyResult.reduce((acc, v) => acc + v, BigInt(0));
