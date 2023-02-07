export async function timeTravel(provider, seconds) {
    await provider.send('evm_increaseTime', [Number(seconds)])
    await provider.send('evm_mine', [])
}
