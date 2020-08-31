import * as argparse from 'argparse' 
import * as fs from 'fs'
import * as path from 'path'
import * as shell from 'shelljs'

const PTAU_URL = 'https://www.dropbox.com/s/s1mxm2uyli9dox9/pot17_final.ptau?dl=1'

const fileExists = (filepath: string): boolean => {
    const currentPath = path.join(__dirname, '..')
    const inputFilePath = path.join(currentPath, filepath)
    const inputFileExists = fs.existsSync(inputFilePath)

    return inputFileExists
}

const main = () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'Compile a circom circuit and generate its proving key, verification key, and Solidity verifier'
    })

    parser.addArgument(
        ['-i', '--input'],
        {
            help: 'The filepath of the circom file',
            required: true
        }
    )

    parser.addArgument(
        ['-j', '--r1cs-out'],
        {
            help: 'The filepath to save the compiled circom file',
            required: true
        }
    )

    parser.addArgument(
        ['-v', '--vk-out'],
        {
            help: 'The filepath to save the verification key',
            required: true
        }
    )

    parser.addArgument(
        ['-p', '--pk-out'],
        {
            help: 'The filepath to save the proving key (as a .bin file)',
            required: true
        }
    )

    parser.addArgument(
        ['-s', '--sol-out'],
        {
            help: 'The filepath to save the Solidity verifier contract',
            required: true
        }
    )

    parser.addArgument(
        ['-z', '--zkey-out'],
        {
            help: 'The filepath to save the zkey file',
            required: true
        }
    )

    parser.addArgument(
        ['-r', '--override'],
        {
            help: 'Override an existing compiled circuit, proving key, and verifying key if set to true; otherwise (and by default), skip generation if a file already exists',
            action: 'storeTrue',
            required: false,
            argumentDefault: false,
        }
    )

    parser.addArgument(
        ['-vs', '--verifier-name'],
        {
            help: 'The desired name of the verifier contract',
            required: true
        }
    )

    const args = parser.parseArgs()
    const vkOut = args.vk_out
    const zkeyOut = args.zkey_out
    const solOut = args.sol_out
    const inputFile = args.input
    const override = args.override
    const circuitOut = args.r1cs_out
    const verifierName = args.verifier_name

    // Check if the input circom file exists
    const inputFileExists = fileExists(inputFile)

    // Exit if it does not
    if (!inputFileExists) {
        console.error('File does not exist:', inputFile)
        return 1
    }

    // Set memory options for node
    shell.env['NODE_OPTIONS'] = '--max-old-space-size=8192'

    // Check if the circuitOut file exists and if we should not override files
    const circuitOutFileExists = fileExists(circuitOut)

    const circomPath = path.join(__dirname, '../node_modules/circom/cli.js')

    if (!override && circuitOutFileExists) {
        console.log(circuitOut, 'exists. Skipping compilation.')
    } else {
        console.log(`Compiling ${inputFile}...`)
        // Compile the .circom file
        shell.exec(`node --max-old-space-size=8192 ${circomPath} -f ${inputFile} -r ${circuitOut}`)
        console.log('Generated', circuitOut)
    }

    // Download the ptau file
    console.log('Downloading the .ptau file')
    const ptauPath = path.join(__dirname, '../build/pot17_final.ptau')
    const dlCmd = `wget -nc -q -O ${ptauPath} ${PTAU_URL}`
    shell.exec(dlCmd)

    // Generate the zkey file

    const zkeyFileExists = fileExists(zkeyOut)
    const vkOutFileExists = fileExists(vkOut)

    const snarkjsPath = path.join(
        __dirname,
        '..',
        './node_modules/snarkjs/build/cli.cjs',
    )

    if (!override && zkeyFileExists && vkOutFileExists) {
        console.log('zkey file exists. Skipping setup.')
    } else {

        console.log('Generating zkey file...')
        shell.exec(`node ${snarkjsPath} zkey new ${circuitOut} ${ptauPath} ${zkeyOut}`)

        console.log('Exporting verification key...')
        shell.exec(`node ${snarkjsPath} zkev ${zkeyOut} ${vkOut}`)

        console.log(`Generated ${zkeyOut} and ${vkOut}`)
    }

    console.log('Generating Solidity verifier...')
    shell.exec(`node ${snarkjsPath} zkesv ${zkeyOut} ${solOut}`)

    // Replace the name of the verifier contract with the specified name as
    // we have two verifier contracts and we want to avoid conflicts
    const contractSource = fs.readFileSync(solOut).toString()
    const newSource = contractSource.replace(
        '\ncontract Verifier {', `\ncontract ${verifierName} {`,
    )

    fs.writeFileSync(solOut, newSource)
    return 0
}

if (require.main === module) {
    let exitCode;
    try {
        exitCode = main()
    } catch (err) {
        console.error(err)
        exitCode = 1
    }
    process.exit(exitCode)
}
