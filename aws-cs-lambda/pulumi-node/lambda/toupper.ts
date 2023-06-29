import {PulumiUtil} from "../../../iac/iac-shared";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const getUserLambdaRest = basicPythonLambda("toupper", {
    archiveName: "../../src/get_user/get_user.zip",
    executionRole: lambdaExecutionRole,
    timeout: 30,
    environment: {
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
