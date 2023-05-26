import os
from auto_tests.utils.apigw_aws_utils import format_res
from auto_tests.utils.request_utils import get_request, post_request
from lib import get_logger

logger = get_logger.logger()


def get_auth0_mock_endpoint() -> str:
    return "http://" + os.getenv("AUTH0_CONTAINER_NAME", "localhost") + ":3001"


def login(username: str, pw: str):
    get_request(get_auth0_mock_endpoint() + "/login", {"username": username, "pw": pw})


def logout():
    get_request(get_auth0_mock_endpoint() + "/logout", {})


def get_access_token():
    res = get_request(get_auth0_mock_endpoint() + "/access_token", {})
    return format_res(res)["content"].decode("utf - 8")


def login_get_jwt(username: str, pw: str):
    # Login with session and credentials
    login(username, pw)
    # Get a JWT
    jwt = get_access_token()
    return jwt
