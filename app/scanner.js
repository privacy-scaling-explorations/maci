// Getting events
// https://github.com/ethers-io/ethers.js/issues/463

const { maciContract } = require('./utils/contracts')

const ethers = require('ethers')
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

// Filter sign up events
const signUpFilter = maciContract.filters.SignedUp()
signUpFilter.fromBlock = 0
signUpFilter.toBlock = 'latest'

// Filter command published events
const commandPublishedFilter = maciContract.filters.CommandPublished()
commandPublishedFilter.fromBlock = 0
commandPublishedFilter.toBlock = 'latest'

// Get events
const main = async () => {
  // Get sign up logs
  const signUpLogsRaw = await provider.getLogs(signUpFilter)
  const signUpLogs = signUpLogsRaw.map(x => maciContract.interface.parseLog(x))

  // Get command published logs
  const commandPublishedLogsRaw = await provider.getLogs(commandPublishedFilter)
  const commandPublishedLogs = commandPublishedLogsRaw.map(x => maciContract.interface.parseLog(x))

  console.log(signUpLogs)
  console.log(commandPublishedLogs)
}

main()
