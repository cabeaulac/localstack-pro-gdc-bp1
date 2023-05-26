import os

# import jwt
import pytest

# from auto_tests.utils.auth0_mock_utils import get_access_token
from auto_tests.utils.pulumi_utils import get_pulumi_output


# @pytest.fixture
def pulumi_output():
    """
    reads pulumi output in a given path

    default path can be overridden by setting env var PULUMI_OUTPUT_PATH

    @return: dict of pulumi output
    """
    path_to_file: str = os.getenv("PULUMI_OUTPUT_PATH", "./")
    return get_pulumi_output(path_to_file)

# TODO env var mocking doesn't work as expected | fixture x decorator issue
# @pytest.fixture
# def access_token():
#     """
#     gets the access token from auth0 mock for given credentials
#
#     Username & pwd can be overridden by setting env vars
#     AUTH0_MOCK_USERNAME && AUTH0_MOCK_PWD
#
#     @return: access token
#     """
#     username = os.getenv("AUTH0_MOCK_USERNAME", "pking")
#     passwrd = os.getenv("AUTH0_MOCK_PWD", "pk_test")
#     return get_access_token(username, passwrd)
#
#
# @pytest.fixture
# def auth_header_rest_api(access_token) -> dict:
#     """
#     Auth headers for rest api
#
#     @return: auth header needed for rest API calls
#     """
#     return {"Authorization": f"Bearer {access_token}"}
#
#
# @pytest.fixture
# def auth_header_ws_api(access_token) -> list:
#     """
#     Auth headers for WS api
#
#     @return: auth header needed for WS API calls
#     """
#     return [f"Sec-WebSocket-Protocol: auth, {access_token}"]

#
# @pytest.fixture
# def decode_access_token(access_token) -> dict:
#     """
#     Decoded access token
#     makes life easier if you need to get user props (like principal_id) for tests
#
#     @return: decoded auth token
#     """
#     return jwt.decode(access_token, options={"verify_signature": False})
