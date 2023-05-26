import {PulumiUtil} from "../../iac-shared";
import {userTableName} from "../index";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const getUserLambdaRest = basicPythonLambda("get-user-rest", {
    archiveName: "../../src/get_user/get_user.zip",
    executionRole: lambdaExecutionRole,
    timeout: 30,
    environment: {
        DYNAMO_TABLE_NAME: userTableName,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
