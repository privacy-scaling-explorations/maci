import fs from "fs";
import path from "path";

/**
 * The same as individual imports but doesn't require to add new import line everytime
 */
["maci"].forEach((folder) => {
  const tasksPath = path.resolve(__dirname, folder);

  if (fs.existsSync(tasksPath)) {
    fs.readdirSync(tasksPath)
      .filter((p) => p.includes(".ts") && !p.includes("index.ts"))
      .forEach((task) => {
        import(`${tasksPath}/${task}`);
      });
  }
});
