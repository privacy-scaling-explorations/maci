#!/bin/bash 

set -e 

cd "$(dirname "$0")"
cd ..
mkdir -p ../cli/zkeys

URL=https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.2.0/maci_keys_6-8-2-3_ceremony.tar.gz
DIR_NAME="maci_keys.tar.gz"
OUT_DIR=../cli/

echo "downloading $URL"
curl $URL -o "$OUT_DIR/$DIR_NAME"
tar -xvf "$OUT_DIR/$DIR_NAME" -C "$OUT_DIR"
