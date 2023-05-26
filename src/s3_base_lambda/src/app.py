import json
import os
import traceback
from typing import List, TypedDict
from urllib.parse import unquote

import boto3

from lib import (  # Attachment,
    db_access,
    gen_api_response_body,
    get_client,
    get_cors_headers,
    get_logger, exception_return,
)

logger = get_logger.logger()

BUCKET_NAME = os.environ["BUCKET_NAME"]
TABLE_NAME = os.environ["DYNAMO_TABLE_NAME"]

dynamoDb = get_client.resource("dynamodb")
user_table = db_access.UserTable(dynamoDb, TABLE_NAME)


class BodyItem(TypedDict):
    index: int
    name: str
    type: str


def handler(event, _):
    logger.info(f"handler event: {event}")
    principal_id = event["requestContext"]["authorizer"]["principalId"]
    method = event["requestContext"]["httpMethod"]
    try:
        if method == "GET":
            result = user_table.get_s3_items(principal_id)
        else:
            raise Exception(f"Unsupported request method {method}")
    except (KeyError, Exception) as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        return exception_return(500, e.message)
    return gen_api_response_body(result)


def get_s3():
    return boto3.client("s3")


def download_data(inv_id, attch_id, req_id):
    s3 = get_s3()
    pk = {"id": inv_id, "rk": attch_id}
    item = user_table.get_by_pk(pk)
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": item["key"]},
        ExpiresIn=3600,
    )
    return {"url": url}
