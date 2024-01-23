import fs from "fs";
import path from "path";

import { copyDirectory, insertIndexPage } from "./utils";

// where to move the solidity doc files over
const solidityDocDir = path.resolve(__dirname, "../../versioned_docs/version-v1.x/solidity-docs");
// the origin folder (from the contracts package)
const sourceDir = path.resolve(__dirname, "../../../contracts/docs");

/**
 * Currently, Solidity docgen generates the same heading for all files.
 * We need to remove it and add the contract name as a heading.
 * @param dir - the directory where the documentation files are located
 */
function updateHeadings(dir: string) {
  const files = fs.readdirSync(dir);

  files.forEach((file: string) => {
    const absolutePath = path.join(dir, file);
    const isDirectory = fs.statSync(absolutePath).isDirectory();

    if (isDirectory) {
      updateHeadings(absolutePath);
    } else {
      // Read the content of the file
      let fileContent = fs.readFileSync(absolutePath, "utf8");

      // Remove the "# Solidity API" line
      fileContent = fileContent.replace("# Solidity API\n", "");

      // Replace the first "##" with "#"
      fileContent = fileContent.replace("##", "#");

      // Escape {...} by wrapping them in backticks
      fileContent = fileContent.replace(/{(.*?)}/g, "`{$1}`");

      // Write the modified content back to the file
      fs.writeFileSync(absolutePath, fileContent, "utf8");
    }
  });
}

// copy over the directory
copyDirectory(sourceDir, solidityDocDir);
// update the headings
updateHeadings(solidityDocDir);
// insert index page
insertIndexPage(solidityDocDir, { title: "Solidity Docs", label: "Solidity Docs" });
