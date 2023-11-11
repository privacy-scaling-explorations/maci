import {
    expect 
} from "chai"
import {
    loadData,
    executeSuite,
} from './suitesUtils'

describe('Test suites', function() {
    this.timeout(500000000)
    const data = loadData('suites.json')
    for (const test of data.suites) {
        it(test.description, async () => {
            const result = await executeSuite(test, expect)
            console.log(result)

            expect(result).to.be.true
        })
    }
})
