import traceback
import uuid
import json

from lib.get_logger import logger

LOGGER = logger()


def exception_return(status_code: int, err_response: str = "INTERNAL_SERVER_ERROR"):
    """
    Handles returns when exceptions are thrown so the user gets the error ID from the exception

    :Arguments:
    - status_code(int): HTTP Status Code
    - err_id(str): stringified uuid value that is created on exception
    - err_response(str): General error response

    :Return:
    - dict: Value to be returned by the api gateway
    """
    return {
        "statusCode": status_code,
        "body": json.dumps({"message": err_response}),
    }


class AppException(Exception):
    """
    Base App Exception. This exception will format the log messages with the
    traceback.
    """

    def __init__(self, message, tb):
        self.message = message
        self.tb = ''.join(traceback.format_tb(tb))
        self.err_id = str(uuid.uuid4())
        super().__init__(self.message)
        self._log_error()

    def __str__(self):
        return f'message: {self.message} tb: {self.tb}'

    def _log_error(self):
        """
        Logs error information on db connection errors
        """
        LOGGER.error({"message": self.message,
                      "traceback": self.tb,
                      "err_id": self.err_id})
