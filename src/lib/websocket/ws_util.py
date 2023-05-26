import os
from decimal import Decimal

import boto3
import simplejson as json
from boto3.dynamodb.conditions import Attr, Key

from ..get_client import resource
from ..get_logger import logger
from ..utils import json_serial

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
environment = os.getenv("ENV", "dev")
WS_CONNECTIONS_TABLE_NAME = os.getenv("WS_CONNECTIONS_TABLE_NAME")
WS_CHAT_TABLE_NAME = os.getenv("WS_CHAT_TABLE_NAME")

WS_DDB_ITEM_SEP = "_"
ws_ddb_item_names = {"connection": "conn", "channel": "chan", "user": "user"}

db = resource("dynamodb")
ws_table = db.Table(WS_CONNECTIONS_TABLE_NAME)
chat_table = db.Table(WS_CHAT_TABLE_NAME) if WS_CHAT_TABLE_NAME else None

logger = logger()


def create_api_client(event: dict):
    domain_name = event["requestContext"].get("domainName", "")
    stage_name = event["requestContext"].get("stage", "")
    if not domain_name:
        domain_name = ""
    if not stage_name:
        stage_name = ""
    logger.info(f"endpoint_url = https://{domain_name}/{stage_name}")
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{domain_name}/{stage_name}",
        region_name=AWS_REGION,
    )


def put_ddb_item(table, item: dict, return_values="NONE"):
    try:
        return table.put_item(
            Item=json.loads(json.dumps(item), parse_float=Decimal),
            ReturnValues=return_values,
        )
    except Exception as e:
        logger.error(e)
        raise e


def broadcast_msg(
        api_client: boto3.client, message_type: str, message, channel: str = "*"
) -> list:
    logger.info("broadcast_msg ----------")
    logger.info(message_type)
    logger.info(message)
    if channel and not channel == "*":
        connections = list(
            map(
                lambda x: x["connectionId"],
                ws_table.scan(
                    FilterExpression=Key("id").eq(
                        f"{ws_ddb_item_names['channel']}{WS_DDB_ITEM_SEP}{channel}"
                    ),
                    ProjectionExpression="connectionId",
                )["Items"],
            )
        )
    else:
        connections = list(
            map(
                lambda x: x["connectionId"],
                ws_table.scan(
                    FilterExpression=Key("id").begins_with(
                        f"{ws_ddb_item_names['connection']}{WS_DDB_ITEM_SEP}"
                    ),
                    ProjectionExpression="connectionId",
                )["Items"],
            )
        )

    logger.info("----- broadcast_msg connections -------")
    logger.info(connections)
    results = []
    for c in connections:
        results.append(send_to_client(api_client, c, message_type, message))
    return results


def delete_connection(connection_id: str):
    try:
        ws_table.delete_item(
            Key={
                "id": f"{ws_ddb_item_names['connection']}{WS_DDB_ITEM_SEP}{connection_id}",
                "connectionId": connection_id,
            },
        )

        connections = ws_table.scan(
            FilterExpression=Attr("connectionId").eq(connection_id),
            ProjectionExpression="id, connectionId",
        )["Items"]

        for c in connections:
            try:
                ws_table.delete_item(
                    Key={"id": c["id"], "connectionId": c["connectionId"]},
                    ConditionExpression=Attr("connectionId").eq(connection_id),
                )
            except Exception as e:
                logger.error(e)
                continue
        return True
    except Exception as e:
        logger.error(e)
        return False


def disconnect_client(api_client: boto3.client, connection_id: str):
    try:
        api_client.delete_connection(ConnectionId=connection_id)
    except Exception as e:
        logger.error(e)
    return delete_connection(connection_id)


def send_to_user(
        api_client: boto3.client,
        user_id: str,
        action: str,
        message,
        status: bool = True,
):
    connections = list(
        map(
            lambda x: x["connectionId"],
            ws_table.scan(
                FilterExpression=Attr("principalId").eq(user_id),
                ProjectionExpression="id, connectionId",
            )["Items"],
        )
    )
    logger.info("----- send_to_user connections -------")
    logger.info(connections)
    results = []
    for c in connections:
        results.append(send_to_client(api_client, c, action, message, status))
    return results


def send_to_client(
        api_client: boto3.client,
        connection_id: str,
        action: str,
        message,
        status: bool = True,
):
    try:
        # use json_serial here to convert datetime types to isodate strings
        data = json.dumps(
            {"status": status, "action": action, "data": message}, default=json_serial
        )
        ret = api_client.post_to_connection(
            Data=data,
            ConnectionId=connection_id,
        )
        logger.info(ret)
        return data
    except Exception as e:
        logger.error(e)
        delete_connection(connection_id)
        return False


def update_username(connection_id: str, username: str):
    try:
        ws_table.update_item(
            Key={
                "id": f"{ws_ddb_item_names['connection']}{WS_DDB_ITEM_SEP}{connection_id}"
            },
            UpdateExpression="set username = :r",
            ExpressionAttributeValues={":r": username},
            ReturnValues="NONE",
        )
        return True
    except Exception as e:
        logger.error(e)
        return False


def get_chat_log(channel: str) -> list:
    logger.info(f"get_chat_log {channel}")
    results = []
    try:
        page = chat_table.scan(
            FilterExpression=Attr("id").eq(
                f"{ws_ddb_item_names['channel']}{WS_DDB_ITEM_SEP}{channel}"
            ),
        )
        logger.info(page)
        results.extend(page["Items"])
        while page["Count"] > 0:
            if "LastEvaluatedKey" in page:
                page = chat_table.scan(
                    FilterExpression=Attr("id").eq(
                        f"{ws_ddb_item_names['channel']}{WS_DDB_ITEM_SEP}{channel}"
                    ),
                    ExclusiveStartKey=page["LastEvaluatedKey"],
                )
                logger.info(page)
                results.extend(page["Items"])
            else:
                break
        return results
    except Exception as e:
        logger.error(e)
        return results


def get_body_data(event: dict) -> dict:
    if "body" not in event:
        return {}
    body = json.loads(event["body"])
    if "data" not in body:
        return {}
    return body["data"]


def shim_authorizer(event: dict) -> dict:
    # Authorizers temporary disabled for Localstack WS. Use Mock authorizer data.
    logger.info(f"----------- shim_authorizer {event}")
    if (
            "authorizer" not in event["requestContext"]
            or not event["requestContext"]["authorizer"]
    ):
        event["requestContext"]["authorizer"] = {
            "principalId": "samlp|shim|test@test.com",
            "permissions": "[]",
        }
    authorizer = event["requestContext"]["authorizer"]
    if "permissions" not in authorizer or not authorizer["permissions"]:
        authorizer["permissions"] = "[]"
    if "principalId" not in authorizer or not authorizer["principalId"]:
        authorizer["principalId"] = "samlp|shim|test@test.com"
    if "username" not in authorizer or not authorizer["username"]:
        authorizer["username"] = authorizer["principalId"]

    logger.info(f"Mock Authorizer: {json.dumps(authorizer)}")
    return event
