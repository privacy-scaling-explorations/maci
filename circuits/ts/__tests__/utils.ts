import axios from 'axios'

const OPTS = {
    headers: {
        'Content-Type': 'application/json',
    }
}

const post = (id: number, method: string, params: any) => {
    return axios.post(
        'http://localhost:9001',
        {
            jsonrpc: '2.0',
            id,
            method,
            params,
        },
        OPTS,
    )
}

const genWitness = async (circuit: string, inputs: any) => {
    const resp = await post(1, 'gen_witness', { circuit, inputs })
    if (resp.data.error) {
        throw Error(resp.data.error.message)
    }
    return resp.data.result.witness
}

const getSignalByName = async (
    circuit: string,
    witness: any,
    name: string,
) => {
    const resp = await post(1, 'get_signal_index', { circuit, name })
    return witness[Number(resp.data.result.index)]
}

const str2BigInt = (s: string): BigInt => {
    return BigInt(parseInt(
        Buffer.from(s).toString('hex'), 16
    ))
}

export {
    str2BigInt,
    genWitness,
    getSignalByName,
}
