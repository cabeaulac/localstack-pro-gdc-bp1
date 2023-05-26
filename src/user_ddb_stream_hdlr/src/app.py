import os

import boto3
import simplejson as json
from dynamodb_json import json_util as ddb_json
from boto3.dynamodb.conditions import Attr, Key

from lib import (
    DDB_ITEM_SEP,
    User,
    client,
    resource,
    db_access,
    ddb_item_names,
    get_client,
    get_logger,
    json_serial,
)

WS_CONNECTIONS_TABLE_NAME = os.environ["WS_CONNECTIONS_TABLE_NAME"]
MANAGEMENT_API_ENDPOINT = os.environ["MANAGEMENT_API_ENDPOINT"]
TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
LOGGING_LEVEL = os.environ["LOGGING_LEVEL"]

RK_USER = f"{ddb_item_names['user']}{DDB_ITEM_SEP}"
RK_S3ITEM = f"{ddb_item_names['s3item']}{DDB_ITEM_SEP}"

db = resource("dynamodb")
ws_table = db.Table(WS_CONNECTIONS_TABLE_NAME)
db_resource = get_client.resource("dynamodb")
user_table = db_access.UserTable(db_resource, TABLE_NAME)

logger = get_logger.logger()
logger.setLevel(LOGGING_LEVEL)

api_client = boto3.client(
    "apigatewaymanagementapi",
    endpoint_url=MANAGEMENT_API_ENDPOINT,
    region_name=AWS_REGION,
)


def handler(event, _):
    logger.debug('Event: %s', json.dumps(event))
    record_count = 0
    msg_count = 0
    for record in event["Records"]:
        try:
            record_count += 1
            eventName = record["eventName"]
            if eventName == "REMOVE":
                logger.debug('record: %s', json.dumps(record))
                msg_count += delete(record)
            elif eventName == "INSERT":
                msg_count += insert_or_modify(record, True)
            elif eventName == "MODIFY":
                msg_count += insert_or_modify(record, False)
        except Exception as e:
            logger.error(f"got exception {str(e)}", exc_info=e)
    logger.info(f"Processed {record_count} records to {msg_count} websocket clients")


def delete(record) -> int:
    rec = ddb_json.loads(record["dynamodb"]["OldImage"], as_dict=True)
    keys = ddb_json.loads(record["dynamodb"]["Keys"], as_dict=True)
    logger.debug(f"delete record {rec}")
    if rec["rk"].startswith(RK_S3ITEM):
        logger.info(f"Doing REMOVE on S3Item")
        logger.debug(f"with record {json.dumps(record, default=json_serial)}")
        return broadcast_msg(keys, "removeS3Item")
    return 0


def insert_or_modify(record, insert: bool) -> int:
    rec = ddb_json.loads(record["dynamodb"]["NewImage"], as_dict=True)
    # determine which event to send
    logger.debug(f"insert_or_modify record {rec}")

    if rec["rk"].startswith(RK_S3ITEM):
        logger.info(f"Doing Insert or Modify on S3Item")
        logger.debug(f"with record {json.dumps(record, default=json_serial)}")
        return broadcast_msg(rec, "insertS3Item" if insert else "modifyS3Item")
    return 0


def broadcast_msg(message: dict, action: str):
    msgs_sent = 0
    principal_id: str = message["id"]
    principal_id = principal_id.replace(f"{ddb_item_names['user']}{DDB_ITEM_SEP}", "")
    logger.debug(f"broadcast_msg for principal_id {principal_id}")
    # Get connectionId,pricipalId
    connections = list(
        map(
            lambda x: x["connectionId"],
            ws_table.scan(
                FilterExpression=Attr("principalId").eq(f"{principal_id}"),
                ProjectionExpression="connectionId",
                # IndexName="connection_id",
                #     AttributesToGet=[
                #         "connection_id"
                #   ],
            )["Items"],
        )
    )
    print("Connections:", connections)
    for c in connections:
        logger.info(f"WS connection data: {c}")
        if send_to_client(principal_id, c, action, message):
            msgs_sent += 1
    return msgs_sent


def delete_connection(principal_id: str, connection_id: str):
    try:
        ws_table.delete_item(
            Key={"id": principal_id, "connectionId": connection_id},
        )
        return True
    except Exception as e:
        logger.error("Failed to delete WS connection data", exc_info=e)
        return False


def send_to_client(principal_id: str, connection_id: str, action: str, message) -> bool:
    try:
        data = json.dumps({"action": action, "data": message}, default=json_serial)
        logger.debug(f"Sending msg to client: {data} with connectionId {connection_id}")
        api_client.post_to_connection(Data=data, ConnectionId=connection_id)
        return True
    except Exception as e:
        logger.error("Failed to send data WS connection", exc_info=e)
        delete_connection(principal_id, connection_id)
        return False
