#!/usr/bin/env bash

DOCKER_CONFIG="../docker"
SCRIPT='node /root/dev-maci/server/index.js'

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

function init_docker() {
  cd $DOCKER_CONFIG && ./setup.sh
}

function stop_docker() {
  docker stop $(docker ps -aq)
  docker rm $(docker ps -aq)
}

function start_docker() {
  cd $DOCKER_CONFIG && docker-compose up -d
  run_script
}


function curl_docker() {
   curl http://localhost:8080/signup/echo
}

function login_docker() {
   CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
   docker exec -it $CONTAINER_ID bash
}

function print_usage() {
  echo "start/stopdocker instances: ./test.sh -[ud] "
  echo "start/kill server.js in docker: ./test.sh -[rk]"
  echo "send http request to docker server: ./test.sh -c"
}

UP=""
DOWN=""
RUN=""
CURL=""
LOGIN=""
KILL=""
while getopts 'udrclk' OPT; do
  case $OPT in
    u)
    UP="true";;
    d)
    DOWN="true";;
    r)
    RUN="true";;
    c)
    CURL="true";;
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
if [ "$CURL" == "true" ]; then
    echo "send http request..."
    curl_docker
fi
if [ "$LOGIN" == "true" ]; then
    login_docker
fi
if [ "$KILL" == "true" ]; then
    kill_script
fi
