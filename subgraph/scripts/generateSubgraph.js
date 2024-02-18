// eslint-disable-next-line import/no-extraneous-dependencies
import Mustache from "mustache";

import { readFileSync, writeFileSync } from "fs";

const network = process.argv.at(2);
const template = readFileSync("./subgraph.template.yaml", "utf-8");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const networks = JSON.parse(readFileSync("./networks.json", "utf-8"));
const subgraph = Mustache.render(template, {
  network,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ...networks[network].MACI,
});

writeFileSync("./subgraph.yaml", subgraph);
