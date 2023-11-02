import {
    Keypair
} from "maci-domainobjs"
import { banner } from "../utils/banner"
import { logGreen, success } from "../utils/theme"
import { GenKeyPairArgs } from "../utils"

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 */
export const genKeyPair = ({
    quiet
}: GenKeyPairArgs) => {
    if(!quiet) banner()
    const keypair = new Keypair()

    const serializedPubKey = keypair.pubKey.serialize()
    const serializedPrivKey = keypair.privKey.serialize()

    logGreen(success(`Public key: ${serializedPubKey}`))
    logGreen(success(`Private key: ${serializedPrivKey}`))

    return {
        publicKey: serializedPubKey,
        privateKey: serializedPrivKey
    }
}
