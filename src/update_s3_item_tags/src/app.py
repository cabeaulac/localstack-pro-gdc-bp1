import os
import traceback

import simplejson as json
from dynamodb_json import json_util as ddb_json

from lib import (
    db_access,
    gen_api_response_body,
    get_client,
    get_user_id,
    get_cors_headers,
    get_logger, exception_return,
    KeyTuple
)

logger = get_logger.logger()

tableName = os.environ["DYNAMO_TABLE_NAME"]
dynamoDb = get_client.resource("dynamodb")


def handler(event, _):
    logger.info(f"handler event: {event}")

    try:
        principal_id = event["requestContext"]["authorizer"]["principalId"]
        # User id is the ID of the contact
        id = get_user_id(principal_id)
        # Get the new tags
        body = json.loads(event["body"], use_decimal=True)

        user_table = db_access.UserTable(dynamoDb)
        # Range key was passed in the path
        s3_item_rk = event["pathParameters"]["rk"]

        keytuple = KeyTuple(id=id, rk=s3_item_rk)

        logger.debug(f"Updating s3 item tags for {keytuple}")
        item = user_table.update_s3_item_tags(keytuple, body)

    except (KeyError, Exception) as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        return exception_return(500, e.message)

    return gen_api_response_body(item)
