import json
import asyncio
import signal
from asyncio import Task, Event

import websockets
from enum import Enum
from typing import Any, TypedDict, Union
from lib import get_logger, KeyTuple, S3Item

logger = get_logger.logger()
WS_DEFAULT_TIMEOUT = 30  # time in seconds from https://websocket-client.readthedocs.io/en/latest/examples.html#setting-timeout-value


class S3WSEvents(Enum):
    ON_S3_ITEM_INSERT = "insertS3Item"
    ON_S3_ITEM_DELETE = "removeS3Item"


class WSMessage(TypedDict):
    action: S3WSEvents
    data: Union[KeyTuple, S3Item, Any]
    status: bool


class AsyncWSClient:

    def __init__(self, ws_url: str, headers: list):
        self.open_callback = None
        self.close_callback = None
        self.error_callback = None
        self.generic_events = {}
        self.aiotask = None | Task
        self.disconnect_timer = None
        self.error = None
        self.event = asyncio.Event()
        self.ws_url = None
        self.ws_url = ws_url

    def is_error(self):
        return self.error is not None

    async def run_client(self, conn_event: Event):
        async with websockets.connect(self.ws_url) as websocket:
            conn_event.set()
            # Close the connection when receiving SIGTERM.
            loop = asyncio.get_running_loop()
            loop.add_signal_handler(
                signal.SIGTERM, loop.create_task, websocket.close())
            while self.event.is_set() is not True:
                async for message in websocket:
                    logger.info(f"------WS msg\n{message}")
                    # The very first message that comes from the WS server is empty, don't know why yet.
                    if message.strip():
                        await self._message_handler(message)
                    await asyncio.sleep(0)
            logger.info(f"WSClient event trigger is {self.event.is_set()}. Exiting")

    def disconnect(self):
        logger.info(f"Disconnecting")
        self.event.set()
        signal.raise_signal(signal.SIGTERM)

    def subscribe(self, event_type: S3WSEvents, callback):
        key = AsyncWSClient._make_callback_key(event_type.value, None)
        logger.info(f"Subscribed a handler for key {key}")
        self.generic_events[key] = callback

    def unsubscribe_all(self):
        logger.info(f"unsubscribe all WS events")
        self.generic_events = {}

    def send_message(self, msg: WSMessage):
        data = json.dumps(msg)
        logger.info(f"Send message: {data}")
        self.ws_app.send(data)

    async def _message_handler(self, msg):
        parsed_msg = json.loads(msg)
        logger.info(f"parsed msg {parsed_msg}")
        data = parsed_msg.get("data")
        logger.info(f"Action: {parsed_msg.get('action')}")
        # Call a generic event handler first
        key = AsyncWSClient._make_callback_key(parsed_msg.get("action"))
        handler = self.generic_events.get(key)
        if handler is not None:
            handler(self, data, None)

    @staticmethod
    def _make_callback_key(event_type_value, id=None):
        res = (
            f"{event_type_value}_{id}"
            if id is not None
            else event_type_value
        )
        logger.info(f"Callback key: {res}")
        return res
