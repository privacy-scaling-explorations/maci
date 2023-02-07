#!/usr/bin/env bash
# user.sh should not depends on maci repo
# only send http request to server

ProgName=$(basename $0)
DirName=$(dirname $0)

# get request params
GET_URL="http://localhost:8080/get/"
KEY_VAL="?method=ping&pubkey=$cordpk"
GET_URI=$GET_URL$KEY_VAL
# post request params
POST_URI="http://localhost:8080/post/"
# params
version="v0.10"



function help(){
    echo "Usage: $ProgName <command> [options]"
    echo "commands:"
    echo "    genkey"
    echo "    signup -p <maci.pk> -x <maci.addr>"
    echo "    publish"
}

function genkey(){
  json_fmt='{"method":"%s","version":"%s"}'
  json_str=$(printf "$json_fmt" "genkey" "$version")
  post_request $json_str
}

function signup(){
    while [[ $# -gt 0 ]]; do
      key="$1"
      case $key in
        -p|--pubkey)
          pubkey="$2"
          shift 
          shift 
          ;;
        -x|--maci)
          maci="$2"
          shift 
          shift 
          ;;
        *)   
          shift
          ;;
      esac
    done

    json_fmt='{"method":"%s","pubkey":"%s","maci":"%s","version":"%s"}'
    json_str=$(printf "$json_fmt" "signup" "$pubkey" "$maci" "$version")
    post_request $json_str
}

function publish(){
    while [[ $# -gt 0 ]]; do
      key="$1"
      case $key in
        -p|--pubkey)
          pubkey="$2"
          shift 
          shift 
          ;;
        -x|--maci)
          maci="$2"
          shift 
          shift 
          ;;
        -sk|--privkey)
          privkey="$2"
          shift
          shift
          ;;
        -i|--state_index)
          state_index="$2"
          shift
          shift
          ;;
        -v|--vote_option_index)
          vote_option_index="$2"
          shift
          shift
          ;;
        -w|--new_vote_weight)
          new_vote_weight="$2"
          shift
          shift
          ;;
        -n|--nonce)
          nonce="$2"
          shift
          shift
          ;;
        -s|--salt)
          salt="$2"
          shift
          shift
          ;;
        *)   
          shift
          ;;
      esac
    done

    json_fmt='{"method":"%s","pubkey":"%s","maci":"%s","privkey":"%s","state_index":"%s","vote_option_index":"%s","new_vote_weight":"%s","nonce":"%s","salt":"%s","version":"%s"}'
    json_str=$(printf "$json_fmt" "publish" "$pubkey" "$maci" "$privkey" "$state_index" "$vote_option_index" "$new_vote_weight" "$nonce" "$salt" "$version")
    echo $json_str
    post_request $json_str
}

function get_request() {
    res=$(curl $GET_URI)
    echo $res
}

function post_request() {
   res=$(curl -X POST $POST_URI -H 'content-type: application/json' -d "$1")
   echo $res
}

command=$1
case $command in
    "" | "-h" | "--help")
        help
        ;;
    *)
        shift
        ${command} $@
        if [ $? = 127 ]; then
            echo "Error: '$command' is not a known subcommand." >&2
            echo "       Run '$ProgName -h' for a list of known subcommands." >&2
            exit 1
        fi
        ;;
esac
