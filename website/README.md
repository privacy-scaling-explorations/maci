# MACI website

MACI website, documentation, and blog served at [maci.pse.dev](https://maci.pse.dev/).

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ pnpm i
```

### Local Development

First, ensure you have setup MACI.

From the root of the project (not within this `/website/` directory), run:

```
pnpm install && pnpm run build
```

Then, generate the TypeDoc documentation:

```
pnpm run typedocs
```

Now, please navigate to the `/contracts/` directory and generate the Solidity documentation:

```
pnpm run docs
```

At this point, we need to copy the generated documentation into the `/website/` directory, as well as generate a fix the headings for the Solidity documentation. Finally, we need to replace the links of the TypeDoc HTML files to ensure that there are no broken links. To do this, we have two custom scripts to run:

```
pnpm run setup-typedoc
pnpm run setup-soliditydocs
```

The commands above will run the scripts inside (`./src/scripts`).

Finally, start the local development server:

```
$ pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ pnpm build
```

This command generates static content into the `/build/` directory and can be served using any static contents hosting service. Please note that it also generates the correct links for the TypeDoc files, as well as copies over the Solidity documentation from the contracts folder. Please ensure you have generated both TypeDoc and Solidity documentation following the instructions above.
