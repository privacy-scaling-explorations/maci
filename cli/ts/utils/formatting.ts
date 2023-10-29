export const asHex = (val: any): string => '0x' + BigInt(val).toString(16)
