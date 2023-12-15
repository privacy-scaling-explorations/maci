import fs from "fs";
import path from "path";

import { copyDirectory } from "./utils";

const TYPEDOC_DIR = path.resolve(__dirname, "../../typedoc");

/**
 * The Typedoc tool automatically generates related documentation links in each file. The link for the introduction of MACI is initially set to `README.md` of the entire project, but this should be changed to `introduction.md`. Simultaneously, references to `modules.md` should be updated to `index.md` since it is slated to be renamed as Typedoc's homepage.
 * @param dirName - the name of the typedoc directory
 */
function updateMentionFiles(dirName: string) {
  const dir = path.join(TYPEDOC_DIR, dirName);
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filename = path.join(dir, file);
    let content = fs.readFileSync(filename, "utf8");
    content = content.replaceAll("../README.md", "../../introduction.md");
    content = content.replaceAll("../modules.md", "../index.md");
    fs.writeFileSync(filename, content);
  });
}

// Remove the README.md file if exists
const readmeFile = path.join(TYPEDOC_DIR, "README.md");
if (fs.existsSync(readmeFile)) {
  fs.unlinkSync(readmeFile);
}

// Rename modules.md to index.md, and change the README.md mention to ../introduction.md
const modulesFile = path.join(TYPEDOC_DIR, "modules.md");
if (fs.existsSync(modulesFile)) {
  let content = fs.readFileSync(modulesFile, "utf8");
  content = content.replaceAll("README.md", "../introduction.md");
  fs.writeFileSync(modulesFile, content);
  fs.renameSync(modulesFile, path.join(TYPEDOC_DIR, "index.md"));
}

// Change all ../README.md mention to ../../introduction.md, and change all ../modeuls.md mention to ../index.md
updateMentionFiles("classes");
updateMentionFiles("interfaces");
updateMentionFiles("modules");

// find the target moving directory
const versionFile = path.resolve(__dirname, "../../versions.json");
let versionDir = "";
try {
  const versionContent = fs.readFileSync(versionFile, "utf8");
  if (versionContent) {
    const versionContentJson = JSON.parse(versionContent) as string[];
    versionDir = path.resolve(__dirname, `../../versioned_docs/version-${versionContentJson[0]}/typedoc`);
  }
} catch (e) {
  versionDir = path.resolve(__dirname, "../../docs/typedoc");
}

// move the typedoc/ directory to target directory
copyDirectory(TYPEDOC_DIR, versionDir);

fs.rmSync(TYPEDOC_DIR, { recursive: true, force: true });
