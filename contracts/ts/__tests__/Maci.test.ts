require('module-alias/register')
jest.setTimeout(90000)
import { genAccounts, genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import * as etherlime from 'etherlime-lib'
import * as ethers from 'ethers'

import {
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    genDeployer,
} from '../deploy'

import {
    genKeyPair,
    setupTree,
    NOTHING_UP_MY_SLEEVE,
} from 'maci-crypto'

const accounts = genTestAccounts(5)
const deployer = genDeployer(accounts[0].privateKey)

describe('MACI', () => {
    let maciContract
    let signUpTokenContract
    let signUpTokenGatekeeperContract
    // set up users
    const user1 = {
        wallet: accounts[1],
        keypair: genKeyPair(),
    }

    const user2 = {
        wallet: accounts[2],
        keypair: genKeyPair(),
    }

    const badUser = {
        wallet: accounts[3],
        keypair: genKeyPair(),
    }

    beforeAll(async () => {
        signUpTokenContract = await deploySignupToken(deployer)
        signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
            deployer,
            signUpTokenContract.contractAddress,
        )
        const contracts = await deployMaci(
            deployer,
            signUpTokenGatekeeperContract.contractAddress,
        )

        maciContract = contracts.maciContract

        const numEth = 0.5
        for (let i = 1; i < accounts.length; i++) {
            const tx = await deployer.provider.sendTransaction(
                accounts[0].sign({
                    nonce: await deployer.provider.getTransactionCount(accounts[0].address),
                    gasPrice: ethers.utils.parseUnits('10', 'gwei'),
                    gasLimit: 21000,
                    to: accounts[i].address,
                    value: ethers.utils.parseUnits('1', 'ether'),
                    data: '0x'
                })
            )
            const receipt = await tx.wait()
            console.log(`Gave away ${numEth} ETH to`, accounts[i].address)
        }
        
        // give away a signUpToken to each user
        await signUpTokenContract.giveToken(user1.wallet.address)
        await signUpTokenContract.giveToken(user2.wallet.address)
    })

    it('each user should own a token', async () => {
        const ownerOfToken1 = await signUpTokenContract.ownerOf(1)
        expect(ownerOfToken1).toEqual(user1.wallet.address)

        const ownerOfToken2 = await signUpTokenContract.ownerOf(2)
        expect(ownerOfToken2).toEqual(user2.wallet.address)
    })

    it('emptyVoteOptionTreeRoot should be correct', async () => {
        const tree = setupTree(
            config.merkleTrees.voteOptionTreeDepth,
            NOTHING_UP_MY_SLEEVE,
        )
        const root = await maciContract.emptyVoteOptionTreeRoot()
        expect(tree.root.toString()).toEqual(root.toString())
    })

    it('a user who does not own a SignUpToken should not be able to sign up', async () => {
        expect.assertions(1)

        const wallet = user1.wallet.connect(deployer.provider as any)
        const contract = new ethers.Contract(
            maciContract.contractAddress,
            maciContract.interface.abi,
            wallet,
        )

        try {
            await contract.signUp(
                ethers.utils.defaultAbiCoder.encode(['uint256'], [2]),
                { gasLimit: 100000 },
            )
        } catch (e) {
            expect(e.message.endsWith('SignUpTokenGatekeeper: this user does not own the token')).toBeTruthy()
        }
    })

    it('a user owns a SignUpToken should be able to sign up', async () => {
        const wallet = user1.wallet.connect(deployer.provider as any)
        const contract = new ethers.Contract(
            maciContract.contractAddress,
            maciContract.interface.abi,
            wallet,
        )
        const tx = await contract.signUp(
            ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
            { gasLimit: 100000 },
        )
        const receipt = await tx.wait()

        expect(receipt.status).toEqual(1)
    })

    it('a user who uses a previously used SignUpToken to sign up should not be able to', async () => {
        expect.assertions(3)
        const wallet = user1.wallet.connect(deployer.provider as any)
        const contract = new ethers.Contract(
            signUpTokenContract.contractAddress,
            signUpTokenContract.interface.abi,
            wallet,
        )
        const tx = await contract.safeTransferFrom(
            user1.wallet.address,
            user2.wallet.address,
            1,
            { gasLimit: 500000 },
        )

        const receipt = await tx.wait()
        expect(receipt.status).toEqual(1)

        const ownerOfToken1 = await signUpTokenContract.ownerOf(1)
        expect(ownerOfToken1).toEqual(user2.wallet.address)

        try {
            const wallet2 = user2.wallet.connect(deployer.provider as any)
            const contract2 = new ethers.Contract(
                maciContract.contractAddress,
                maciContract.interface.abi,
                wallet2,
            )
            await contract2.signUp(
                ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
                { gasLimit: 400000 },
            )
        } catch (e) {
            console.log(e.message)
            expect(e.message.endsWith('SignUpTokenGatekeeper: this token has already been used to sign up')).toBeTruthy()
        }
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
