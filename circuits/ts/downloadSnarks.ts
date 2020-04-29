import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/274mzvyiizhsval/BatchUpdateStateTreeVerifier.sol?dl=1',
        },
        {
            name: 'batchUstCircuit.json',
            url: 'https://www.dropbox.com/s/4b1ziz37eeergx2/batchUstCircuit.json?dl=1',
        },
        {
            name: 'batchUst.params',
            url: 'https://www.dropbox.com/s/c44qytgvqlob9ye/batchUst.params?dl=1',
        },
        {
            name: 'batchUstVk.json',
            url: 'https://www.dropbox.com/s/pyggzvn5hqwi3qz/batchUstVk.json?dl=1',
        },
        {
            name: 'QuadVoteTallyVerifier.sol',
            url: 'https://www.dropbox.com/s/it1o3rput47n26m/QuadVoteTallyVerifier.sol?dl=1',
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/7u7iunswmg67pso/qvt.params?dl=1',
        },
        {
            name: 'qvt.params',
            url: 'https://www.dropbox.com/s/7u7iunswmg67pso/qvt.params?dl=1'
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/wp96mtjq7zbxceh/qvtVk.json?dl=1',
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
