#!/usr/bin/env bash

DOCKER_CONFIG="../docker"
SCRIPT='node /root/maci/server/index.js'

function setup(){
  CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
  HOST_IP=$(docker inspect "$CONTAINER_ID" | jq -r .[0].NetworkSettings.Networks[].Gateway)
  docker exec $CONTAINER_ID sed -i "s/host.docker.internal/$HOST_IP/g" /root/maci/server/admin.sh
  docker exec $CONTAINER_ID sed -i "s/host.docker.internal/$HOST_IP/g" /root/maci/server/admin_v0_10.sh
}

function run_script() {
  CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
  docker exec -it $CONTAINER_ID $SCRIPT 
}

function kill_script() {
  CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
  PID=$(docker exec $CONTAINER_ID pgrep node)
  echo "kill process: "$PID
  docker exec $CONTAINER_ID kill -9 $PID
}

function stop_docker() {
  docker stop $(docker ps -aq)
  docker rm $(docker ps -aq)
}

function start_docker() {
  cd $DOCKER_CONFIG && docker-compose up -d
  setup
  run_script
}


function login_docker() {
   CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
   docker exec -it $CONTAINER_ID bash
}

function print_usage() {
  echo "start/stopdocker instances: ./test.sh -[ud] "
  echo "run/kill server.js in docker: ./test.sh -[rk]"
  echo "log in docker: ./test.sh -[l]"
}

UP=""
DOWN=""
RUN=""
LOGIN=""
KILL=""
while getopts 'udrlkpg' OPT; do
  case $OPT in
    u)
    UP="true";;
    d)
    DOWN="true";;
    r)
    RUN="true";;
    l)
    LOGIN="true";;
    k)
    KILL="true";;
    ?)
    print_usage
    exit -1;;
  esac
done

if [ "$DOWN" == "true" ]; then
    echo "stop dockers..."
    stop_docker
fi
if [ "$UP" == "true" ]; then
    echo "start dockers..."
    start_docker
fi
if [ "$RUN" == "true" ]; then
    echo "running docker script..."
    run_script
fi
if [ "$LOGIN" == "true" ]; then
    login_docker
fi
if [ "$KILL" == "true" ]; then
    kill_script
fi
