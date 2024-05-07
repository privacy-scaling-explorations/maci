import dotenv from "dotenv";
import * as tar from "tar";

import fs from "fs";
import https from "https";
import path from "path";

dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")] });

const ZKEY_PATH = path.resolve(process.env.COORDINATOR_ZKEY_PATH!);
const ZKEYS_URLS = {
  test: "https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.3.0/maci_artifacts_10-2-1-2_test.tar.gz",
};
const ARCHIVE_NAME = path.resolve(ZKEY_PATH, "maci_keys.tar.gz");

export async function downloadZkeys(): Promise<void> {
  const [type] = process.argv.slice(2).map((arg) => arg.trim() as keyof typeof ZKEYS_URLS);

  if (!Object.keys(ZKEYS_URLS).includes(type)) {
    throw new Error(`${type} doesn't exist`);
  }

  if (!fs.existsSync(ZKEY_PATH)) {
    await fs.promises.mkdir(ZKEY_PATH);
  }

  const file = fs.createWriteStream(ARCHIVE_NAME);

  https
    .get(ZKEYS_URLS[type], (response) => {
      response.pipe(file);

      file
        .on("finish", () => {
          file.close();

          tar.x({ f: ARCHIVE_NAME }).then(() => fs.promises.rm(ARCHIVE_NAME));
        })
        .on("error", () => fs.promises.unlink(ARCHIVE_NAME));
    })
    .on("error", () => fs.promises.unlink(ARCHIVE_NAME));
}

downloadZkeys();
