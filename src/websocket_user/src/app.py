import os

import simplejson as json

from lib import db_access, get_client, get_cors_headers, get_logger
from lib.websocket import (
    broadcast_msg,
    create_api_client,
    get_body_data,
    send_to_client,
)

TABLE_NAME = os.environ["TABLE_NAME"]
user_table = db_access.UserTable(get_client.resource("dynamodb"), TABLE_NAME)

logger = get_logger.logger()


# can be called by apigwv2 proxy integration or sqs
def handler(event, _):
    logger.info(f"User WS Processor event: {event}")
    # if Records exists then this is being invoked by sqs which may contain more than one event
    if "Records" in event:
        ret = None
        for rec in event["Records"]:
            # body is a json string
            body = json.loads(rec["body"])
            # Message is json string
            msg = json.loads(body["Message"])
            logger.info(f"User WS Processor Record: {msg}")
            ret = process_event(msg)
        # right now we return the result of the last message
        return ret
    return process_event(event)


def process_event(event):
    route = event["requestContext"]["routeKey"]
    connection_id = event["requestContext"]["connectionId"]
    api_client = create_api_client(event)
    # body_data = get_body_data(event)

    # this is forwarded by ws proc lambda
    if route == "$disconnect":
        logger.info("!!!! got sns ws disconnect event !!!!!!")

    else:
        send_to_client(
            api_client,
            connection_id,
            route,
            {"message": "Unknown action"},
            False,
        )
        return {"statusCode": 500, "headers": get_cors_headers(), "body": route}

    return {"statusCode": 200, "headers": get_cors_headers(), "body": route}
