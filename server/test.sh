#!/usr/bin/env bash

DOCKER_CONFIG="../docker"
SCRIPT='node /root/dev-maci/server/index.js'


cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e
sk1=macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5
pk1=macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9

# get request params
GET_URL="http://localhost:8080/get/"
KEY_VAL="?method=ping&pubkey=$cordpk"
GET_URI=$GET_URL$KEY_VAL


# post request params
POST_URI="http://localhost:8080/post/"
VERSION="v1.0"
METHOD="signup"


function post_data()
{
cat <<EOF
{
  "method": "$METHOD",
  "pubkey": "$cordpk",
  "version": "$VERSION"
}
EOF
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


function get_request() {
    res=$(curl $GET_URI)
    echo $res
}

function post_request() {
   echo $(post_data)
   res=$(curl -X POST $POST_URI -H 'content-type: application/json' -d "$(post_data)")
   echo $res
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
GET=""
POST=""
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
    g)
    GET="true";;
    p)
    POST="true";;
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
if [ "$GET" == "true" ]; then
    echo "send http get request..."
    get_request
fi
if [ "$POST" == "true" ]; then
    echo "send http post request..."
    post_request
fi
if [ "$LOGIN" == "true" ]; then
    login_docker
fi
if [ "$KILL" == "true" ]; then
    kill_script
fi
