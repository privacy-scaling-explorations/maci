const fileS = require("fs");
const pathX = require("path");

const solidityDocDir = pathX.join(__dirname, "../pages/solidity-docs");
const sourceDir = pathX.resolve(__dirname, "../../../contracts/docs");

/**
 * Allow to copy a directory from source to target
 * @param source - the source directory
 * @param target - the target directory
 */
function copyDirectory(source: string, target: string) {
  if (!fileS.existsSync(target)) {
    fileS.mkdirSync(target, { recursive: true });
  }

  const files = fileS.readdirSync(source);

  for (const file of files) {
    const sourcePath = pathX.join(source, file);
    const targetPath = pathX.join(target, file);

    if (fileS.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fileS.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Currently, Solidity docgen does not generate an index file
 * with links to all of the documentation files. This function
 * aims to generate this index file.
 * @param dir - the directory where the documentation files are located
 * @param relativePath - the relative path to the directory where the documentation files are located
 * @returns the content of the index file
 */
function generateMarkdownLinks(dir, relativePath = ""): string {
  let content = "";
  const files = fileS.readdirSync(dir);

  for (const file of files) {
    const absolutePath = pathX.join(dir, file);
    const fileRelativePath = pathX.join(relativePath, file);
    const isDirectory = fileS.statSync(absolutePath).isDirectory();

    if (isDirectory) {
      content += generateMarkdownLinks(absolutePath, fileRelativePath);
    } else {
      const contractName = pathX.basename(file, ".md");
      const fileRelativePathWithoutExtension = fileRelativePath.replace(".md", "");

      // Read the content of the file
      let fileContent = fileS.readFileSync(absolutePath, "utf8");

      // Escape {...} by wrapping them in backticks
      fileContent = fileContent.replace(/{(.*?)}/g, "`{$1}`");

      // Write the modified content back to the file
      fileS.writeFileSync(absolutePath, fileContent, "utf8");

      content += `- [${contractName}](./${fileRelativePathWithoutExtension})\n`;
    }
  }

  return content;
}

// copy over the directory
copyDirectory(sourceDir, solidityDocDir);
// generate index.md content
const content = "# Solidity NatSpec Documentation\n\n" + generateMarkdownLinks(solidityDocDir, "solidity-docs");
// save the content to index.md
fileS.writeFileSync(pathX.join(solidityDocDir, "index.md"), content, "utf8");
