import json
import os
from typing import Dict

import jwt

# from distutils.util import strtobool
from jwt import PyJWKClient
from jwt.algorithms import get_default_algorithms

# import ssl
# import urllib.request
# import re
from lib import get_logger, principal_to_username

logger = get_logger.logger()

AUDIENCE = os.environ["AUDIENCE"]
JWKS_URI = os.environ["JWKS_URI"]
TOKEN_ISSUER = os.environ["TOKEN_ISSUER"]
LOCALSTACK = int(os.environ["LOCALSTACK"])

# UNVERIFIED_SSL = strtobool(os.environ["UNVERIFIED_SSL"])

"""
    Fix for [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate
"""

# class PyJWKClientSSLUnverified(PyJWKClient):
#     def fetch_data(self) -> Any:
#         with urllib.request.urlopen(
#             self.uri, context=ssl._create_unverified_context()
#         ) as response:
#             return json.load(response)


"""
    Handler
"""


def handler(event, _):
    logger.info("Event: %s", json.dumps(event))
    token = None
    try:
        assert "methodArn" in event, "Invalid token. No methodArn found."

        if "type" in event and event["type"] == "TOKEN":
            """
            REST
            """
            assert (
                    "authorizationToken" in event
            ), "Invalid token. No authorizationToken found."
            bearer, _, token = event["authorizationToken"].partition(" ")
            assert bearer == "Bearer", "Invalid token. No Bearer partition found."

            # Parse methodArn
            # r = re.compile(r"[:\/]")
            # arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
            # region, account, api, stage, method = r.split(arn)[3:8]
            arn = event["methodArn"]
            arn = "arn:aws:execute-api:*:*:*/*/*/*"  # override to allow all routes
        else:
            """
            WS
            """
            logger.debug(f"WS Authorize LS Mode is {LOCALSTACK}")
            if LOCALSTACK:
                logger.info(f"Authorizer in LOCALSTACK mode for WS with LS env {LOCALSTACK}")
                token = event["queryStringParameters"]["auth"]
            else:
                headers = {}
                for k in event["headers"]:
                    headers[k.lower()] = event["headers"][k]

                assert (
                        "sec-websocket-protocol" in headers
                ), "Invalid token. No sec-websocket-protocol header found."
                protocols = headers["sec-websocket-protocol"].split(",")
                assert len(protocols) == 2, "Invalid token. No found required protocols"
                # Second should be token
                token = protocols[1].strip()

            # arn = (
            #     ":".join(event["methodArn"].split(":")[:5])
            #     + ":"
            #     + event["requestContext"]["apiId"]
            #     + "/"
            #     + event["requestContext"]["stage"]
            #     + "/*"
            # )
            arn = "arn:aws:execute-api:*:*:*/*/*"  # override to allow all route keys

        logger.info(f"Token: {token}")
        logger.info(f"Arn: {arn}")

        decoded = validate_token(token)
        principal_id = principal_to_username(decoded["sub"])
        username = principal_id
        logger.debug(f"username {username} principalId {principal_id}")

        context = {
            "username": username,
            "principalId": principal_id,
            "scope": decoded["scope"],
            "permissions": json.dumps(decoded.get("permissions", [])),
        }
        policy = get_allow_policy(
            principal_id, context, arn
        )  # TODO make this compute list of all resources user is allowed to access
        logger.info(f"Policy : {policy}")
        return policy
    except Exception as e:
        logger.error(e, exc_info=True)

    return get_deny_policy(token)


def validate_token(token: str) -> Dict:
    """
    URL  # https://pyjwt.readthedocs.io/en/latest/api.html
    """

    header = jwt.get_unverified_header(token)
    logger.info(f"Unverified header: {header}")

    assert "kid" in header, "Invalid token. No kid found in header."

    kid = header["kid"]
    logger.info(f"Kid: {kid}")
    alg = header["alg"] if "alg" in header else "RS256"
    logger.info(f"Alg: {alg}")

    algorithms = get_default_algorithms()
    algorithm = algorithms.get(alg)
    assert (
            algorithm is not None
    ), f"Invalid token. Algorithm {alg} not supported (cryptography)"

    # client = (
    #     PyJWKClientSSLUnverified(JWKS_URI) if UNVERIFIED_SSL else PyJWKClient(JWKS_URI)
    # )
    client = PyJWKClient(JWKS_URI)
    key = client.get_signing_key(kid)
    decoded = jwt.decode(
        token,
        key.key,
        algorithms=[alg],
        issuer=TOKEN_ISSUER,
        audience=AUDIENCE,
        options={"verify_signature": True},
    )

    logger.info(f"Decoded: {decoded}")

    assert "sub" in decoded, "Invalid token. No sub found."
    assert "scope" in decoded, "Invalid token. No scope found."
    # assert "permissions" in decoded, "Invalid token. No permissions found."

    return decoded


def get_allow_policy(principal_id: str, context: Dict, arn: str) -> Dict:
    return {
        "principalId": principal_id,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {"Effect": "Allow", "Action": "execute-api:Invoke", "Resource": arn}
            ],
        },
        "context": context,
    }


def get_deny_policy(token: str) -> Dict:
    return {
        "principalId": token,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Deny",
                    "Action": "execute-api:Invoke",
                    "Resource": "arn:aws:execute-api:*:*:*/*/*/*",
                }
            ],
        },
    }
