import os

import pytest
from asyncio import Event
import asyncio

import requests as requests
import simplejson as json

from auto_tests.utils import DotDict_utils
from auto_tests.utils import get_aws_client as get_client
from auto_tests.utils.WsClient_utils import AsyncWSClient, S3WSEvents
from auto_tests.utils.auth0_mock_utils import login_get_jwt, logout
from auto_tests.utils import user_test_utils as utu
from auto_tests.utils.fixtures import pulumi_output
from auto_tests.utils.headers_utils import get_auth_header_rest_api
from auto_tests.utils.user_test_utils import upload_file_to_s3_presigned_url, get_url_param
from lib import get_logger, db_access

logger = get_logger.logger()


@pytest.mark.integration
class TestS3Items():
    @staticmethod
    def get_env_vars(iac_output):
        return DotDict_utils.DotDict(
            {
                "REST_API_ENDPOINT": iac_output["userRestApiEndpoint"],
                "DYNAMO_TABLE_NAME": iac_output["userTableName"],
                "USER_S3_BUCKET_NAME": iac_output["userBucket"]["bucket"],
                "AUTH_URL": os.getenv("AUTH0_DOMAIN"),
                "AUTH_CLIENT_ID": os.getenv("AUTH0_CLIENT_ID"),
                "WEBSOCKET_API_ENDPOINT": iac_output["userWebsocketApiEndpoint"],
                "WS_CONNECTION_TABLE_NAME": iac_output["wsConnectionsTableName"],
            }
        )

    async def ws_connection_setup(self, conn_event: Event):
        """
        Async coro to wait for the WS async connection to be established
        before uploading a file to S3
        """
        logger.info("wait for WS connection to get setup")
        await conn_event.wait()
        logger.info("connection established. uploading S3Item now")
        # Now we start the chain of events that will eventually result in a message being received
        # Get signed S3 upload URL
        url = f"{self.env.REST_API_ENDPOINT}/v1/upload"
        logger.info(f"url: {url}")
        headers = {"Accept": "application/json", **get_auth_header_rest_api(
            self.jwt)}
        s3_upload = {'files': [{'index': 1,
                                'name': 'test_png1.png',
                                'type': 'png',
                                'path': ''}],
                     'area': 's3_upload'}
        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(s3_upload),
        )
        print("#######################")
        logger.info(f"response: {response.text}")
        assert response.status_code == 200
        rso = json.loads(response.text)
        assert len(rso["data"]) == 1
        # Assert the upload URLs have all the special Amazon URL params encoded
        for link_data in rso["data"]:
            assert "url" in link_data
            assert get_url_param(link_data['url'], "X-Amz-Algorithm") is not None
            assert get_url_param(link_data['url'], "X-Amz-Credential") is not None
            assert get_url_param(link_data['url'], "X-Amz-Date") is not None
            assert get_url_param(link_data['url'], "X-Amz-Expires") is not None
            assert get_url_param(link_data['url'], "X-Amz-SignedHeaders") is not None
            assert get_url_param(link_data['url'], "X-Amz-Security-Token") is not None
            assert get_url_param(link_data['url'], "X-Amz-Signature") is not None
        # Upload the file to S3 using the presigned URL
        upload_resp = upload_file_to_s3_presigned_url('auto_tests/data/test_png1.png', rso['data'][0]['url'])
        assert upload_resp.status_code == 200

    async def wait_for_insert_s3_item_msg(self, disconnect_ws=True):
        """
        Async coro waiting for insertS3Item WS message
        """
        # Wait for the event to be set
        counter = 1
        while counter < 60 * 10:
            if self.insert_event.is_set():
                logger.info("wait_for_insert_s3_item_msg unblocked")
                break
            else:
                await asyncio.sleep(0.1)
                counter += 1
        if counter == 60 * 10:
            pytest.fail("insert s3 item never received message")
        if disconnect_ws:
            self.ws_client.disconnect()

    async def wait_for_delete_s3_item_msg(self, disconnect_ws=True):
        """
        Async coro waiting for insertS3Item WS message
        """
        # Wait for the event to be set
        counter = 1
        while counter < 60 * 10:
            if self.delete_event.is_set():
                logger.info("wait_for_delete_s3_item_msg unblocked")
                break
            else:
                await asyncio.sleep(0.1)
                counter += 1
        if counter == 60 * 10:
            pytest.fail("remove item never received message")
        if disconnect_ws:
            self.ws_client.disconnect()

    @pytest.fixture(autouse=True)
    def run_around_tests(self):
        """
        This runaround fixture runs everything before the yield before each test,
        then yields for the test,
        then runs everything after the yield.
        """
        # parse the pulumi pipeline output into env variables we can use
        p_output = pulumi_output()
        self.env = TestS3Items.get_env_vars(p_output)

        # login and get the JWT
        self.jwt = login_get_jwt("chad",
                                 "chad")
        # get the current logged in user, will create user in DDB if doesn't already exist
        # we want to do this to get the user object created in DDB before we add stuff to it
        url = f"{self.env.REST_API_ENDPOINT}/v1/user"
        response = requests.get(
            url, headers=get_auth_header_rest_api(
                self.jwt)
        )
        logger.info(f"user {response.text}")
        self.user = json.loads(response.text)['data']
        self.principal_id = self.user['id'].replace("usr_", "")
        # Create WS Client
        self.ws_client = AsyncWSClient(
            f"{self.env.WEBSOCKET_API_ENDPOINT}?auth={self.jwt}", None)
        # Wait for test to run now
        yield
        logout()
        # Run after test is done
        # Clear all the user table entries
        dynamoDb = get_client.resource("dynamodb")
        s3 = get_client.resource("s3")
        user_table = db_access.UserTable(dynamoDb, self.env.DYNAMO_TABLE_NAME)
        utu.clearUserDdbItems(user_table)
        utu.clearWsConnectionTable(dynamoDb.Table(self.env.WS_CONNECTION_TABLE_NAME))
        utu.clearUserS3Items(s3, self.env.USER_S3_BUCKET_NAME)

    async def main(self, *coros):
        """
        Run the async test coroutines
        """
        await asyncio.gather(*coros)
        logger.info("All tasks have completed now.")

    # @pytest.mark.skip(reason="isolating other test")
    def test_insert_one_s3_item(self):
        """
        Async test runs 3 asyncio coroutines.
        1. coro establishes a WS connection to the server
        2. coro waits for WS connection from (1) to be established before uploading a file to the Vault
        3. coro waiting for insertS3Item WS message
        """
        self.insert_event = asyncio.Event()
        self.delete_event = asyncio.Event()

        def _s3_item_inserted(ws, data, id):
            """
            WS callback for insertVaultItem
            """
            logger.info(f"S3Item inserted: {data}")
            assert data is not None
            assert data['id'] == self.user['id']
            assert data['s3key'] == f"users/s3_upload/{self.principal_id}/test_png1.png"
            assert data['name'] == "test_png1.png"
            assert data['tags'] == []
            # Set the event to indicate completion
            self.insert_event.set()

        # Subscribe to insertS3Item WS messages
        self.ws_client.subscribe(
            S3WSEvents.ON_S3_ITEM_INSERT,
            _s3_item_inserted
        )

        conn_event = asyncio.Event()
        asyncio.run(self.main(
            self.wait_for_insert_s3_item_msg(),
            self.ws_connection_setup(conn_event),
            self.ws_client.run_client(conn_event)))

    # @pytest.mark.skip(reason="isolating other test")
    def test_insert_and_delete_one_s3_item(self):
        """
        Async test runs 3 asyncio coroutines.
        1. coro establishes a WS connection to the server
        2. coro waits for WS connection from (1) to be established before uploading a file to the Vault
        3. coro wait for insertS3Item WS message
        4. coro waits for removeS3Item WS message
        """
        self.insert_event = asyncio.Event()
        self.delete_event = asyncio.Event()
        self.s3_item_rk = None

        def _s3_item_inserted(ws, data, id):
            """
            WS callback for insertS3Item
            """
            logger.info(f"S3Item inserted: {data}")
            assert data is not None
            assert data['id'] == self.user['id']
            assert data['s3key'] == f"users/s3_upload/{self.principal_id}/test_png1.png"
            assert data['name'] == "test_png1.png"
            assert data['tags'] == []
            self.s3_item_rk = data['rk']
            # Set the event to indicate completion
            self.insert_event.set()
            # Yay! An S3Item was inserted, now lets delete it!
            url = f"{self.env.REST_API_ENDPOINT}/v1/s3/{data['rk']}"
            response = requests.delete(
                url, headers=get_auth_header_rest_api(
                    self.jwt)
            )
            assert response.status_code == 200

        def _s3_item_deleted(ws, data, id):
            """
            WS callback for insertS3Item
            """
            logger.info(f"S3Item deleted: {data}")
            if data['rk'] == self.s3_item_rk:
                assert data is not None
                assert data['id'] == self.user['id']
                # assert data['s3key'] == f"users/s3_upload/{self.principal_id}/test_png1.png"
                # assert data['name'] == "test_png1.png"
                # assert data['tags'] == []
                #
                # Query for all s3 items now
                url = f"{self.env.REST_API_ENDPOINT}/v1/s3"
                response = requests.get(
                    url, headers=get_auth_header_rest_api(
                        self.jwt)
                )
                assert response.status_code == 200
                rso = json.loads(response.text)
                assert rso['data'] == []

                # Set the event to indicate completion
                self.delete_event.set()
            else:
                # This happens because we cleanup from the previous test and delete everything from DDB and S3
                # The items getting deleted from DDB cause the User DDB Table stream handler to send messages
                logger.info(f"got WS delete event for S3Item we're not testing")

        # Subscribe to WS messages
        self.ws_client.subscribe(
            S3WSEvents.ON_S3_ITEM_INSERT,
            _s3_item_inserted
        )
        self.ws_client.subscribe(
            S3WSEvents.ON_S3_ITEM_DELETE,
            _s3_item_deleted
        )

        conn_event = asyncio.Event()
        asyncio.run(self.main(
            self.wait_for_insert_s3_item_msg(disconnect_ws=False),
            self.wait_for_delete_s3_item_msg(),
            self.ws_connection_setup(conn_event),
            self.ws_client.run_client(conn_event)))

    # @pytest.mark.skip(reason="isolating other test")
    def test_modify_s3_item_tags(self):
        """
        Async test runs 3 asyncio coroutines.
        1. coro establishes a WS connection to the server
        2. coro waits for WS connection from (1) to be established before uploading a file to the Vault
        3. coro waiting for insertS3Item WS message
        """
        self.insert_event = asyncio.Event()
        self.delete_event = asyncio.Event()

        def _s3_item_inserted(ws, data, id):
            """
            WS callback for insertS3Item
            """
            logger.info(f"S3Item inserted: {data}")
            assert data is not None
            assert data['id'] == self.user['id']
            assert data['s3key'] == f"users/s3_upload/{self.principal_id}/test_png1.png"
            assert data['name'] == "test_png1.png"
            assert data['tags'] == []
            # Now let's add one tag
            url = f"{self.env.REST_API_ENDPOINT}/v1/s3/{data['rk']}/tags"
            response = requests.patch(
                url, headers=get_auth_header_rest_api(
                    self.jwt), json=["chad"])
            rso = json.loads(response.text)
            logger.info(f"updated s3_item with tag {rso['data']}")
            assert rso['data']['tags'] == ['chad']
            # Set the event to indicate completion
            self.insert_event.set()

        # Subscribe to insertS3Item WS messages
        self.ws_client.subscribe(
            S3WSEvents.ON_S3_ITEM_INSERT,
            _s3_item_inserted
        )

        conn_event = asyncio.Event()
        asyncio.run(self.main(
            self.wait_for_insert_s3_item_msg(),
            self.ws_connection_setup(conn_event),
            self.ws_client.run_client(conn_event)))
