#!/bin/bash

cd "$(dirname "$0")"
mkdir -p ../book

mdbook serve -d ../book
