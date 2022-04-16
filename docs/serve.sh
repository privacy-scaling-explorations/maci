#!/bin/bash

cd "$(dirname "$0")"
mkdir -p ../docs

mdbook serve -d ../docs
