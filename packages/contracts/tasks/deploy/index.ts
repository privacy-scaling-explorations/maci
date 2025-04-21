import fs from "fs";
import path from "path";

/**
 * The same as individual imports but doesn't require to add new import line every time
 */
["maci", "poll"].forEach((folder) => {
  const tasksPath = path.resolve(__dirname, folder);

  if (fs.existsSync(tasksPath)) {
    fs.readdirSync(tasksPath)
      .filter(
        (file) =>
          (file.endsWith(".ts") && !file.endsWith("index.ts") && !file.endsWith("d.ts")) ||
          (file.endsWith(".js") && !file.endsWith("index.js")),
      )
      .forEach((task) => {
        import(`${tasksPath}/${task}`);
      });
  }
});
