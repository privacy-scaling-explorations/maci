#!/bin/bash

set -e

start_hardhat_network() {
    installed=$(ls -lh `npm root --global --loglevel=error` | grep hnctl | wc -l)
    if [ "$installed" = "0" ]; then
        echo 'aa'
        npm install -g hnctl
    fi
    hnctl start
}

destroy_hardhat_network() {
    hnctl destroy
}


$1

