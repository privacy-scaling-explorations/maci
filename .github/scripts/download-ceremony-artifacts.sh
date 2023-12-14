#!/bin/bash 

set -e 

cd "$(dirname "$0")"
cd ..
mkdir -p ../cli/zkeys

URL=https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.2.0/maci-ceremony-artifacts-v1.2.0.tar.gz
DIR_NAME="maci_keys.tar.gz"
OUT_DIR=../cli/

echo "downloading $URL"
curl $URL -o "$OUT_DIR/$DIR_NAME"
tar -xvf "$OUT_DIR/$DIR_NAME" -C "$OUT_DIR"
