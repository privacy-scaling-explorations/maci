import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs"
import { info, logError, logGreen } from "../utils/theme"
import { readContractAddress } from "../utils/storage"
import { contractExists } from "../utils/contracts"
import { getDefaultSigner, parseArtifact } from "maci-contracts"
import { promptPwd } from "../utils/prompts"
import { validateSalt } from "../utils/salt"
import { genRandomSalt } from "maci-crypto"
import { Contract } from "ethers"
import { PublishArgs } from "../utils/interfaces"
import { banner } from "../utils/banner"

/**
 * Publish a new message to a MACI Poll contract
 * @param options - the publish command options 
 * @returns the ephemeral private key used to encrypt the message
 */
export const publish = async ({
    quiet,
    pubkey,
    maciContractAddress,
    privateKey,
    stateIndex,
    voteOptionIndex,
    nonce,
    salt,
    pollId,
    newVoteWeight
}: PublishArgs): Promise<string> => {
    if(!quiet) banner()

    // validate that the pub key of the user is valid
    if (!PubKey.isValidSerializedPubKey(pubkey)) logError('invalid MACI public key')
    // deserialize
    const userMaciPubKey = PubKey.deserialize(pubkey)

    if (!readContractAddress("MACI") && !maciContractAddress) logError('MACI contract address is empty')

    const maciAddress = maciContractAddress ? maciContractAddress: readContractAddress("MACI")

    const signer = await getDefaultSigner()
    if (!(await contractExists(signer.provider, maciAddress))) logError('MACI contract does not exist')

    const userPrivKey = privateKey ? privateKey : await promptPwd('Insert your MACI private key')

    if (!PrivKey.isValidSerializedPrivKey(userPrivKey)) logError('Invalid MACI private key')

    const userMaciPrivKey = PrivKey.deserialize(userPrivKey)

    // validate args
    if (voteOptionIndex < 0) logError('invalid vote option index')
    // check < 1 cause index zero is a blank state leaf
    if (stateIndex < 1) logError('invalid state index')
    if (nonce < 0) logError('invalid nonce')

    if (salt) if (!validateSalt(salt)) logError('Invalid salt')
    const userSalt = salt ? BigInt(salt) : genRandomSalt()
    
    if (pollId < 0) logError('Invalid poll id')

    const maciContractAbi = parseArtifact('MACI')[0]
    const pollContractAbi = parseArtifact('Poll')[0]

    const maciContract = new Contract(
        maciAddress,
        maciContractAbi,
        signer
    )

    const pollAddress = await maciContract.getPoll(pollId)
    if (!(await contractExists(signer.provider, pollAddress))) logError('Poll contract does not exist')

    const pollContract = new Contract(
        pollAddress,
        pollContractAbi,
        signer
    )

    const maxValues = await pollContract.maxValues()
    const coordinatorPubKeyResult = await pollContract.coordinatorPubKey()
    const maxVoteOptions = Number(maxValues.maxVoteOptions)

    // validate the vote options index against the max leaf index on-chain
    if (maxVoteOptions < voteOptionIndex) logError('Invalid vote option index')

    const coordinatorPubKey = new PubKey([
        BigInt(coordinatorPubKeyResult.x.toString()),
        BigInt(coordinatorPubKeyResult.y.toString())
    ])

    const _newVoteWeight = BigInt(newVoteWeight)

    const encKeypair = new Keypair()

    const command: PCommand = new PCommand(
        BigInt(stateIndex),
        userMaciPubKey,
        BigInt(voteOptionIndex),
        _newVoteWeight,
        BigInt(nonce),
        BigInt(pollId),
        userSalt
    )

    // sign the command with the user private key
    const signature = command.sign(userMaciPrivKey)
    // encrypt the command using a shared key between the user and the coordinator
    const message = command.encrypt(
        signature,
        Keypair.genEcdhSharedKey(
            encKeypair.privKey,
            coordinatorPubKey
        )
    )

    try {
        const tx = await pollContract.publishMessage(
            message.asContractParam(),
            encKeypair.pubKey.asContractParam(),
            { gasLimit: 10000000 }
        )

        const receipt = await tx.wait()
        if (receipt.status !== 1) logError('Transaction failed')

        if (!quiet) {
            logGreen(info(`Transaction hash: ${tx.hash}`))
            logGreen(info(`Ephemeral private key: ${encKeypair.privKey.serialize()}`))
        }
    } catch (error: any) {
        logError(error.message)
    }

    return encKeypair.privKey.serialize()
}
