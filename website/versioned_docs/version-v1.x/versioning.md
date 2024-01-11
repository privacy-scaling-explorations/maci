---
title: MACI versioning and release process
description: How MACI's versioning and release process works
sidebar_label: MACI versioning
sidebar_position: 18
---

# MACI versioning and release process

This document outlines the approach to versioning and releasing the MACI project. The primary goal here is to set clear expectations and provide a consistent user experience for developers integrating MACI and its packages.

## MACI code

MACI code consists 3 core parts: Circom circuits, Solidity contracts and JS (TS) libraries, from which we release a total of 7 NPM packages. See the [codebase overview](/docs/overview) for more details.

## MACI versioning

MACI follows the [Semantic Versioning Specification (SemVer)](https://semver.org/).

All MACI packages are organized in our monorepo and follow a global release approach, meaning that all packages have the same version.

Currently, MACI core team manually decides when to release and what the version should be. Packages are released [automatically via CI](https://github.com/privacy-scaling-explorations/maci/blob/dev/.github/workflows/release.yml) when a new tag is created in GitHub. [You can view our releases and tags in GitHub](https://github.com/privacy-scaling-explorations/maci/releases).

## MACI Release Process

To release a new version of MACI, follow these steps:

:::warning
Version number '1.2.3' is used here as an example. You should replace the version number '1.2.3' with the version number you are planning to release
:::

1. Verify that tests have passed on GitHub Actions

2. Clone maci:

```
git clone https://github.com/privacy-scaling-explorations/maci
```

3. Switch to the `dev` branch:

```
git checkout dev
```

4. Install required dependencies:

```
pnpm install
```

5. Run `lerna version` to update CHANGELOG and version numbers of sub-packages:

```
pnpm exec lerna version --no-push --no-git-tag-version --conventional-commits 1.2.3
```

6. Commit changes:

```
git commit --message "chore(release): publish 1.2.3"
```

7. Push changes and create a pull request

After the pull request has been merged:

8. Retrieve merged commit

9. Add a tag:

```
git tag --sign v1.2.3 --message v1.2.3
```

10. Publish tag:

```
git push v1.2.3
```

Once the tag is pushed, GitHub Actions will automatically publish the packages to npm.js and create a release on GitHub.

---

The following packages will be published on NPM:

- [`@maci-circuits`](https://www.npmjs.com/package/maci-circuits)
- [`@maci-contracts`](https://www.npmjs.com/package/maci-contracts)
- [`@maci-cli`](https://www.npmjs.com/package/maci-cli)
- [`@maci-core`](https://www.npmjs.com/package/maci-core)
- [`@maci-crypto`](https://www.npmjs.com/package/maci-crypto)
- [`@maci-domainobjs`](https://www.npmjs.com/package/maci-domainobjs)
- [`@maci-integrationtests`](https://www.npmjs.com/package/maci-integrationtests)
