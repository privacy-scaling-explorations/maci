require('module-alias/register')
import { genAccounts, genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import * as etherlime from 'etherlime-lib'

import { deployAllContracts } from '../deploy'

const accounts = genTestAccounts()
let deployer
let maciContract
describe('MACI', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )
        const contracts = await deployAllContracts(deployer)
        maciContract = contracts.maciContract
    })

    it('should be deployed', async () => {
        expect(maciContract.contractAddress.startsWith('0x')).toBeTruthy()
    })
})

//const {
  //randomPrivateKey,
  //privateToPublicKey,
  //signAndEncrypt
//} = require('../_build/utils/crypto')

//const {
  //maciContract,
  //stateTreeContract,
  //cmdTreeContract,
  //signUpTokenContract
//} = require('../_build/utils/contracts')

//const { stringifyBigInts } = require('../_build/utils/helpers')

//const { ganacheConfig } = require('../maci-config')

//const ethers = require('ethers')
//const provider = new ethers.providers.JsonRpcProvider(ganacheConfig.host)

//describe('MACI', () => {
  //describe('#SmartContract', () => {
    //it('Logic sequence testing', async () => {
      //// Wallet setup
      //const coordinatorWallet = new ethers.Wallet(ganacheConfig.privateKey, provider)

      //const user1Wallet = new ethers.Wallet(
        //'0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37',
        //provider
      //)
      //const user2Wallet = new ethers.Wallet(
        //'0x9b813e37fdeda1dd8beb146a88318718b186eafd276d703312702717c8e3b14b',
        //provider
      //)

      //// Setup User messages etc
      //const coordinatorPublicKeyRaw = await maciContract.getCoordinatorPublicKey()
      //const coordinatorPublicKey = coordinatorPublicKeyRaw.map(x => BigInt(x.toString()))

      //const user1SecretKey = randomPrivateKey()
      //const user1PublicKey = privateToPublicKey(user1SecretKey)
      //const user1Message = [...user1PublicKey, 0n]
      //const user1EncryptedMsg = signAndEncrypt(
        //user1Message,
        //user1SecretKey,
        //user1SecretKey,
        //coordinatorPublicKey
      //)
      //// Change votes, and add in user index
      //const user1NewEncryptedMsg = signAndEncrypt(
        //[0n, ...user1Message], // New message needs to have index in the first value
        //user1SecretKey,
        //user1SecretKey,
        //coordinatorPublicKey
      //)

      //const user2SecretKey = randomPrivateKey()
      //const user2PublicKey = privateToPublicKey(user2SecretKey)
      //const user2Message = [...user2PublicKey, 0n]
      //const user2EncryptedMsg = signAndEncrypt(
        //user2Message,
        //user2SecretKey,
        //user2SecretKey,
        //coordinatorPublicKey
      //)

      //// Variable declaration
      //let oldRoot
      //let newRoot

      //// User sign up tokens
      //let user1TokenIds = []
      //let user2TokenIds = []

      //let curTokenId

      //const maciUser1Contract = maciContract.connect(user1Wallet)
      //const maciUser2Contract = maciContract.connect(user2Wallet)

      //// Try and publish a command, it needs to fail
      //try {
        //await maciContract.publishCommand(
          //stringifyBigInts(user1EncryptedMsg),
          //stringifyBigInts(user1PublicKey)
        //)
        //throw new Error('Should not be able to publish commands yet')
      //} catch (e) {}

      //// Try and sign up, make sure it fails
      //// Fails because user1 and user2 hasn't sent
      //// any erc721 tokens to the contract yet
      //try {
        //await maciUser1Contract.signUp(
          //stringifyBigInts(user1EncryptedMsg),
          //stringifyBigInts(user1PublicKey)
        //)
        //throw new Error('User 1 should not be able to sign up yet')
      //} catch (e) {}

      //try {
        //await maciUser2Contract.signUp(
          //stringifyBigInts(user2EncryptedMsg),
          //stringifyBigInts(user2PublicKey)
        //)
        //throw new Error('User 2 should not be able to sign up yet')
      //} catch (e) {}

      //// 1. Mint some tokens and xfer to user1 and user2
      //const signUpTokenOwnerContract = signUpTokenContract.connect(coordinatorWallet)

      //// User 1 gets 2 tokens (make sure force close logic works)
      //curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      //user1TokenIds.push(curTokenId.toString())
      //await signUpTokenOwnerContract.giveToken(user1Wallet.address)

      //curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      //user1TokenIds.push(curTokenId.toString())
      //await signUpTokenOwnerContract.giveToken(user1Wallet.address)

      //// User 2 gets 1 token
      //curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      //user2TokenIds.push(curTokenId.toString())
      //await signUpTokenOwnerContract.giveToken(user2Wallet.address)

      //// 2. User 1 sends token to contract
      //const signUpTokenUser1Contract = signUpTokenContract.connect(user1Wallet)
      //await signUpTokenUser1Contract.safeTransferFrom(
        //user1Wallet.address.toString(),
        //maciContract.address.toString(),
        //user1TokenIds.pop() // Note: This is the token id param
      //)
      //await signUpTokenUser1Contract.safeTransferFrom(
        //user1Wallet.address.toString(),
        //maciContract.address.toString(),
        //user1TokenIds.pop() // Note: This is the token id param
      //)

      //// Checks if sign up period has ended
      //const signUpPeriodEnded = await maciContract.hasSignUpPeriodEnded()

      //if (signUpPeriodEnded) {
        //throw new Error('Sign Up period ended!')
      //}

      //oldRoot = await stateTreeContract.getRoot()

      //// Now user should be able to sign up
      //await maciUser1Contract.signUp(
        //stringifyBigInts(user1EncryptedMsg),
        //stringifyBigInts(user1PublicKey)
      //)

      //newRoot = await stateTreeContract.getRoot()

      //// Make sure that when user signs up,
      //// contract stateTree updates its root
      //if (oldRoot.toString() === newRoot.toString()) {
        //throw new Error('stateTree in contract not updated for user 1!')
      //}

      //// 3. User 2 sends token to contract
      //const signUpTokenUser2Contract = signUpTokenContract.connect(user2Wallet)
      //await signUpTokenUser2Contract.safeTransferFrom(
        //user2Wallet.address.toString(),
        //maciContract.address.toString(),
        //user2TokenIds.pop() // Note: Token id has changed
      //)

      //oldRoot = await stateTreeContract.getRoot()

      //// Now user should be able to sign up
      //await maciUser2Contract.signUp(
        //stringifyBigInts(user2EncryptedMsg),
        //stringifyBigInts(user2PublicKey)
      //)

      //newRoot = await stateTreeContract.getRoot()

      //// Make sure that when user signs up,
      //// contract commandTree updates its root
      //if (oldRoot.toString() === newRoot.toString()) {
        //throw new Error('stateTree in contract not updated for user 2!')
      //}

      //// 4. Forcefully close signup period
      //await maciContract.endSignUpPeriod()

      //// 5. Make sure users can't vote anymore
      //// (Even though they have sent some tokens)
      //try {
        //await maciUser1Contract.signUp(
          //stringifyBigInts(user1EncryptedMsg),
          //stringifyBigInts(user1PublicKey)
        //)
        //throw new Error('User 1 should not be able to sign up anymore')
      //} catch (e) {}

      //// 6. Make sure users can publish new commands now
      //// Note: Everyone can publish a command, the coordinator
      ////       to be able to decrypt it in order to add it into the state tree
      //oldRoot = await cmdTreeContract.getRoot()
      //await maciUser1Contract.publishCommand(
        //stringifyBigInts(user1NewEncryptedMsg),
        //stringifyBigInts(user1PublicKey)
      //)
      //newRoot = await cmdTreeContract.getRoot()

      //// Make sure that when user signs up,
      //// contract commandTree updates its root
      //if (oldRoot.toString() === newRoot.toString()) {
        //throw new Error('commandTree in contract not updated for publishCommand!')
      //}
    //})
  //})
//})
