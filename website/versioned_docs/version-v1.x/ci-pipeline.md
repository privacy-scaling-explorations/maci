---
title: CI Pipeline
description: Introduction to how MACI's CI works
sidebar_label: CI
sidebar_position: 13
---

# Continuous Integration (CI) Pipeline

CI (Continuous Integration) pipeline is an automated workflow to ensure that software is always in a working state. An event like opening a pull request causes a pipeline to run. The pipeline consists of an automated build process and a suite of automated tests (See [Testing](https://pse.dev/docs/testing) for more details).

![cicd-maci drawio-7](https://user-images.githubusercontent.com/1610146/185962260-091cd952-5444-44f3-89e3-be64e81d4c21.png)

## Pipeline Triggers

### Commit to Main Branch

Each commit (i.e. a merged PR) to the main branch triggers the pipeline. The pipeline creates packages that can be deployed to any environment. Packages are uploaded to an artifact repository (e.g. npm).

![cicd-maci drawio-12](https://user-images.githubusercontent.com/1610146/183404579-8bcb76fe-34b6-4748-a5ae-e2e4b010bd86.png)

### Pull Request (PR)

When a pull request has been created (or updated), it triggers the PR pipeline. It gives the reviewer confidence that the software works as expected with the introduced code changes.

![cicd-maci drawio-9](https://user-images.githubusercontent.com/1610146/183391880-d3a20f29-2708-4d72-988d-4781c0396e48.png)

### Nightly

Nightly build runs every midnight. It is to ensure that all required dependencies are present and to show no bugs have been introduced.

![cicd-maci drawio-11](https://user-images.githubusercontent.com/1610146/183404455-cc2aaace-fe52-40f4-b5e4-3c852c5ff516.png)

### Tag Push

When a tag has been pushed, it triggers a release pipeline. It will draft a release note with an auto-generated changelog and publish npm package(s).

![cicd-maci drawio-5](https://user-images.githubusercontent.com/1610146/185958513-51dadaf1-7f72-404b-b482-149b91edcaab.png)
