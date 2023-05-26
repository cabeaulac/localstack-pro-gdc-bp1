import random
import string
from urllib.parse import urlparse, parse_qs
import requests as requests
import uuid
from datetime import datetime
from dateutil.relativedelta import relativedelta
from lib import get_user_id, get_logger

logger = get_logger.logger()


def get_url_param(url, param):
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)
    param_val = query_params.get(param)

    if param_val:
        return param_val[0]
    else:
        return None


def upload_file_to_s3_presigned_url(file_object, presigned_url):
    with open(file_object, 'rb') as f:
        response = requests.put(presigned_url, data=f)

    if response.status_code == 200:
        print("File uploaded successfully.")
    else:
        print("File upload failed.")
    return response


def shortHash():
    return str(uuid.uuid4())[:8]


def clearUserS3Items(s3, bucket_name):
    bucket = s3.Bucket(bucket_name)

    # Iterate over all objects in the bucket and delete them
    for obj in bucket.objects.all():
        obj.delete()


def clearWsConnectionTable(table):
    logger.info(f"Clearing user WS Connections")
    """
    NOTE: there are reserved attributes for key names, please see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
    if a hash or range key is in the reserved word list, you will need to use the ExpressionAttributeNames parameter
    described at https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html#DynamoDB.Table.scan
    """

    pkNames = {"#id": "id", "#connectionId": "connectionId"}
    counter = 0
    projectionExpression = "#id, #connectionId"

    page = table.scan(
        ProjectionExpression=projectionExpression, ExpressionAttributeNames=pkNames
    )
    with table.batch_writer() as batch:
        while page["Count"] > 0:
            counter += page["Count"]
            # Delete items in batches
            for itemKeys in page["Items"]:
                batch.delete_item(Key=itemKeys)
            # Fetch the next page
            if "LastEvaluatedKey" in page:
                page = table.scan(
                    ProjectionExpression=projectionExpression,
                    ExpressionAttributeNames=pkNames,
                    ExclusiveStartKey=page["LastEvaluatedKey"],
                )
            else:
                break
    logger.info(f"Deleted {counter} WS Connection items from DDB")

def clearUserDdbItems(user_table):
    logger.info(f"Clearing user DDB items: {user_table.table_name}")
    """
    NOTE: there are reserved attributes for key names, please see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
    if a hash or range key is in the reserved word list, you will need to use the ExpressionAttributeNames parameter
    described at https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html#DynamoDB.Table.scan
    """

    pkNames = {"#id": "id", "#rk": "rk"}
    counter = 0
    projectionExpression = "#id, #rk"

    page = user_table.table.scan(
        ProjectionExpression=projectionExpression, ExpressionAttributeNames=pkNames
    )
    with user_table.table.batch_writer() as batch:
        while page["Count"] > 0:
            counter += page["Count"]
            # Delete items in batches
            for itemKeys in page["Items"]:
                batch.delete_item(Key=itemKeys)
            # Fetch the next page
            if "LastEvaluatedKey" in page:
                page = user_table.table.scan(
                    ProjectionExpression=projectionExpression,
                    ExpressionAttributeNames=pkNames,
                    ExclusiveStartKey=page["LastEvaluatedKey"],
                )
            else:
                break
    logger.info(f"Deleted {counter} user docs from DDB")

