#!/bin/bash

set -e

BASE_DIR="$( cd "$( dirname "$0" )" && pwd )"

# Assume this file resides in `<PROJECT_ROOT>/.github/scripts`
PROJECT_ROOT="$BASE_DIR"/../..

CONTRACTS_SUBPACKAGE_PATH="$PROJECT_ROOT"/contracts
HARDHAT_IP="0.0.0.0"
HARDHAT_PORT="8545"


run_hardhat() {
    cd "$CONTRACTS_SUBPACKAGE_PATH"
    nohup npx hardhat node \
        --hostname "$HARDHAT_IP" \
        --port "$HARDHAT_PORT" > /dev/null 2>&1 &
}

wait_hardhat() {
while [[ "$(lsof -i :"$HARDHAT_PORT")" -eq '0' ]]; do sleep 1; done
}

kill_hardhat() {
    sudo kill -9 $(sudo lsof -t -i :"$HARDHAT_PORT")    
}


tests_dir="$PROJECT_ROOT"/cli
for file_path in "$tests_dir"/test*
do
    run_hardhat
    wait_hardhat

    file_name=$(basename "$file_path")

    # Skipping testKeyChange.sh temporally
    # related issue: https://github.com/privacy-scaling-explorations/maci/issues/400
    if [ "$file_name" = "testKeyChange.sh" ]; then
        continue
    fi

    echo "########################################"
    echo "########################################"
    echo "#### Running Test: "$file_name""
    echo "########################################"
    echo "########################################"
    (cd "$tests_dir"; . "$file_name")
    kill_hardhat
done
