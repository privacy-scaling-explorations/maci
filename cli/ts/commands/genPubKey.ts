import { genPubKey } from "maci-crypto"
import { PrivKey, PubKey } from "maci-domainobjs"
import { banner } from "../utils/banner"
import { error, logGreen, logRed, success } from "../utils/theme"

/**
 * Generate a new Maci Public key from a private key
 * @param privKey - the user private key
 * @param quiet - whether to log the output
 * @return the public key serialized
 */
export const genMaciPubKey = (
    privkey: string,
    quiet?: boolean 
): string => {
    if(!quiet) banner()

    // we check that the provided private key is valid
    if (!PrivKey.isValidSerializedPrivKey(privkey)) {
        logRed(error("Error, invalid private key"))
        process.exit(1)
    }

    // de serialize it and generate the public key
    const unserializedKey = PrivKey.unserialize(privkey)
    const pubKey = new PubKey(genPubKey(unserializedKey.rawPrivKey))

    if (!quiet) logGreen(success(`Public key: ${pubKey.serialize()}`))
    // we give back the serialized public key
    return pubKey.serialize()
}