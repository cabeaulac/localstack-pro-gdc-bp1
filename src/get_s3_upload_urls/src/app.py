import json
import os
import traceback
from typing import List, TypedDict

import boto3

from lib import gen_api_response_body, exception_return, get_client, get_cors_headers, get_logger

logger = get_logger.logger()

UPLOAD_BUCKET_NAME = os.environ["BUCKET_NAME"]
UPLOAD_ROLE = os.environ["UPLOAD_ROLE"]
LOCALSTACK = int(os.environ["LOCALSTACK"])

if LOCALSTACK:
    LOCALSTACK_ENDPOINT = os.environ.get('LOCALSTACK_ENDPOINT', 'http://host.docker.internal:4566')
else:
    LOCALSTACK_ENDPOINT = None


class BodyItem(TypedDict):
    index: int
    name: str
    type: str
    path: str


class UploadUrlRequest(TypedDict):
    area: str
    files: List[BodyItem]


def handler(event, _):
    logger.info(f"handler event: {event}")
    logger.info(f"Localstack {LOCALSTACK}")
    logger.info(f"Localstack_endpoint {LOCALSTACK_ENDPOINT}")

    # Assume the IAM role that's allowed to upload objects to the target bucket
    # We do this because we have to create the S3 Signed URL with these credentials,
    # so the receiver of the Signed URL will have permissions to do the upload.
    sts_client = get_client.client("sts")
    assume_response = sts_client.assume_role(
        RoleArn=UPLOAD_ROLE,
        RoleSessionName=f"{event['requestContext']['requestId']}-upload-role",
        DurationSeconds=30 * 60,
    )
    credentials = assume_response["Credentials"]
    s3 = boto3.client(
        "s3",
        region_name=os.environ["AWS_REGION"],
        config=boto3.session.Config(signature_version='s3v4', ),
        endpoint_url=LOCALSTACK_ENDPOINT,
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )
    result = []
    try:
        principal_id = event["requestContext"]["authorizer"]["principalId"]
        target_data: UploadUrlRequest = json.loads(event["body"])
        for file_data in target_data['files']:
            url = generate_presigned_data(
                s3,
                UPLOAD_BUCKET_NAME,
                f"users/{target_data['area']}/{principal_id}/{file_data['name']}",
                file_data["type"],
                180,  # 3 minute expiration
            )
            logger.info("signed form data" + url)
            result.append({"url": url, "index": file_data["index"]})
    except Exception as e:
        logger.error(f"Error: {str(traceback.format_exc())}")
        return exception_return(500, e.message)

    return gen_api_response_body(result, 200, {**get_cors_headers(), **{"Content-Type": "application/json"}})
    #     {
    #     "statusCode": 200,
    #     "headers": {**get_cors_headers(), **{"Content-Type": "application/json"}},
    #     "body": gen_api_response_body(
    #         result
    #     ),
    # }


def generate_presigned_data(s3_client, bucket_name, key, file_type, expires_in):
    """
    Generate a presigned Amazon S3 URL that can be used to perform an action.

    :param s3_client: A Boto3 Amazon S3 client.
    :param bucket_name: A bucket where file will be uploaded
    :param key: A key prefix for file to upload
    :param file_type: A file Content-Type to upload
    :param expires_in: The number of seconds the presigned URL is valid for.
    :return: The presigned data object for UI upload form.
    """
    try:
        method_parameters = {
            "Bucket": bucket_name,
            "Key": key,
            "ContentType": file_type,
        }
        data = s3_client.generate_presigned_url(
            ClientMethod="put_object", Params=method_parameters, ExpiresIn=expires_in
        )
        return data
    # TODO clientError is undefined
    # except ClientError:
    except Exception:
        logger.exception("Couldn't get a presigned URL for client method '%s'.", key)
        raise
