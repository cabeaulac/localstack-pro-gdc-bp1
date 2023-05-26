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
BUCKET_NAME = os.environ["BUCKET_NAME"]

s3 = get_client.client("s3")
dynamoDb = get_client.resource("dynamodb")


def handler(event, _):
    logger.info(f"handler event: {event}")

    try:
        principal_id = event["requestContext"]["authorizer"]["principalId"]
        # User id is the ID of the contact
        id = get_user_id(principal_id)

        user_table = db_access.UserTable(dynamoDb)
        # Range key was passed in the path
        s3_item_rk = event["pathParameters"]["rk"]

        keytuple = KeyTuple(id=id, rk=s3_item_rk)

        logger.debug(f"Deleting S3 item for body {event['body']}")
        item = user_table.get_by_pk(keytuple)
        logger.debug(f"Deleting S3 item {item}")
        s3.delete_object(Bucket=BUCKET_NAME, Key=item['s3key'])
        user_table.delete_table_item(keytuple)

    except (KeyError, Exception) as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        return exception_return(500, e.message)

    return gen_api_response_body(keytuple)
