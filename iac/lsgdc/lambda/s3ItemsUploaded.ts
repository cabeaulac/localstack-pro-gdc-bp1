import {mkItemName, PulumiUtil} from "../../iac-shared";
import {basicPythonLambda} from "../lambda-shared";
import {userBucket} from "../s3";
import {lambdaExecutionRole, lambdaExecutionRoleArn} from "../iam";
import {userTableName} from "../index";

export const s3ItemsUploaded = basicPythonLambda(
    mkItemName("s3-items-uploaded"),
    {
        archiveName: "../../src/s3_items_uploaded/s3_items_uploaded.zip",
        executionRole: lambdaExecutionRole,
        timeout: 40,
        environment: {
            BUCKET_NAME: userBucket.bucket,
            DYNAMO_TABLE_NAME: userTableName,
            LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
        },
    }
);
