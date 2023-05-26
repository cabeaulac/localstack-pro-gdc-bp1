import {PulumiUtil} from "../../iac-shared";
import {userTableName, userBucket} from "../index";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const deleteS3ItemRest = basicPythonLambda("del-vault-item", {
    archiveName: "../../src/delete_s3_item/delete_s3_item.zip",
    executionRole: lambdaExecutionRole,
    timeout: 12,
    environment: {
        DYNAMO_TABLE_NAME: userTableName,
        BUCKET_NAME: userBucket.bucket,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
