import {PulumiUtil} from "../../iac-shared";
import {userTableName, userBucket} from "../index";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const updateS3ItemTagsRest = basicPythonLambda("update-s3-item-tags", {
    archiveName: "../../src/update_s3_item_tags/update_s3_item_tags.zip",
    executionRole: lambdaExecutionRole,
    timeout: 12,
    environment: {
        DYNAMO_TABLE_NAME: userTableName,
        BUCKET_NAME: userBucket.bucket,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
