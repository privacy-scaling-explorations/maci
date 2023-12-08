---
title: Release process
description: How MACI's release process works
sidebar_label: MACI Release process
sidebar_position: 13
---

# Maci Release Process

To release a new version of maci v1, the following steps can be taken:

> you have to replace version number 1.2.3 with the version number you are planning to release

1. Verify that tests have passed on GitHub Actions

2. Clone maci:

```
git clone https://github.com/privacy-scaling-explorations/maci
```

3. Switch to the `master` branch:

```
git checkout master
```

4. Install required dependencies:

```
npm install
```

5. Run `lerna version` to update CHANGELOG and version numbers of sub-packages:

```
npx lerna version --no-push --no-git-tag-version --conventional-commits 1.2.3
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

The following packages will be published on npm.js:

- maci-circuits
- maci-cli
- maci-contracts
- maci-core
- maci-crypto
- maci-domainobjs
- maci-integrationtests
