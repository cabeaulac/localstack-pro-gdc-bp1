import {mkItemName, PulumiUtil} from "../../iac-shared";
import {userTableName, userTable} from "../index";
import {wsConnectionsTableName} from "../dynamodb";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";
import * as aws from "@pulumi/aws";
import {managementApiEndpoint} from "../apigw";


export const userDdbStreamHandlerLambda = basicPythonLambda("user-ddb-stream-handler", {
    archiveName: "../../src/user_ddb_stream_hdlr/user_ddb_stream_hdlr.zip",
    executionRole: lambdaExecutionRole,
    timeout: 60,
    environment: {
        MANAGEMENT_API_ENDPOINT: managementApiEndpoint,
        WS_CONNECTIONS_TABLE_NAME: wsConnectionsTableName,
        TABLE_NAME: userTableName,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
});

export const userDdbStreamLambdaEsm = new aws.lambda.EventSourceMapping(
    mkItemName(`user-ddb-stream-esm`),
    {
        eventSourceArn: userTable.streamArn,
        functionName: userDdbStreamHandlerLambda.arn,
        startingPosition: "LATEST",
    },
    {provider: PulumiUtil.instance().awsProvider}
);
