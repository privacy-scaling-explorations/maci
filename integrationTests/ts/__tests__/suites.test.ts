jest.setTimeout(3000000)

import {
    loadData,
    executeSuite,
} from './suites'

describe('Test suites', () => {
    const data = loadData('suites.json')
    for (const test of data.suites) {
        it(test.description, async () => {
            const result = await executeSuite(test, expect)
            console.log(result)

            expect(result).toBeTruthy()
        })
    }
})
