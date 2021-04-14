#!/bin/bash

cd "$(dirname "$0")"
mkdir -p ../book

mdbook build -d ../book
