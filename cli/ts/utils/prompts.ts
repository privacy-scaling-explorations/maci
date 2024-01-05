import { start, get } from "prompt";

/**
 * Ask for a sensitive value
 * @param name The name of the param
 * @returns the user input
 */
export const promptSensitiveValue = async (name: string): Promise<string> => {
  start();
  const input = await get([{ name, hidden: true }]);

  return input[name] as string;
};
