import { logRed, logYellow } from "./theme"

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