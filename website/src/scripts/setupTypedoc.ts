import fs from "fs";
import path from "path";

import { copyDirectory, fitFormat, generateSidebarString, insertIndexPage } from "./utils";

const TYPEDOC_DIR = path.resolve(__dirname, "../../typedoc");

/**
 * A function that remove the auto-genrated navigator
 * and the title at the top of the page,
 * meanwhile adding sidebar configurations above the content.
 * @param file - the file being updated
 * @param sidebarInfo - sidebar infos, passed in as a string
 */
function updateMdFiles(file: string, sidebarInfo: string) {
  const content = fs.readFileSync(file).toString().split("\n");

  if (content.length > 3) {
    content.shift();
    content.shift();
    content.shift();
  }

  const writtenContent = content.join("\n").replaceAll("README.md", "index.md");
  fs.writeFileSync(file, `${sidebarInfo}\n${writtenContent}`);
}

// read all dir in typedoc/ -> rename README.md as index.md -> remove upper navigations
const directories = fs.readdirSync(TYPEDOC_DIR);
directories.forEach((dir) => {
  const dirname = path.resolve(TYPEDOC_DIR, dir);
  const label = fitFormat(dir);

  // only do things if it's a directory
  if (fs.statSync(dirname).isDirectory()) {
    const readmeFile = path.resolve(dirname, "README.md");

    if (fs.existsSync(readmeFile)) {
      updateMdFiles(readmeFile, generateSidebarString({ title: label, label }));
      fs.renameSync(readmeFile, path.resolve(dirname, "index.md"));
    }

    // remove the first two lines of navigator
    const modulesFile = path.resolve(dirname, "modules.md");

    if (fs.existsSync(modulesFile)) {
      updateMdFiles(modulesFile, generateSidebarString({ title: `${label} Module`, label: "module", position: 1 }));
    }

    const innerDirs = fs.readdirSync(dirname);
    innerDirs.forEach((innerDir) => {
      const innerDirname = path.resolve(dirname, innerDir);

      if (fs.statSync(innerDirname).isDirectory()) {
        const innerFiles = fs.readdirSync(innerDirname);
        innerFiles.forEach((innerFile) => {
          const innerLabel = innerFile.split(".")[0];
          updateMdFiles(
            path.resolve(innerDirname, innerFile),
            generateSidebarString({ title: innerLabel, label: innerLabel }),
          );
        });
      }
    });
  }
});

// insert index page
insertIndexPage(TYPEDOC_DIR, { title: "Typedoc", label: "Typedoc" });

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
