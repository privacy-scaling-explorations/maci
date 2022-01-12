# Coordinator Docker Image

Preconfigured Docker image for running Coordinator Service.

## Docker Compose

```sh
./setup.sh
docker-compose up
```

This will start maci coordinator service and mongodb in Docker and create persistent
data directories for mongodb in `./data/mongodb`.
