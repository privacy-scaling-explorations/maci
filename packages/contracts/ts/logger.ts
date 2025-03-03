import type { ILogArgs } from "./types";

/* eslint-disable no-console */
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

const QUIET = process.env.NODE_ENV === "test";

/**
 * Print red text to the console (fancy)
 * @param args log arguments
 */
export function logRed({ quiet = QUIET, text }: ILogArgs): void {
  if (!quiet) {
    console.log(RED + text + RESET);
  }
}

/**
 * Print green text to the console (fancy)
 * @param args log arguments
 */
export function logGreen({ quiet = QUIET, text }: ILogArgs): void {
  if (!quiet) {
    console.log(GREEN + text + RESET);
  }
}

/**
 * Print yellow text to the console (fancy)
 * @param args log arguments
 */
export function logYellow({ quiet = QUIET, text }: ILogArgs): void {
  if (!quiet) {
    console.log(YELLOW + text + RESET);
  }
}

/**
 * Print magenta text to the console (fancy)
 * @param args log arguments
 */
export function logMagenta({ quiet = QUIET, text }: ILogArgs): void {
  if (!quiet) {
    console.log(MAGENTA + text + RESET);
  }
}

/**
 * create an info message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const info = (text: string): string => `[i] ${text}`;

/**
 * create a success message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const success = (text: string): string => `[✓] ${text}`;

/**
 * create a success message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const warning = (text: string): string => `[!] ${text}`;

/**
 * create an error message
 * @param text - the text to print
 * @returns the text with a prefix
 */
export const error = (text: string): string => `[✗] ${text}`;
