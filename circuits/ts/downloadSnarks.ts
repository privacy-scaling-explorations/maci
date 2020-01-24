import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/j5igd12smolafwt/BatchUpdateStateTreeVerifier.sol?dl=1',
        },
        {
            name: 'batchUstCircuit.json',
            url: 'https://www.dropbox.com/s/548dm12u9d0zutn/batchUstCircuit.json?dl=1'
        },
        {
            name: 'batchUstPk.bin',
            url: 'https://www.dropbox.com/s/c3gibqt4za3jlrx/batchUstPk.bin?dl=1'
        },
        {
            name: 'batchUstVk.json',
            url: 'https://www.dropbox.com/s/sf0c145dv9psj31/batchUstVk.json?dl=1'
        },
        {
            name: 'QuadVoteTallyVerifier.sol',
            url: 'https://www.dropbox.com/s/rrvlj781umrrxul/QuadVoteTallyVerifier.sol?dl=1'
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/fiy5j3dhbdcxmw4/qvtCircuit.json?dl=1'
        },
        {
            name: 'qvtPk.bin',
            url: 'https://www.dropbox.com/s/7bacxvwlysvmr6y/qvtPk.bin?dl=1'
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/p7m1ofv4mjyu00z/qvtVk.json?dl=1'
        },
    ]

	for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = path.join(__dirname, file.name)
        const cmd = `wget --quiet ${file.url} -O ${filePath}`

        console.log('Downloading', file.name)
        await shell.exec(cmd)
	}
}

if (require.main === module) {
    try {
        main()
    } catch (err) {
        console.error(err)
    }
}
