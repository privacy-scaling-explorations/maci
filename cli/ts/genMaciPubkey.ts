import {
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import {
    genPubKey,
} from 'maci-crypto'

const configureSubparser = (subparsers: any) => {
    const genMaciPubkeyParser = subparsers.addParser(
        'genMaciPubkey',
        { addHelp: true },
    )

    genMaciPubkeyParser.addArgument(
        ['-sk', '--privkey'],
        {
            required: true,
            action: 'store',
            type: 'string',
            help: 'This command will output the serialized public key associated with this serialized private key.',
        }
    )
}

const genMaciPubkey = async (args: any) => {
    const isValid = PrivKey.isValidSerializedPrivKey(args.privkey)
    if (!isValid) {
        console.error('Error: invalid private key')
        return
    }

    const unserialisedPrivkey = PrivKey.unserialize(args.privkey)
    const pubkey = new PubKey(genPubKey(unserialisedPrivkey.rawPrivKey))
    console.log(pubkey.serialize())
}

export {
    genMaciPubkey,
    configureSubparser,
}
