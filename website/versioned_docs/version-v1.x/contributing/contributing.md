---
title: Contributing to MACI
description: Instructions on how to contribute to MACI
sidebar_label: Contributing
sidebar_position: 19
---

# Contributing

🎉 Thank you for being interested in contributing to MACI! 🎉

Feel welcome and read the following sections in order to know how to ask questions and how to work on something.

All members of our community are expected to follow our [Code of Conduct](/docs/contributing/code-of-conduct). Please make sure you are welcoming and friendly in all of our spaces.

We're really glad you're reading this, because we need volunteer developers to help this project come to fruition. There is a lot we want to achieve, and this can only be made possible thanks to your support. 👏

## Issues

The best way to contribute to our projects is by opening a [new issue](https://github.com/privacy-scaling-explorations/maci/issues) or tackling one of the issues listed [here](https://github.com/privacy-scaling-explorations/maci/contribute).

## Pull Requests

Pull requests are great if you want to add a feature or fix a bug. Here's a quick guide:

1. Ensure there is an issue tracking your work.

2. Fork the repo.

3. Run the tests. We only take pull requests with passing tests.

4. Add a test for your change. Only refactoring and documentation changes require no new tests.

5. Make sure to check out the [Style Guide](#style-guide) and ensure that your code complies with the rules.

6. Make sure you read our [GitHub processes](https://github.com/privacy-scaling-explorations/maci/discussions/847) documentation.

7. Make the test pass.

8. Commit your changes.

9. Push to your fork and submit a pull request on our `dev` branch. Please provide us with some explanation of why you made the changes you made. For new features make sure to explain a standard use case to us.

10. Link any issues that the PR is addressing as described in our processes documentation.

## CI (Github Actions) Tests

We use GitHub Actions to test each PR before it is merged.

When you submit your PR (or later change that code), a CI build will automatically be kicked off. A note will be added to the PR, and will indicate the current status of the build.

Please refer to our [testing guide](/docs/testing) for more details on how we run tests across the monorepo.

## Style Guide

### Code rules

We always use ESLint and Prettier. To check that your code follows the rules, simply run the pnpm script `pnpm run lint` and `pnpm run prettier`. When committing, `eslint` is run automatically, so you will be required to fix any error before being able to push a commit. We highly recommend to tackle warnings as well.

### Commits rules

For commits it is recommended to use [Conventional Commits](https://www.conventionalcommits.org). You may install the [commitizen](https://commitizen-tools.github.io/commitizen/) tool to help you with this.

Each commit message consists of a **header**, a **body** and a **footer**. The **header** has a special format that includes a **type**, a **scope** and a **subject**:

```
    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>
    <BLANK LINE>
    <footer>
```

The **header** is mandatory and the **scope** of the header must contain the name of the component you are working on.

#### Type

The type must be one of the following:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- refactor: A code change that neither fixes a bug nor adds a feature (improvements of the code structure)
- perf: A code change that improves the performance
- test: Adding missing or correcting existing tests
- build: Changes that affect the build system or external dependencies (example scopes: gulp, npm)
- ci: Changes to CI configuration files and scripts (example scopes: travis, circle)
- chore: Other changes that don't modify src or test files
- revert: Reverts a previous commit

#### Scope

The scope should be the name of the feature or package modified (as perceived by the person reading the changelog generated from commit messages).

#### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

#### Body

Just as in the subject, use the imperative, present tense: "change" not "changed" nor "changes". The body should include the motivation for the change and contrast this with previous behavior.

### Branch rules

- Branches should generally be created off of the base branch (`dev` )
- Avoid long descriptive names for long-lived branches
- Use kebab-case (no CamelCase)
- Use grouping tokens (words) at the beginning of your branch names (in a similar way to the `type` of commit)
- Define and use short lead tokens to differentiate branches in a way that is meaningful to your workflow
- Use slashes to separate parts of your branch names
- Remove branch after merge if it is not important

Examples:

```bash
git branch -b docs/readme
git branch -b test/a-feature
git branch -b feat/sidebar
git branch -b fix/b-feature
```
