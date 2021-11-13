# Coordinator Docker Image

Preconfigured Docker image for running Coordinator Service.

## Usage

```sh
docker run -it \
  -e mongo_host=<HOST> \
  -e mongo_port=<PORT> \
  -e mongo_user=<USER> \
  -e mongo_pass=<PASSWORD> \
  -e mongo_db=<DBNAME> \
  maci-node:a1
```

## Docker Compose

> **Note for Linux users:** On Linux, `host.docker.internal` is not
> currently supported. Instead, you will have to replace it with the
> IP address of your Docker host 
> To do this, run:
> ```
> CONTAINER_ID=$(docker container ls | grep maci-node | cut -d' ' -f1)
> docker exec $CONTAINER_ID /bin/bash -c 'apt install -y iproute2 && ip route' | awk '/^default via /{print $3}'
> ```
>
> This will print the host's IP address. Then, put it into `docker-compose.yml`:
>
> ```
> sed -i -e 's/host.docker.internal/<IP ADDRESS>/g' docker-compose.yml
> ```

```sh
docker-compose up
```

This will start Postgres and Coordinator Node in Docker and create persistent
data directories for Postgres in `./data/postgres`. You
can access these via:

- Coordinator Node:
  - HTTP: `http://localhost:8000/maci/<command>`
- Postgres:
  - `postgresql://maci-coordinator:let-me-in@localhost:5432/maci-db`
