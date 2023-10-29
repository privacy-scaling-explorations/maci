import { start, get } from "prompt-async"

/**
 * Ask for a sensitive value
 * @param name The name of the param
 * @returns the user input 
 */
export const promptPwd = async (name: string): Promise<string> => {
    start()
    const input = await get([
        {
            name,
            hidden: true,
        }
    ])

    return input[name]
}