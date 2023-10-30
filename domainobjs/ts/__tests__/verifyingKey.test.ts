import * as path from "path"
import * as fs from "fs"
import { VerifyingKey } from "../"

describe("verifyingKey", () => {
    it('Should convert a JSON file from snarkjs to a VerifyingKey', async () => {
        const file = path.join(__dirname, './artifacts/test_vk.json')
        const j = fs.readFileSync(file).toString()
        const d = JSON.parse(j)
        const vk = VerifyingKey.fromJSON(j)

        expect(d.vk_alpha_1[0]).toEqual(vk.alpha1.x.toString())
        expect(d.vk_alpha_1[1]).toEqual(vk.alpha1.y.toString())

        expect(d.vk_beta_2[0][0]).toEqual(vk.beta2.x[1].toString())
        expect(d.vk_beta_2[0][1]).toEqual(vk.beta2.x[0].toString())
        expect(d.vk_beta_2[1][0]).toEqual(vk.beta2.y[1].toString())
        expect(d.vk_beta_2[1][1]).toEqual(vk.beta2.y[0].toString())

        expect(d.vk_gamma_2[0][0]).toEqual(vk.gamma2.x[1].toString())
        expect(d.vk_gamma_2[0][1]).toEqual(vk.gamma2.x[0].toString())
        expect(d.vk_gamma_2[1][0]).toEqual(vk.gamma2.y[1].toString())
        expect(d.vk_gamma_2[1][1]).toEqual(vk.gamma2.y[0].toString())

        expect(d.vk_delta_2[0][0]).toEqual(vk.delta2.x[1].toString())
        expect(d.vk_delta_2[0][1]).toEqual(vk.delta2.x[0].toString())
        expect(d.vk_delta_2[1][0]).toEqual(vk.delta2.y[1].toString())
        expect(d.vk_delta_2[1][1]).toEqual(vk.delta2.y[0].toString())

        expect(d.IC.length).toEqual(vk.ic.length)
        for (let i = 0 ; i < d.IC.length; i ++) {
            expect(d.IC[i][0]).toEqual(vk.ic[i].x.toString())
            expect(d.IC[i][1]).toEqual(vk.ic[i].y.toString())
        }
    })
    
    it("Copy should generate a deep copy", async () => {
        const file = path.join(__dirname, 'artifacts/test_vk.json')
        const j = fs.readFileSync(file).toString()
        const vk = VerifyingKey.fromJSON(j)

        const vk2 = vk.copy()
        expect(vk.equals(vk2)).toBeTruthy()
    })
})