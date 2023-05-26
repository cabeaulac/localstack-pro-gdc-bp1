import copy
import os
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional
import random
import uuid

import simplejson as json
from boto3.dynamodb.conditions import Attr, Key
from dynamodb_json import json_util as ddb_json

from .get_logger import logger
from .model_types import (
    UserDbItems,
    User,
    S3Item, KeyTuple,
)
from .utils import DECIMAL_PRECESSION, non_zero

logger = logger()

DDB_ITEM_SEP = "_"
ddb_item_names = {
    "user": "usr",
    "s3item": "s3",
}


def get_user_id(user_id: str) -> str:
    return f"{ddb_item_names['user']}{DDB_ITEM_SEP}{user_id}"


def get_user_rk(timestamp: str) -> str:
    return f"{ddb_item_names['user']}{DDB_ITEM_SEP}{timestamp}"


def get_s3_item_rk(name: str, timestamp: str) -> str:
    return f"{ddb_item_names['s3item']}{DDB_ITEM_SEP}{name}-{timestamp}"


def timestamp() -> str:
    return datetime.utcnow().isoformat()


def _prepare_update_value(value) -> dict:
    return {"Value": value, "Action": "PUT"}


def get_item_id(item):
    return item["id"]


class UserTable:
    def __init__(self, dynamo_resource, table_name=None) -> None:
        self.dynamo_resource = dynamo_resource

        if not table_name:
            self.table_name = os.environ["DYNAMO_TABLE_NAME"]
        else:
            self.table_name = table_name
        self.table = self.dynamo_resource.Table(self.table_name)

    def save_user(self, usr: User):
        """Saves an existing top-level user"""
        new_user = json.loads(json.dumps(usr), parse_float=Decimal)
        logger.info(f"saving user {new_user}")
        self.table.put_item(Item=new_user, ReturnValues="NONE")

    def create_new_user(self, uid: str) -> User:
        """Adding new user"""
        now = datetime.now().isoformat()
        usr = User({
            "id": get_user_id(uid),
            "rk": get_user_rk(now),
            "uid": uid,
            "createDt": now,
            "prefs": {},
        })
        self.save_user(usr)
        return usr

    def get_user(self, uid: str) -> Optional[User]:
        """returns the user"""
        logger.info("get_user for user_id: %s", uid)
        db_uid = get_user_id(uid)
        response = self.table.query(
            KeyConditionExpression=Key("id").eq(db_uid),
            ScanIndexForward=False
            # TableName=self.table_name,
        )
        items = response["Items"]
        if items:
            return self._build_user_from_items(items)
        else:
            return self.create_new_user(uid)

    def _build_user_from_items(
            self, items: List[UserDbItems]
    ) -> Optional[User]:
        result: Optional[User] = None
        for item in items:
            # logger.info("item: %s", item)
            sort_key = item["rk"]
            if sort_key.startswith(f"{ddb_item_names['user']}{DDB_ITEM_SEP}"):
                result = item
                break

        if result is None:
            return None
        return result

    def update_s3_item_tags(self, key: KeyTuple, tags: List[str]) -> S3Item:
        conditional_expression = None

        update_args = {
            "Key": {"id": key["id"], "rk": key["rk"]},
            "UpdateExpression": "set  #tags = :tags",
            "ExpressionAttributeNames": {
                "#tags": "tags"
            },
            "ExpressionAttributeValues": {
                ":tags": tags
            },
            "ReturnValues": "ALL_NEW",
        }
        if conditional_expression is not None:
            update_args["ConditionExpression"] = conditional_expression
        resp = self.table.update_item(**update_args)
        return ddb_json.loads(resp["Attributes"], as_dict=True)

    def get_by_pk(self, pk):
        """returns item by PK"""
        logger.info("get_by_pk inv PK: %s", pk)
        response = self.table.get_item(Key=pk)
        item = response["Item"]
        return item

    def delete_table_item(self, item: UserDbItems):
        self.table.delete_item(Key={"id": item["id"], "rk": item["rk"]})

    def add_s3_item(self, s3_item: S3Item) -> S3Item:
        self.table.put_item(
            Item=json.loads(json.dumps(s3_item), parse_float=Decimal)
        )
        return s3_item

    def get_s3_items(self, principal_id: str) -> List[S3Item]:
        response = self.table.query(
            KeyConditionExpression=Key("id").eq(f"{ddb_item_names['user']}{DDB_ITEM_SEP}{principal_id}")
                                   & Key("rk").begins_with(f"{ddb_item_names['s3item']}{DDB_ITEM_SEP}")
        )
        if len(response["Items"]):
            return response["Items"]
        return []
