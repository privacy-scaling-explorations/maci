// eslint-disable-next-line import/no-extraneous-dependencies
import { glob } from "glob";

import childProcess from "child_process";
import fs from "fs";
import path from "path";

import type { CircuitConfig } from "circomkit";

export async function info(zkeysPath: string): Promise<void> {
  const files = await glob("**/*.r1cs", { cwd: zkeysPath });

  const circuitsConfigPath = path.resolve(__dirname, "..", "circom", "circuits.json");
  const circuitsConfig = JSON.parse(await fs.promises.readFile(circuitsConfigPath, "utf-8")) as unknown as Record<
    string,
    CircuitConfig
  >;

  const params = files
    .map((file) => ({ config: circuitsConfig[file.split("/")[0]], file }))
    .reduce<Record<string, string>>((acc, { config, file }) => {
      acc[file] = `${config.template} [${config.params?.toString()}]`;

      return acc;
    }, {});

  const { promisify } = await import("util");
  const execFile = promisify(childProcess.execFile);

  const data: { stdout: string; stderr: string }[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let index = 0; index < files.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = await execFile("snarkjs", ["r1cs", "info", path.resolve(zkeysPath, files[index])]);
    data.push(result);
  }

  // eslint-disable-next-line no-console
  console.log(data.map(({ stdout }, index) => `${files[index]}\n${params[files[index]]}\n${stdout}`).join("\n"));
}

if (require.main === module) {
  (async () => {
    await info(process.argv[process.argv.indexOf("--zkeys") + 1]);
  })();
}
