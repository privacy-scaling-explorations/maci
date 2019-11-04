// @flow
const {
  maciContract,
  cmdTreeContract,
  signUpTokenContract
} = require('./utils/contracts')

const { stringifyBigInts } = require('./utils/helpers')
const { ganacheConfig }= require('../maci-config')
const { randomPrivateKey, privateToPublicKey, signAndEncrypt } = require('./utils/crypto')

const ethers = require('ethers')
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

const coordinatorWallet = new ethers.Wallet(ganacheConfig.privateKey, provider)

const user1Wallet = new ethers.Wallet(
  '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37',
  provider
)
const user2Wallet = new ethers.Wallet(
  '0x9b813e37fdeda1dd8beb146a88318718b186eafd276d703312702717c8e3b14b',
  provider
)

const coordinatorSecretKey = randomPrivateKey()
const coordinatorPublicKey = privateToPublicKey(coordinatorSecretKey)

const user1SecretKey = randomPrivateKey()
const user1PublicKey = privateToPublicKey(user1SecretKey)
const user1Message = [...user1PublicKey, 0n]
const user1EncryptedMsg = signAndEncrypt(
  user1Message,
  user1SecretKey,
  user1SecretKey,
  coordinatorPublicKey
)

const main = async () => {
  // Try and sign up, make sure they fail
  const maciUser1Contract = maciContract.connect(user1Wallet)
  try {
    await maciUser1Contract.signUp(
      stringifyBigInts(user1EncryptedMsg),
      stringifyBigInts(user1PublicKey)
    )
    throw new Error('User 1 should not be able to sign up yet')
  } catch (e) {}

  // 1. Mint some tokens and xfer to user1 and user2
  const signUpTokenOwnerContract = signUpTokenContract.connect(coordinatorWallet)
  await signUpTokenOwnerContract.giveToken(user1Wallet.address)
  await signUpTokenOwnerContract.giveToken(user2Wallet.address)

  // 2. User sends token to contract
  const signUpTokenUser1Contract = signUpTokenContract.connect(user1Wallet)
  await signUpTokenUser1Contract.safeTransferFrom(
    user1Wallet.address.toString(),
    maciContract.address.toString(),
    0
  )

  const oldRoot = await cmdTreeContract.getRoot()

  // Now user should be able to sign up
  await maciUser1Contract.signUp(
    stringifyBigInts(user1EncryptedMsg),
    stringifyBigInts(user1PublicKey)
  )

  const newRoot = await cmdTreeContract.getRoot()

  console.log(`Old root: ${oldRoot.toString()}`)
  console.log(`New root: ${newRoot.toString()}`)
}

main()
