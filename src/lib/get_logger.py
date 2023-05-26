import logging
import os


def logger():
    loggingLevel = os.getenv("LOGGING_LEVEL", "INFO")
    logging.getLogger().setLevel(loggingLevel)
    return logging.getLogger()
