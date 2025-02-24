import fs from "fs";

/**
 * Check if an array of paths exist on the local file system
 * @param paths - the array of paths to check
 * @returns an array of boolean and string,
 * where the boolean indicates whether all paths exist, and the string
 * is the path that does not exist
 */
export const doesPathExist = (paths: string[]): [boolean, string | null] => {
  const notFoundPath = paths.find((path) => !fs.existsSync(path));

  return notFoundPath ? [false, notFoundPath] : [true, null];
};
