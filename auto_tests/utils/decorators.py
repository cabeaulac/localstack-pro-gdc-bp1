import os
from unittest import mock


# TODO don't use in parallel with fixtures. Exec order is off
# mocks env vars for unit tests
def mock_env(**envvars):
    return mock.patch.dict(os.environ, envvars)
