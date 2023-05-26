import {PulumiUtil} from "../../iac-shared";
import {userTableName, userBucket} from "../index";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const s3BaseLambda = basicPythonLambda("s3-base", {
    archiveName: "../../src/s3_base_lambda/s3_base_lambda.zip",
    executionRole: lambdaExecutionRole,
    timeout: 30,
    environment: {
        BUCKET_NAME: userBucket.bucket,
        DYNAMO_TABLE_NAME: userTableName,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
