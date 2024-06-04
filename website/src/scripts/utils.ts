import fs from "fs";
import path from "path";

/**
 * Allow to copy a directory from source to target
 * @param source - the source directory
 * @param target - the target directory
 */
export function copyDirectory(source: string, target: string): void {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (!fs.existsSync(source)) {
    return;
  }

  const files = fs.readdirSync(source);

  files.forEach((file: string) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * A function that forces the first letter to be capital,
 * while the rest of the string must be lower case.
 * @param str - the string being transformed
 */
export function fitFormat(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1, str.length).toLowerCase()}`;
}

/**
 * Sidebar Parameters
 */
interface SidebarProps {
  title?: string;
  description?: string;
  label?: string;
  position?: number;
}

/**
 * A function to generate a sidebar string for a markdown file
 * @param sidebarProps - including title, description, label, and position
 */
export function generateSidebarString({ title, description, label, position }: SidebarProps): string {
  let ret = "---\n";

  if (title) {
    ret = `${ret}title: ${title}\n`;
  }

  if (description) {
    ret = `${ret}description: ${description}\n`;
  }

  if (label) {
    ret = `${ret}sidebar_label: ${label}\n`;
  }

  if (position) {
    ret = `${ret}sidebar_position: ${position.toString()}\n`;
  }

  ret = `${ret}---\n`;

  return ret;
}

/**
 * Generate a table of contents for a directory
 * @param dir - the directory to generate a table of contents for
 * @returns a string with the table of contents
 */
export function generateToC(dir: string, prefix = ""): string {
  const files = fs.readdirSync(dir);
  let content = "";

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);
    if (fileStat.isDirectory()) {
      content += generateToC(filePath, `${prefix}${file}/`);
    } else if (file !== "index.md" && file !== "README.md" && file.endsWith(".md")) {
      content += `- [${prefix}${file}](${prefix}${file})\n`;
    }
  });

  return content;
}

/**
 * A function that insert a index page
 * @param dir - the directory to insert an index page
 * @param sidebarProps - including title, description, label, and position
 */
export function insertIndexPage(
  dir: string,
  { title, description, label, position }: SidebarProps,
  content?: string,
): void {
  fs.writeFileSync(
    `${dir}/index.md`,
    `${generateSidebarString({ title, description, label, position })}${content ?? ""}`,
  );
}
