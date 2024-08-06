import path from "path";

const parentDir = __dirname.includes("build") ? ".." : "";

if (parentDir) {
  process.env.HARDHAT_CONFIG = path.resolve(__dirname, parentDir, "hardhat.config.js");
}
