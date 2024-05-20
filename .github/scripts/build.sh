#!/bin/bash
set -ex

cp coordinator/.env.example coordinator/.env

sed -i "s|^\(COORDINATOR_RPC_URL=\).*|\1$1|" coordinator/.env
sed -i "s|^\(COORDINATOR_ADDRESS=\).*|\1$2|" coordinator/.env
sed -i "s|^\(COORDINATOR_ALLOWED_ORIGIN=\).*|\1$3|" coordinator/.env

aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 490752553772.dkr.ecr.eu-central-1.amazonaws.com

docker build -t maci-coordinator -f coordinator/apps/Dockerfile .
docker tag maci-coordinator:latest 490752553772.dkr.ecr.eu-central-1.amazonaws.com/maci-coordinator:latest
docker push 490752553772.dkr.ecr.eu-central-1.amazonaws.com/maci-coordinator:latest

exit 0
