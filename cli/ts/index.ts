#!/usr/bin/env node
import 'source-map-support/register'

import * as argparse from 'argparse' 
import { 
    calcBinaryTreeDepthFromMaxLeaves,
    calcQuinTreeDepthFromMaxLeaves,
} from './utils'

import {
    timeTravel,
    configureSubparser as configureSubparserForTimeTravel,
} from './timeTravel'

import {
    genMaciKeypair,
    configureSubparser as configureSubparserForGenMaciKeypair,
} from './genMaciKeypair'

import {
    genMaciPubkey,
    configureSubparser as configureSubparserForGenMaciPubkey,
} from './genMaciPubkey'

import {
    deployVkRegistry,
    configureSubparser as configureSubparserForDeployVkRegistry,
} from './deployVkRegistry'

import {
    setVerifyingKeys,
    configureSubparser as configureSubparserForSetVerifyingKeys,
} from './setVerifyingKeys'

import {
    create,
    configureSubparser as configureSubparserForCreate,
} from './create'

import {
    deployPoll,
    configureSubparser as configureSubparserForDeployPoll,
} from './deployPoll'

import {
    airdrop,
    configureSubparser as configureSubparserForAirdrop,
} from './airdrop'

import {
    topup,
    configureSubparser as configureSubparserForTopup,
} from './topup'

import {
    signup,
    configureSubparser as configureSubparserForSignup,
} from './signUp'

import {
    publish,
    configureSubparser as configureSubparserForPublish,
} from './publish'

import {
    mergeMessages,
    configureSubparser as configureSubparserForMergeMessages,
} from './mergeMessages'

import {
    mergeSignups,
    configureSubparser as configureSubparserForMergeSignups,
} from './mergeSignups'

import {
    genProofs,
    configureSubparser as configureSubparserForGenProofs,
} from './genProofs'

import {
    proveOnChain,
    configureSubparser as configureSubparserForProveOnChain,
} from './proveOnChain'

/*
import {
    verify,
    configureSubparser as configureSubparserForVerify,
} from './verify'
*/

import {
    checkVerifyingKey,
    configureSubparser as configureSubparserForCheckVerifyKey,
} from './checkVerifyingKey'

const main = async () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'Minimal Anti-Collusion Infrastructure',
    })

    const subparsers = parser.addSubparsers({
        title: 'Subcommands',
        dest: 'subcommand',
    })

    // Subcommand: timeTravel
    configureSubparserForTimeTravel(subparsers)

    // Subcommand: genMaciPubkey
    configureSubparserForGenMaciPubkey(subparsers)

    // Subcommand: genMaciKeypair
    configureSubparserForGenMaciKeypair(subparsers)

    // Subcommand: deployVkRegistry
    configureSubparserForDeployVkRegistry(subparsers)

    // Subcommand: setVerifyingKeys
    configureSubparserForSetVerifyingKeys(subparsers)

    // Subcommand: create
    configureSubparserForCreate(subparsers)

    // Subcommand: deployPoll
    configureSubparserForDeployPoll(subparsers)

    // Subcommand: airdrop 
    configureSubparserForAirdrop(subparsers)

    // Subcommand: topup 
    configureSubparserForTopup(subparsers)

    // Subcommand: signup
    configureSubparserForSignup(subparsers)

    // Subcommand: publish
    configureSubparserForPublish(subparsers)

    // Subcommand: mergeMessages
    configureSubparserForMergeMessages(subparsers)

    // Subcommand: mergeSignups
    configureSubparserForMergeSignups(subparsers)

    // Subcommand: genProofs
    configureSubparserForGenProofs(subparsers)

    // Subcommand: proveOnChain
    configureSubparserForProveOnChain(subparsers)

    // Subcommand: verify
    // hehe, temp comment out
    //configureSubparserForVerify(subparsers)

    // Subcommand: checkVerifyKey
    configureSubparserForCheckVerifyKey(subparsers)

    const args = parser.parseArgs()

    // Execute the subcommand method
    if (args.subcommand === 'timeTravel') {
        await timeTravel(args)
    } else if (args.subcommand === 'genMaciKeypair') {
        await genMaciKeypair(args)
    } else if (args.subcommand === 'genMaciPubkey') {
        await genMaciPubkey(args)
    } else if (args.subcommand === 'deployVkRegistry') {
        await deployVkRegistry(args)
    } else if (args.subcommand === 'setVerifyingKeys') {
        await setVerifyingKeys(args)
    } else if (args.subcommand === 'create') {
        await create(args)
    } else if (args.subcommand === 'deployPoll') {
        await deployPoll(args)
    } else if (args.subcommand === 'airdrop') {
        await airdrop(args)
    } else if (args.subcommand === 'topup') {
        await topup(args)
    } else if (args.subcommand === 'signup') {
        await signup(args)
    } else if (args.subcommand === 'publish') {
        await publish(args)
    } else if (args.subcommand === 'mergeMessages') {
        await mergeMessages(args)
    } else if (args.subcommand === 'mergeSignups') {
        await mergeSignups(args)
    } else if (args.subcommand === 'genProofs') {
        await genProofs(args)
    } else if (args.subcommand === 'proveOnChain') {
        await proveOnChain(args)
    } /* else if (args.subcommand === 'verify') {
        await verify(args)
    } hehe temp comment out */ 
    else if (args.subcommand === 'checkVerifyingKey') {
        await checkVerifyingKey(args)
    }
}

if (require.main === module) {
    main()
}

export {
    calcBinaryTreeDepthFromMaxLeaves,
    calcQuinTreeDepthFromMaxLeaves,
}
