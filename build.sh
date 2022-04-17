#!/bin/bash

cd "$(dirname "$0")"
mkdir -p ../publish

mdbook build -d ../publish
