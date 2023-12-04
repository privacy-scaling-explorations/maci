const fileS = require("fs");
const pathX = require("path");

const solidityDocDir = pathX.join(__dirname, "../pages/solidity-docs");

function generateMarkdownLinks(dir, relativePath = "") {
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
      content += `- [${contractName}](./${fileRelativePathWithoutExtension})\n`;
    }
  }

  return content;
}

const content = "# Solidity NatSpec Documentation\n\n" + generateMarkdownLinks(solidityDocDir, "solidity-docs");
fileS.writeFileSync(pathX.join(solidityDocDir, "index.md"), content, "utf8");
