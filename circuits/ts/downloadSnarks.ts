import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/2zi2dlet7ziqvio/BatchUpdateStateTreeVerifier.sol?dl=1',
        },
        {
            name: 'batchUstCircuit.json',
            url: 'https://www.dropbox.com/s/kglrkfts17t5ub9/batchUstCircuit.json?dl=1',
        },
        {
            name: 'batchUstPk.bin',
            url: 'https://www.dropbox.com/s/1d1urt75uwl32mu/batchUstPk.bin?dl=1',
        },
        {
            name: 'batchUstVk.json',
            url: 'https://www.dropbox.com/s/7hjb3x1w0w7udnn/batchUstVk.json?dl=1',
        },
        {
            name: 'QuadVoteTallyVerifier.sol',
            url: 'https://www.dropbox.com/s/sb1qz788ni7prdg/QuadVoteTallyVerifier.sol?dl=1',
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/a619ih90hozhzk0/qvtCircuit.json?dl=1',
        },
        {
            name: 'qvtPk.bin',
            url: 'https://www.dropbox.com/s/jh98gtzvq9rlaeu/qvtPk.bin?dl=1',
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/5oksb932vocleif/qvtVk.json?dl=1',
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
