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
        (p) =>
          (p.endsWith(".ts") && !p.endsWith("index.ts") && !p.endsWith("d.ts")) ||
          (p.endsWith(".js") && !p.endsWith("index.js")),
      )
      .forEach((task) => {
        import(`${tasksPath}/${task}`);
      });
  }
});
