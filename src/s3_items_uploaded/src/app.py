from datetime import datetime
from lib import db_access, get_client, get_logger, get_user_id, get_s3_item_rk

logger = get_logger.logger()


def handler(event, _):
    """
    S3 items uploaded for user
    """
    # logger.info(f"handler event: {event}")
    dynamo_db = get_client.resource("dynamodb")
    user_table = db_access.UserTable(dynamo_db)
    attributes = ['ObjectSize']

    for record in event["Records"]:
        try:
            bucket = record['s3']['bucket']['name']
            key = record["s3"]["object"]["key"]
            userid = key.split("/")[-2]
            file_name = key.split("/")[-1]

            s3 = get_client.client("s3")
            logger.info(f"Got S3 item {file_name} for userid {userid}")
            item_attrs = s3.get_object_attributes(Bucket=bucket, Key=key,
                                                  ObjectAttributes=attributes)
            # Create a VaultItem to store
            now = datetime.now().isoformat()
            s3_item = {}
            s3_item['id'] = get_user_id(userid)
            s3_item['rk'] = get_s3_item_rk(file_name, now)
            s3_item['s3key'] = key
            s3_item['name'] = file_name
            s3_item['createDt'] = now
            s3_item['lastModDt'] = now
            s3_item['size'] = item_attrs['ObjectSize']
            s3_item['tags'] = []

            user_table.add_s3_item(s3_item)
        except Exception as e:
            logger.error(f"s3_contact_uploaded error {str(e)}", exc_info=True)
