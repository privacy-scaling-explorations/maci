import * as ethers from 'ethers'
import * as shell from 'shelljs'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as  path from 'path';
import { Vote, UserCommand } from './user'
import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

const exec = (command: string) => {
    return shell.exec('cd ../cli/ && ' + command, { silent: true })
}

const delay = (ms: number): Promise<void> => {
    return new Promise((resolve: Function) => setTimeout(resolve, ms))
}

const loadYaml = () => {
    try {
      const doc = yaml.load(fs.readFileSync(path.join(__dirname, '../../') + 'integrations.yml', 'utf8'));
      return doc
    } catch (e) {
      console.log(e);
    }
}

const genTestAccounts = (
    numAccounts: number,
    mnemonic,
) => {
    const accounts: ethers.Wallet[] = []

    for (let i=0; i<numAccounts; i++) {
        const path = `m/44'/60'/${i}'/0/0`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
        accounts.push(wallet)
    }

    return accounts
}

const genTestUserCommands = (
    numUsers: number,
    voteCreditBalance: number,
    invalidVotes: any,
    numVotesPerUser: number
) => {

    const config = loadYaml()
    let usersCommands: UserCommand[] = []
    for (let i=0; i<numUsers; i++) {
        const userKeypair = new Keypair()
        const vote: Vote = {
            voteOptionIndex: i,
            voteWeight: config.defaultVote.voteWeight,
            valid: true
        }

        const userCommand = new UserCommand(
            userKeypair,
            [vote],
            config.defaultVote.maxVoteWeight,
            config.defaultVote.nonce
        )
        usersCommands.push(userCommand)
    }
}

export { exec, delay, loadYaml, genTestAccounts }
