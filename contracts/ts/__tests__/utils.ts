export async function timeTravel(provider, seconds) {
    await provider.send('evm_increaseTime', seconds)
    await provider.send('evm_mine')
}