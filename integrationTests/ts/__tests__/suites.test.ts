jest.setTimeout(3000000)

import {
    loadData,
    executeSuite,
} from './suites'

describe('Test suites', () => {
    //it('Suite 0 - happy path, full tree', async () => {
        //const data = loadData('suite0_happy.json')
        //const result = await executeSuite(data, expect)

        //expect(result).toBeTruthy()
    //})

    it('Suite 1 - happy path, partial tree', async () => {
        const data = loadData('suite1_small.json')
        const result = await executeSuite(data, expect)

        expect(result).toBeTruthy()
    })

    it('Suite 2 - 1 briber, two batches', async () => {
        const data = loadData('suite2_bribe.json')
        const result = await executeSuite(data, expect)

        expect(result).toBeTruthy()
    })
})
