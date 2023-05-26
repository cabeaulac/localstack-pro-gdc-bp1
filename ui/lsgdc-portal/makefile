SHELL := /bin/bash

all: clean build
	@echo "all..."

build:
	@echo "Build...."
	yarn install
	yarn run build

clean:
	rm -rf dist

reset:
	rm -rf node_modules
	rm -rf yarn.lock

run:
	yarn install
	yarn run dev
