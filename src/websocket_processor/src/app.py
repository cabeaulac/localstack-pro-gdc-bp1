import os
import time

import simplejson as json
from boto3.dynamodb.conditions import Attr, Key

from lib import get_client, get_cors_headers, get_logger
from lib.websocket import (
    WS_DDB_ITEM_SEP,
    create_api_client,
    delete_connection,
    get_body_data,
    put_ddb_item,
    send_to_client,
    ws_ddb_item_names,
    ws_table,
)

WS_DISCONNECT_SNS_TOPIC_ARN = os.environ["WS_DISCONNECT_SNS_TOPIC_ARN"]
sns = get_client.resource("sns")
disconnect_topic = sns.Topic(arn=WS_DISCONNECT_SNS_TOPIC_ARN)
logger = get_logger.logger()


def handler(event, _):
    logger.info(f"WS Processor event: {event}")
    principal_id = event["requestContext"]["authorizer"]["principalId"]

    route = event["requestContext"]["routeKey"]
    connection_id = event["requestContext"]["connectionId"]
    api_client = create_api_client(event)
    body_data = get_body_data(event)

    if route == "$connect":
        put_ddb_item(
            ws_table,
            {
                "id": f"{ws_ddb_item_names['connection']}{WS_DDB_ITEM_SEP}{connection_id}",
                "connectionId": connection_id,
                "principalId": principal_id,
                "expires": time.time() + 7230,  # expires in 2 hours 30 sec
            },
        )

        # Switching Protocol
        in_headers = {}
        for k in event["headers"]:
            in_headers[k.lower()] = event["headers"][k]

        headers = get_cors_headers().copy()
        if "sec-websocket-protocol" in in_headers:
            # Select first protocol by default
            protocol = in_headers["sec-websocket-protocol"].split(", ")[0]
            headers["Sec-Websocket-Protocol"] = protocol
            logger.info(f"Switching Protocol headers: {headers}")

        return {"statusCode": 200, "headers": headers, "body": route}

    elif route == "$disconnect":
        delete_connection(connection_id)
        msg = {
            "requestContext": {
                "routeKey": event["requestContext"]["routeKey"],
                "domainName": event["requestContext"]["domainName"],
                "stage": event["requestContext"]["stage"],
                "connectionId": event["requestContext"]["connectionId"],
                "authorizer": event["requestContext"]["authorizer"],
            }
        }
        msg_id = publish_message(disconnect_topic, msg)
        logger.info(f"sns publish msg id {msg_id}")

    elif route == "ping":
        send_to_client(
            api_client,
            connection_id,
            "pong",
            {
                "client_ts": body_data["client_ts"],
                "server_ts": round(time.time() * 1000),
            },
        )

    else:
        send_to_client(
            api_client,
            connection_id,
            "sysMsg",
            {"message": "Unknown action"},
            False,
        )
        return {"statusCode": 500, "headers": get_cors_headers(), "body": route}

    return {"statusCode": 200, "headers": get_cors_headers(), "body": route}


def publish_message(topic, message):
    """
    Publishes a message to a topic.

    :param topic: The topic to publish to.
    :param message: The message to publish.
    :return: The ID of the message or None on error.
    """
    try:
        logger.info(f"sns topic publish {message}")
        response = topic.publish(Message=json.dumps(message))
        return response["MessageId"]
    except Exception as e:
        logger.error(e)
        return None
