import { existsSync, readdirSync, rmSync } from "fs"
import { join } from "path"

export const cleanVanilla = () => {
    const files = readdirSync("./proofs")
    for (const file of files) {
        rmSync(join("./proofs", file))
    }
    if (existsSync("./tally.json")) rmSync("./tally.json")
}

export const cleanSubsidy = () => {
    const files = readdirSync("./proofs")
    for (const file of files) {
        rmSync(join("./proofs", file))
    }
    if (existsSync("./tally.json")) rmSync("./tally.json")
    if (existsSync("./subsidy.json")) rmSync("./subsidy.json")
}