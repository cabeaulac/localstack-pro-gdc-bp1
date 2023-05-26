from auto_tests.utils.DotDict_utils import DotDict


class PyJWKClient:
    def __init__(self, jwks_uri: str):
        self.jwks_uri = jwks_uri

    def get_signing_key(self, kid: str):
        return DotDict({"key": "signing_key"})
