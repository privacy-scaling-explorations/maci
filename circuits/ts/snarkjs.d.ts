declare module 'snarkjs' {
    export type NumericString = `${number}` | string
    export type PublicSignals = NumericString[]

    export interface Groth16Proof {
        pi_a: NumericString[]
        pi_b: NumericString[][]
        pi_c: NumericString[]
        protocol: string
        curve: string
    }

    export namespace zKey {
        function exportJson(zkeyFileName: any): Promise<object>
    }

    export namespace groth16 {
        function verify(
            _vk_verifier: any,
            _publicSignals: PublicSignals,
            _proof: Groth16Proof,
            logger?: any,
        ): Promise<boolean>
    }
}
