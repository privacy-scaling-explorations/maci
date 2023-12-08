import fs from "fs";
import path from "path";

// Define the directory where the Typedoc HTML files are located
const typedocDir = path.resolve(__dirname, "static/typedoc_output");

// Define a recursive function to find all HTML files in a directory
function findHtmlFiles(dir: string) {
  const files = fs.readdirSync(dir);
  const list: string[] = [];

  files.forEach((file: string) => {
    if (fs.statSync(path.resolve(dir, file)).isDirectory()) {
      list.concat(findHtmlFiles(path.resolve(dir, file)));
    } else if (file.endsWith(".html")) {
      list.push(path.resolve(dir, file));
    }
  });

  return list;
}

// Find all HTML files in the Typedoc directory
const htmlFiles = findHtmlFiles(typedocDir);

// Go through each HTML file and add the target="_parent" attribute to the external links
htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // Add the target="_parent" attribute to the external links
  content = content.replace(/<a href="http/g, '<a target="_parent" href="http');

  content = content.replace(
    /<a href="\.\//g,
    '<a target="_parent" href="https://github.com/privacy-scaling-explorations/maci/tree/dev/',
  );

  fs.writeFileSync(file, content);
});
