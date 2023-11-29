// Description: This file contains the theme for the CLI
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

/**
 * Print red text to the console (fancy)
 * @param text - the text to print
 */
export function logRed(text: string) {
    console.log(RED + text + RESET);
}

/**
 * Print green text to the console (fancy)
 * @param text - the text to print
 */
export function logGreen(text: string) {
    console.log(GREEN + text + RESET);
}

/**
 * Print yellow text to the console (fancy)
 * @param text - the text to print
 */
export function logYellow(text: string) {
    console.log(YELLOW + text + RESET);
}

/**
 * Print magenta text to the console (fancy)
 * @param text - the text to print
 */
export function logMagenta(text: string) {
    console.log(MAGENTA + text + RESET);
}

/**
 * Log an error and throw an error
 * @param text
 */
export function logError(text: string) {
    throw new Error(error(text));
}

/**
 * create an info message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const info = (text: string) => `[i] ${text}`;

/**
 * create a success message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const success = (text: string) => `[✓] ${text}`;

/**
 * create a success message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const warning = (text: string) => `[!] ${text}`;

/**
 * create an error message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const error = (text: string) => `[✗] ${text}`;
