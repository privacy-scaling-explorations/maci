import * as shell from 'shelljs'

const exec = (command: string) => {
    return shell.exec(command, { silent: true })
}

const delay = (ms: number): Promise<void> => {
    return new Promise((resolve: Function) => setTimeout(resolve, ms))
}

export { exec, delay }
