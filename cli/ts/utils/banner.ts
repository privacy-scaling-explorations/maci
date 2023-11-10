import { logRed, logYellow } from "./theme"

/**
 * Print a nice MACI banner
 */
export const banner = () => {
    logRed((`

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
    logYellow("Welcome to MACI - Minimal Anti Collusion Infrastructure\n\n")
}