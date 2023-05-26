import copy
import math
import random
import string
import traceback
import typing
from datetime import date, datetime
from decimal import Decimal
from os import listdir
from os.path import isfile, join
import simplejson as json

from .headers_util import get_cors_headers
from .get_logger import logger

logger = logger()
encodings = ["utf-8", "ISO-8859-1", "windows-1250", "windows-1252"]
DECIMAL_PRECESSION = 5


def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for _ in range(size))


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))


def deep_copy(obj):
    # tmp = json.dumps(obj)
    # return json.loads(tmp, use_decimal=True)
    return copy.deepcopy(obj)


def coalesce(*arg):
    """Return first item that is not None."""
    return next((a for a in arg if a is not None), None)


def chunks(lst: typing.List, n: int) -> typing.List:
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i: i + n]


def to_camel_case(snake_str):
    components = snake_str.split("_")
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    return components[0] + "".join(x.title() for x in components[1:])


def to_class_case(snake_str):
    components = snake_str.split("_")
    # We capitalize the first letter of each component
    # with the 'title' method and join them together.
    return "".join(x.title() for x in components[0:])


def gen_api_response_body(
        data={}, httpCode: int = 200, headers=get_cors_headers()
) -> str:
    try:
        body = json.dumps({"data": data}, default=str)
        resp = {
            "statusCode": httpCode,
            "isBase64Encoded": False,
            "headers": headers,
            "body": body,
        }
    except Exception as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        resp = {"statusCode": 500,
                "isBase64Encoded": False,
                "headers": get_cors_headers(),
                "body": "Unknown error happened in gen_api_response_body"}
    return resp


def get_files(path: str, ext: str = "") -> typing.List[str]:
    """Return list of file names in alphabetical order inside of provided path non-recursively.
    Omitting files not ending with ext."""
    ret = [
        f
        for f in listdir(path)
        if isfile(join(path, f)) and (not ext or not f.endswith(ext))
    ]
    ret.sort()
    return ret


# tests if value is able to be converted to float
def is_float(s) -> bool:
    try:
        float(s)
        return True
    except (ValueError, TypeError):
        return False


# tests if value is able to be converted to int
def is_int(s) -> bool:
    try:
        int(s)
        return True
    except (ValueError, TypeError):
        return False


def is_date(date_text: str, fmt: str = "%Y/%m/%d") -> bool:
    try:
        datetime.datetime.strptime(date_text, fmt)
        return True
    except ValueError:
        return False


def open_and_detect_encoding(file_name: str):
    for enc in encodings:
        try:
            fh = open(file_name, "r", encoding=enc)
            fh.readlines()
            fh.seek(0)
        except UnicodeDecodeError:
            print("got unicode error with %s , trying different encoding" % enc)
        else:
            print("opening the file with encoding:  %s " % enc)
            return fh
    return None


def read_and_detect_encoding(f):
    data = f.read()
    for enc in encodings:
        try:
            ret = data.decode(enc)
        except UnicodeDecodeError:
            print("got unicode error with %s , trying different encoding" % enc)
        else:
            print("opening the file with encoding:  %s " % enc)
            return ret

    return None


def has_value(v, search: str, depth: int = 0) -> bool:
    """Recursively search data structure for search value"""
    # don't go more than 3 levels deep
    if depth > 4:
        return False
    # if is a dict, search all dict values recursively
    if isinstance(v, dict):
        for dv in v.values():
            if has_value(dv, search, depth + 1):
                return True
    # if is a list, search all list values recursively
    if isinstance(v, list):
        for li in v:
            if has_value(li, search, depth + 1):
                return True
    # if is an int, trim off .00 for search if it exists then compare
    if isinstance(v, int):
        search = search.rstrip(".00")
        if str(v) == search:
            return True
    # if is a float, truncate string version of float to same size as search
    if isinstance(v, float):
        v = str(v)[0: len(search)]
        if search == v:
            return True
    # if is a string, strip and lowercase it then check if string starts with search
    if isinstance(v, str):
        if v.lower().strip().startswith(search) or v.lower().strip().endswith(search):
            return True
    return False


def is_zero(val):
    if val is None:
        return False
    t = type(val)
    if t is Decimal:
        return round(val, DECIMAL_PRECESSION).is_zero()
    if t is float:
        return math.isclose(round(val, 5), 0, rel_tol=1e-05)
    if t is int:
        return 0 == val
    return False


def non_zero(val):
    return not is_zero(val)


def principal_to_username(principal_id: str) -> str:
    username = principal_id.split("|")
    if len(username) > 2:
        username = username[2].split("@")[0]
    else:
        username = principal_id
    return username
