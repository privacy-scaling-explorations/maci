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
            help: 'Insert or update the records from the local file into mongodb',
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
    let contractAddrs = readJSONFile(args.file_record)
    updateRecord(contractAddrs)
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
