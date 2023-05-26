# Localstack-pro GDS Blueprint-1

## Setup

1. GDC install. https://gitlab.com/probello/generic-dev-container
2. Follow GDC Setup instructions. (Install DockerDesktop)
3. Clone this repos

## Quickstart

Get up and running now!

1. Create a file calle `.env` in the root of this repo. Put your Localstack Pro key in it like this

```shell
export LOCALSTACK_API_KEY=YOUR_KEY_HERE
```

2. Start GDC

```shell
# from the root of the cloned repo
~/<gdc dir>/run-dev-container.sh
```

5. Deploy the system to Localstack

```shell
# Open GDC shell
docker exec -it lsgdc-dev-1 bash -l
make local-toplevel-deploy
make local-db-deploy
make local-lsgdc-deploy
```

6. Run UI

```shell
# Open GDC shell
docker exec -it lsgdc-dev-1 bash -l
make local-lsgdc-run-ui
```

7. Login to UI
   Navigate to http://localhost:3030/

## Run tests

Everything is done from inside the GDC shell.

1. Open GDC shell

```shell
docker exec -it lsgdc-dev-1 bash -l
```

2. Create Python virtual env
   You only have to do this once.

```shell
make setup-venv
```

3. Run tests

```shell
# Run a hard-coded test 
make local-lsgdc-test-tags
```