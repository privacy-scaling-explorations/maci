## Useful Docker Commands

### remove <none> tag images

docker rmi $(docker images -f 'dangling=true' -q)

### build docker image by local Dockerfile

docker build -t maci-node .
