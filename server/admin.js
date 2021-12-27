const argparse = require('argparse')
const {updateRecord, removeRecord, queryRecord} = require('./db')
const {readJSONFile} = require('maci-common')

const updateSubparser = (subparsers) => {
    const createParser = subparsers.addParser(
        'update',
        { addHelp: true },
    )
    createParser.addArgument(
        ['-f', '--file_record'],
        {
            required: true,
            type: 'string',
            help: 'file location of deployed contract addresses'
        }
    )
    createParser.addArgument(
        ['-p', '--process_messages_zkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The .zkey file for the message processing circuit. '
        }
    )
    createParser.addArgument(
        ['-t', '--tally_votes_zkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The .zkey file for the vote tallying circuit. '
        }
    )
}

const removeSubparser = (subparsers) => {
    const createParser = subparsers.addParser(
        'delete',
        { addHelp: true },
    )
    createParser.addArgument(
        ['-x', '--maci_addr'],
        {
            required: true,
            type: 'string',
            help: 'Delete record of given maci address',
        }
    )
}

const querySubparser = (subparsers) => {
    const createParser = subparsers.addParser(
        'query',
        { addHelp: true },
    )
    createParser.addArgument(
        ['-x', '--maci_addr'],
        {
            required: true,
            type: 'string',
            help: 'query record of given maci address',
        }
    )
}

const update = async (args) => {
    let data = readJSONFile(args.file_record)
    if (args.process_messages_zkey) {
      data["messageZkey"] = args.process_messages_zkey
    }
    if (args.tally_votes_zkey) {
      data["tallyZkey"] = args.tally_votes_zkey
    }
    updateRecord(data)
    return 
}

const remove = async (args) => {
    removeRecord(args.maci_addr)
    return 
}

const query = async (args) => {
    queryRecord(args.maci_addr)
    return 
}



const main = async () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'MACI Database Management',
    })

    const subparsers = parser.addSubparsers({
        title: 'Subcommands',
        dest: 'subcommand',
    })

    updateSubparser(subparsers)
    removeSubparser(subparsers)
    querySubparser(subparsers)

    const args = parser.parseArgs()

    // Execute the subcommand method
    if (args.subcommand === 'update') {
        await update(args)
    } else if (args.subcommand == 'delete') {
        await remove(args)
    } else if (args.subcommand == 'query') {
        await query(args)
    }
}

if (require.main === module) {
    main()
}
