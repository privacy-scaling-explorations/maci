#!/usr/bin/env node
import 'source-map-support/register'

import * as argparse from 'argparse' 
import { 
    calcBinaryTreeDepthFromMaxLeaves,
    calcQuinTreeDepthFromMaxLeaves,
} from './utils'

import {
    genMaciKeypair,
    configureSubparser as configureSubparserForGenMaciKeypair,
} from './genMaciKeypair'

import {
    genMaciPubkey,
    configureSubparser as configureSubparserForGenMaciPubkey,
} from './genMaciPubkey'

import {
    create,
    configureSubparser as configureSubparserForCreate,
} from './create'

import {
    signup,
    configureSubparser as configureSubparserForSignup,
} from './signUp'

import {
    publish,
    configureSubparser as configureSubparserForPublish,
} from './publish'

import {
    genProofs,
    configureSubparser as configureSubparserForGenProofs,
} from './genProofs'

import {
    proveOnChain,
    configureSubparser as configureSubparserForProveOnChain,
} from './proveOnChain'

import {
    checkStateRoot,
    configureSubparser as configureSubparserForCheckStateRoot,
} from './checkStateRoot'

import {
    verify,
    configureSubparser as configureSubparserForVerify,
} from './verify'

import {
    processAndTallyWithoutProofs,
    configureSubparser as configureSubparserForPtwp,
} from './ptwp'

import {
    coordinatorReset,
    configureSubparser as configureSubparserForCoordinatorReset,
} from './coordinatorReset'

import {
    download,
    configureSubparser as configureSubparserForDownload,
} from './download'

import {
    replay,
    configureSubparser as configureSubparserForReplay,
} from './replay'

import {
    replayCsv,
    configureSubparser as configureSubparserForReplayCsv,
} from './replayCsv'

const main = async () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'Minimal Anti-Collusion Infrastructure',
    })

    const subparsers = parser.addSubparsers({
        title: 'Subcommands',
        dest: 'subcommand',
    })

    // Subcommand: genMaciPubkey
    configureSubparserForGenMaciPubkey(subparsers)

    // Subcommand: genMaciKeypair
    configureSubparserForGenMaciKeypair(subparsers)

    // Subcommand: create
    configureSubparserForCreate(subparsers)

    // Subcommand: signup
    configureSubparserForSignup(subparsers)

    // Subcommand: publish
    configureSubparserForPublish(subparsers)
    
    // Subcommand: checkStateRoot
    configureSubparserForCheckStateRoot(subparsers)

    // Subcommand: genProofs
    configureSubparserForGenProofs(subparsers)

    // Subcommand: proveOnChain
    configureSubparserForProveOnChain(subparsers)

    // Subcommand: verify
    configureSubparserForVerify(subparsers)

    // Subcommand: processAndTallyWithoutProofs
    configureSubparserForPtwp(subparsers)

    // Subcommand: coordinatorReset
    configureSubparserForCoordinatorReset(subparsers)

    // Subcommand: download
    configureSubparserForDownload(subparsers)

    // Subcommand: replay
    configureSubparserForReplay(subparsers)

    // Subcommand: replayCsv
    configureSubparserForReplayCsv(subparsers)

    const args = parser.parseArgs()

    // Execute the subcommand method
    if (args.subcommand === 'genMaciKeypair') {
        await genMaciKeypair(args)
    } else if (args.subcommand === 'genMaciPubkey') {
        await genMaciPubkey(args)
    } else if (args.subcommand === 'create') {
        await create(args)
    } else if (args.subcommand === 'signup') {
        await signup(args)
    } else if (args.subcommand === 'publish') {
        await publish(args)
    } else if (args.subcommand === 'checkStateRoot') {
        await checkStateRoot(args)
    } else if (args.subcommand === 'genProofs') {
        await genProofs(args)
    } else if (args.subcommand === 'proveOnChain') {
        await proveOnChain(args)
    } else if (args.subcommand === 'verify') {
        await verify(args)
    } else if (args.subcommand === 'processAndTallyWithoutProofs') {
        await processAndTallyWithoutProofs(args)
    } else if (args.subcommand === 'coordinatorReset') {
        await coordinatorReset(args)
    } else if (args.subcommand === 'download') {
        await download(args)
    } else if (args.subcommand === 'replay') {
        await replay(args)
    } else if (args.subcommand === 'replayCsv') {
        await replayCsv(args)
    }
}

if (require.main === module) {
    main()
}

export {
    genProofs,
    proveOnChain,
    coordinatorReset,
    download,
    replay,
    replayCsv,
    verify,
    processAndTallyWithoutProofs,
    calcBinaryTreeDepthFromMaxLeaves,
    calcQuinTreeDepthFromMaxLeaves,
}
