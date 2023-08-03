jest.setTimeout(3000000)

import {
    loadData,
    executeSuite,
    executeSuiteElgamal
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

// describe('Test suites Elgamal', () => {
//     const data = loadData('suitesElgamal.json')
//     for (const test of data.suites) {
//         it(test.description, async () => {
//             const result = await executeSuiteElgamal(test, expect)
//             console.log(result)

//             expect(result).toBeTruthy()
//         })
//     }
// })
