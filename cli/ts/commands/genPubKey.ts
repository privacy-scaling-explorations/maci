import { genPubKey } from "maci-crypto"
import { PrivKey, PubKey } from "maci-domainobjs"
import { banner } from "../utils/banner"
import { error, logGreen, logRed, success } from "../utils/theme"
import { GenMaciPubKeyArgs } from "../utils/interfaces"

/**
 * Generate a new Maci Public key from a private key
 * @param privKey - the user private key
 */
export const genMaciPubKey = ({
    privkey,
    quiet 
}: GenMaciPubKeyArgs): string => {
    if(!quiet) banner()

    if (!PrivKey.isValidSerializedPrivKey(privkey)) {
        logRed(error("Error, invalid private key"))
        process.exit(1)
    }

    const unserializedKey = PrivKey.unserialize(privkey)
    const pubKey = new PubKey(genPubKey(unserializedKey.rawPrivKey))

    if (!quiet) logGreen(success(`Public key: ${pubKey.serialize()}`))

    return pubKey.serialize()
}