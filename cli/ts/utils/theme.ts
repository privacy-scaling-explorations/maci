
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

export function logRed(text: string) {
    console.log(RED + text + RESET);
}

export function logGreen(text: string) {
    console.log(GREEN + text + RESET);
}

export function logYellow(text: string) {
    console.log(YELLOW + text + RESET);
}

export function logMagenta(text: string) {
    console.log(MAGENTA + text + RESET);
}

export function logError(text: string) {
    logRed(error(text))
    process.exit(1)
}

export const info = (text: string) => `[i] ${text}`
export const success = (text: string) => `[✓] ${text}`
export const warning = (text: string) => `[!] ${text}`
export const error = (text: string) => `[✗] ${text}`
