export const contractExists = async (
    provider: any,
    address: string,
): Promise<boolean> => {
    const code = await provider.getCode(address)
    return code.length > 2
}

export const currentBlockTimestamp = async (
    provider: any, 
): Promise<number> => {
    const blockNum = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNum)
    return Number(block.timestamp)
}