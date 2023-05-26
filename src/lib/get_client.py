import os
import boto3

default_region = os.environ.get("AWS_REGION", "us-west-2")
LOCALSTACK = int(os.environ["LOCALSTACK"])
# If we're using Localstack, set the LOCALSTACK_ENDPOINT, otherwise set it to None (its default value)
if LOCALSTACK:
    LOCALSTACK_ENDPOINT = os.environ.get('LOCALSTACK_ENDPOINT', 'http://host.docker.internal:4566')
else:
    LOCALSTACK_ENDPOINT = None


def get_session():
    return boto3.session.Session()


def client(client_type, region: str = default_region):
    session = get_session()
    if session:
        return session.client(client_type, region_name=region, endpoint_url=LOCALSTACK_ENDPOINT)
    return boto3.client(client_type, region_name=region, endpoint_url=LOCALSTACK_ENDPOINT)


def resource(client_type: str, region: str = default_region):
    session = get_session()
    if session:
        return session.resource(client_type, region_name=region, endpoint_url=LOCALSTACK_ENDPOINT)
    return boto3.resource(client_type, region_name=region, endpoint_url=LOCALSTACK_ENDPOINT)
