#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

mkdir -p ../cli/zkeys

PKGS="zkeys_10-2-1-2_glibc-211.tar.gz ProcessMessages_10-2-1-2_test.0.zkey TallyVotes_10-1-2_test.0.zkey SubsidyPerBatch_10-1-2_test.0.zkey"

BASE_URL=https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2
OUT_DIR=../cli/zkeys

for p in $PKGS
do
  url="$BASE_URL/$p"
  echo "downloading $url"
  curl $url -o "$OUT_DIR/$p"
  extension="${p##*.}"
  if [ "$extension" == "gz" ]
  then
    tar -xvf "$OUT_DIR/$p" -C "$OUT_DIR"
  fi
done
