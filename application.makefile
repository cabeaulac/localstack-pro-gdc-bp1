PAR0_RUNNING = $(strip $(shell docker ps --format "{{.Names}}" | grep -c par0-dev-1))
AUTH0_LOWER_AUDIENCE = $(shell echo $(AUTH0_AUDIENCE) | tr A-Z a-z)
AUTH0_API_ENDPOINT_URL = "$(AUTH0_LOWER_AUDIENCE)ApiEndpointUrl"
AUTH0_CLIENT_ID_KEY = "$(AUTH0_LOWER_AUDIENCE)ClientId"

# Put application specific pre-deployment tasks here.  This target is
# invoked after the similar shared target has occurred and is part of
# preparing a Docker/Localstack environment to deploy the application.
# It provides the application the opportunity to start addition containers if
# needed to run the applicaiton locally.

up-compose-application:
	CURRENT_DIR=$${PWD##*/} AUTH0_AUDIENCE=$(AUTH0_AUDIENCE) DB_PROJECT_ROOT=.. docker-compose -f auto_tests/docker-compose.yml up -d

# Put application specific post-deployment tasks here. This target is
# invoked before the similar shared target and is part of disassembling
# the Docker/Localstack enviroment built previsously.  It provides the
# opportunity to remove any containers that where started by up-compose.

down-compose-application:
	CURRENT_DIR=$${PWD##*/} DB_PROJECT_ROOT=.. docker-compose -f auto_tests/docker-compose.yml down

# Set Pulumi Configuration here
#
#   Configuration should be added using the template;
#   	$(PULUMI_CONFIG) set <pulumi-variable> $(<makefile-variable>)
#
stack-init-application:
	$(PULUMI_CONFIG) set-all \
	--plaintext site_host_name=$(SITE_HOST_NAME) \
	--plaintext app_version=$(APP_VERSION) \
	--plaintext api_version=v1 \
	--plaintext hosted_zone_name=$(HOSTED_ZONE_NAME) \
	--plaintext hosted_zone_id=$(HOSTED_ZONE_ID) \
	--plaintext aws_region=$(AWS_REGION) \
	--plaintext aws_account=$(AWS_ACCOUNT) \
	--plaintext profiles=$(ACTIVE_PROFILES) \
	--plaintext aws_account_type=$(AWS_ACCOUNT_TYPE) \
	--plaintext auth0_audience=$(AUTH0_AUDIENCE) \
	--plaintext logging_level=$(LOGGING_LEVEL) \
	--plaintext auth0_audience=$(AUTH0_AUDIENCE) \
	--plaintext auth0_domain=$(AUTH0_DOMAIN) \
	--plaintext auth0_client_id=$(AUTH0_CLIENT_ID)

# source packaging and assembly ---------------------------------------

SUBDIRS := $(dir $(shell find src -name "makefile"))

build: build-src

clean-src: $(SUBDIRS)
	for i in $(SUBDIRS); do \
        $(MAKE) -C $$i clean; \
    done

build-src:
	for i in $(SUBDIRS); do \
        $(MAKE) -C $$i build; \
    done

delete-zips:
	find ./src -type f -name '*.zip' -delete

# TODO make venv creation dynamic
# Setup python
setup-venv: requirements-dev.txt
	/usr/local/pyenv/shims/python3 -m venv --clear venv
	( \
	source venv/bin/activate; \
	python3 -m pip install --upgrade pip; \
	pip3 install -r requirements-dev.txt; \
	);

local-lsgdc-dump-ddb-user-table:
	aws --endpoint-url=$(LOCALSTACK_ENDPOINT) dynamodb scan --table-name $$(pulumi stack output userTableName -s $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR))

# TODO coverage not working properly | doesn't show what we missed need to config
test:
	pulumi stack output -s $(STACK_PREFIX).$(STACK_SUFFIX) -j > ./pulumi_output.json --cwd $(STACK_DIR) && \
	source venv/bin/activate && env | grep AWS && pytest $(ARGS);

local-lsgdc-test-tags:
	make test ARGS="auto_tests/test_s3_tags.py"

outputs:
	@echo VITE_API_BASE - par0ClientId: `$(PULUMI_OUTPUT) par0ClientId`
	@echo VITE_API_BASE - par0Url: `$(PULUMI_OUTPUT) par0Url`


local-lsgdc-run-ui:
	pulumi stack select $(STACK_PREFIX).$(STACK_SUFFIX)  --cwd $(STACK_DIR) --non-interactive && \
	VITE_IS_LOCAL=$(IS_LOCAL) \
	VITE_AUTH0_AUDIENCE=$(AUTH0_AUDIENCE) \
	VITE_AUTH0_CLIENT_ID=$(AUTH0_CLIENT_ID) \
	VITE_AUTH0_DOMAIN=$(AUTH0_DOMAIN) \
	VITE_API_BASE=$$(pulumi stack output apiEndpoint --cwd $(STACK_DIR)) \
	VITE_API_STAGE=$$(pulumi stack output apiStage --cwd $(STACK_DIR)) \
	VITE_API_VERSION=$$(pulumi stack output apiVersion --cwd $(STACK_DIR)) \
	VITE_WEBSOCKET_API_ENDPOINT=$$(pulumi stack output userWebsocketApiEndpoint --cwd $(STACK_DIR)) \
	VITE_APP_VERSION=$(APP_VERSION) \
	$(MAKE) -C ./ui/lsgdc-portal run


reset:
	- stop-ls.sh
	- rm iac/Pulumi.*.yaml
	- rm -rf /root/shared/global-iac/.pulumi
	- rm -rf iac/.pulumi
	- rm -rf /workspace/ls_volume/*
	- start-ls.sh

it-again: reset
	make local-toplevel-deploy
	make local-db-deploy
	make local-lsgdc-deploy

