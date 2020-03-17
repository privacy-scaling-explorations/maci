import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/sxzoz4di2qvmw7j/BatchUpdateStateTreeVerifier.sol?dl=1',
        },
        {
            name: 'batchUstCircuit.json',
            url: 'https://www.dropbox.com/s/0ssyiq83dk3d8lc/batchUstCircuit.json?dl=1',
        },
        {
            name: 'batchUstPk.bin',
            url: 'https://www.dropbox.com/s/typemzqabjo195q/batchUstPk.bin?dl=1',
        },
        {
            name: 'batchUstVk.json',
            url: 'https://www.dropbox.com/s/khsnl7ixtw5ksym/batchUstVk.json?dl=1',
        },
        {
            name: 'QuadVoteTallyVerifier.sol',
            url: 'https://www.dropbox.com/s/7apbpbwgfgtxfnc/QuadVoteTallyVerifier.sol?dl=1',
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/nucj8dat4udlpb0/qvtCircuit.json?dl=1',
        },
        {
            name: 'qvtPk.bin',
            url: 'https://www.dropbox.com/s/sgbssqxviiuu9yq/qvtPk.bin?dl=1',
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/qvk4hc4lpezwvgl/qvtVk.json?dl=1',
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
