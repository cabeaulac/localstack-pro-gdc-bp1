from typing import List, TypedDict, Union

class User(TypedDict):
    id: str  # Hash key
    rk: str  # Range key
    uid: str  # User Id
    prefs: dict  # user preferences
    createDt: str


class S3Item(TypedDict):
    id: str  # Hash key
    rk: str  # Range key
    s3key: str
    name: str
    desc: str
    createDt: str
    lastModDt: str
    size: int
    tags: List[str]


class KeyTuple(TypedDict):
    id: str  # Hash key
    rk: str  # Range key


UserDbItems = Union[
    User, S3Item, KeyTuple
]
