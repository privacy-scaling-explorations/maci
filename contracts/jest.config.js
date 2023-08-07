module.exports = {
    verbose: true,
    transform: {
        "^.+\\.tsx?$": 'ts-jest'
    },
    testPathIgnorePatterns: [
        "<rootDir>/build/",
        "/node_modules/",
        /// nb. temporary since the E2E test must be moved outside of `contracts` folder
        /// or is going to break the CI (no `zkeys` folder).
        /// @todo remove this line after having moved the E2E.
        "ts/__tests__/E2E.test.ts"
    ],
    testRegex: 'ts/__tests__/.*\\.test\\.ts$',
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ],
    moduleNameMapper: {
       "^@maci-contracts(.*)$": "<rootDir>./$1",
    },
    globals: {
        'ts-jest': {
            diagnostics: {
                // Do not fail on TS compilation errors
                // https://kulshekhar.github.io/ts-jest/user/config/diagnostics#do-not-fail-on-first-error
                warnOnly: true
            }
        }
    },
    testEnvironment: 'node'
}
