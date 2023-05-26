import os
import traceback

from lib import (
    db_access,
    gen_api_response_body,
    get_client,
    get_cors_headers,
    get_logger, exception_return,
)

logger = get_logger.logger()

tableName = os.environ["DYNAMO_TABLE_NAME"]


def handler(event, _):
    logger.info(f"handler event: {event}")

    try:
        dynamodb = get_client.resource("dynamodb")
        ddb_table = db_access.UserTable(dynamodb, tableName)
        principal_id = event["requestContext"]["authorizer"]["principalId"]
        # username = event["requestContext"]["authorizer"]["username"]
        # uid = event["pathParameters"]["uid"]
        logger.debug(f"principalId {principal_id}")
        result = ddb_table.get_user(principal_id)
        logger.info(f"result: {result}")
    except (KeyError, Exception) as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        return exception_return(500, e.message)
    return gen_api_response_body(result)
