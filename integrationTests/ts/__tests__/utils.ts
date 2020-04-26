import * as shell from 'shelljs'

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

const exec = (command: string) => {
    return shell.exec(command, { silent: true })
}

const delay = (ms: number): Promise<void> => {
    return new Promise((resolve: Function) => setTimeout(resolve, ms))
}

export { exec, delay, calcTreeDepthFromMaxLeaves }
