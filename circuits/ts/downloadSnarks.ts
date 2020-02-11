import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/wzhuhzfl3xbiw8c/BatchUpdateStateTreeVerifier.sol?dl=1',
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
            url: 'https://www.dropbox.com/s/8rc30ka6o9k0hyv/QuadVoteTallyVerifier.sol?dl=1',
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/uufh10dj2gqg2vb/qvtCircuit.json?dl=1',
        },
        {
            name: 'qvtPk.bin',
            url: 'https://www.dropbox.com/s/3vc5mnyaye4q93j/qvtPk.bin?dl=1',
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/9i47a2hk8k0qop0/qvtVk.json?dl=1',
        },
    ]

	for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = path.join(__dirname, file.name)
        const cmd = `wget -nc --quiet ${file.url} -O ${filePath}`

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
