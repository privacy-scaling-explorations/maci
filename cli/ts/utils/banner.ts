import { logRed, logYellow } from "./theme"

/**
 * Print a nice MACI banner
 * @param quiet - whether to print the text or not
 */
export const banner = (quiet: boolean) => {
    logRed(quiet, (`

    ███▄ ▄███▓ ▄▄▄       ▄████▄   ██▓
    ▓██▒▀█▀ ██▒▒████▄    ▒██▀ ▀█  ▓██▒
    ▓██    ▓██░▒██  ▀█▄  ▒▓█    ▄ ▒██▒
    ▒██    ▒██ ░██▄▄▄▄██ ▒▓▓▄ ▄██▒░██░
    ▒██▒   ░██▒ ▓█   ▓██▒▒ ▓███▀ ░░██░
    ░ ▒░   ░  ░ ▒▒   ▓▒█░░ ░▒ ▒  ░░▓  
    ░  ░      ░  ▒   ▒▒ ░  ░  ▒    ▒ ░
    ░      ░     ░   ▒   ░         ▒ ░
           ░         ░  ░░ ░       ░  
                         ░            
    
    `))
    logYellow(quiet, "Welcome to MACI - Minimal Anti Collusion Infrastructure\n\n")
}