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
    // create the new rando keypair
    const keypair = new Keypair()

    // serialize both private and public keys
    const serializedPubKey = keypair.pubKey.serialize()
    const serializedPrivKey = keypair.privKey.serialize()

    if (!quiet) logGreen(success(`Public key: ${serializedPubKey}`))
    if (!quiet) logGreen(success(`Private key: ${serializedPrivKey}`))

    return {
        publicKey: serializedPubKey,
        privateKey: serializedPrivKey
    }
}
