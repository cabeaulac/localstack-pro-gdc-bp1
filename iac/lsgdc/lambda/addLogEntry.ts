import {PulumiUtil} from "../../iac-shared";
import {userTableName} from "../index";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";

export const addLogEntryRest = basicPythonLambda("add-log-entry-rest", {
    archiveName: "../../src/add_log_entry/add_log_entry.zip",
    executionRole: lambdaExecutionRole,
    timeout: 15,
    environment: {
        DYNAMO_TABLE_NAME: userTableName,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});
