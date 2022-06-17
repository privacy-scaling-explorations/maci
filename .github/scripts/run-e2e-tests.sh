#!/bin/bash

set -e

BASE_DIR="$( cd "$( dirname "$0" )" && pwd )"

CLI_DIR="$BASE_DIR"/../../cli
for file_path in "$CLI_DIR"/tests/*/*.sh
do
    echo "########################################"
    echo "########################################"
    echo "#### Running Test: ${file_path##*/..}"
    echo "########################################"
    echo "########################################"
    (cd "$CLI_DIR" && . "$file_path")

done
