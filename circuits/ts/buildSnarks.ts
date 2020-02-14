import * as argparse from 'argparse' 
import * as fs from 'fs'
import * as path from 'path'
import * as shell from 'shelljs'
import * as tmpDir from 'temp-dir'

const fileExists = (filepath: string): boolean => {
    const currentPath = path.join(__dirname, '..')
    const inputFilePath = path.join(currentPath, filepath)
    const inputFileExists = fs.existsSync(inputFilePath)

    return inputFileExists
}

const main = async () => {
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
        ['-j', '--json-out'],
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
        ['-r', '--override'],
        {
            help: 'Override existing files if set to true; otherwise (and by default), skip generation if a file already exists',
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
    const pkOut = args.pk_out
    const vkOut = args.vk_out
    const solOut = args.sol_out
    const inputFile = args.input
    const override = args.override
    const circuitJsonOut = args.json_out
    const verifierName = args.verifier_name

    // Check if the input circom file exists
    const inputFileExists = fileExists(inputFile)

    // Exit if it does not
    if (!inputFileExists) {
        console.error('File does not exist:', inputFile)
        return
    }

    // Set memory options for node
    shell.env['NODE_OPTIONS'] = '--max-old-space-size=4096'

    // Check if the circuitJsonOut file exists and if we should not override files
    const circuitJsonOutFileExists = fileExists(circuitJsonOut)

    if (!override && circuitJsonOutFileExists) {
        console.log(circuitJsonOut, 'exists. Skipping compilation.')
    } else {
        shell.exec(`circom ${inputFile} -o ${circuitJsonOut}`)
        console.log('Generated', circuitJsonOut)
    }

    // Check if the pkOut and vkOut files exist and if we should not override files
    const pkOutFileExists = fileExists(pkOut)
    const vkOutFileExists = fileExists(vkOut)

    if (!override && pkOutFileExists && vkOutFileExists) {

        console.log('Proving and verification keys exist. Skipping setup.')

    } else {

        console.log('Generating proving and verification keys...')
        const tempPkJsonPath = path.join(tmpDir, Date.now().toString() + 'pk.json')
        shell.exec(
            `snarkjs setup -c ${circuitJsonOut} --protocol groth --pk ${tempPkJsonPath} --vk ${vkOut}`
        )

        const buildpkeyFilePath = path.join(
            __dirname,
            '..',
            './node_modules/websnark/tools/buildpkey.js',
        )

        const cmd = `node ${buildpkeyFilePath} -i ${tempPkJsonPath} -o ${pkOut}`
        shell.exec(cmd)
        shell.rm('-f', tempPkJsonPath)

        console.log('Generated', pkOut, 'and', vkOut)
    }

    // Check if the solOut file exists and if we should not override files
    const solOutFileExists = fileExists(solOut)

    if (!override && solOutFileExists) {

        console.log('Solidity verifier exists. Skipping generation.')

    } else {

        console.log('Generating Solidity verifier...')
        const cmd = `snarkjs generateverifier --vk ${vkOut} -v ${solOut}`
        shell.exec(cmd)

        // Replace the name of the verifier contract with the specified name as
        // we have two verifier contracts and we want to avoid conflicts
        const contractSource = fs.readFileSync(solOut).toString()
        const newSource = contractSource.replace(
            '\ncontract Verifier {', `\ncontract ${verifierName} {`,
        )

        fs.writeFileSync(solOut, newSource)
    }
}

if (require.main === module) {
    try {
        main()
    } catch (err) {
        console.error(err)
    }
}
