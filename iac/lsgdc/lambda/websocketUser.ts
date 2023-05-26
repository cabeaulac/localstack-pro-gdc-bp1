import {basicPythonLambda, websocketLambdaLayerArn} from "../lambda-shared";
import {PulumiUtil} from "../../iac-shared";
import {lambdaExecutionRole} from "../iam";
import {userTableName} from "../index";
import {wsConnectionsTableName} from "../dynamodb";

// all websocket messages flow through this
export const websocketUser = basicPythonLambda("ws-user", {
    archiveName: "../../src/websocket_user/websocket_user.zip",
    executionRole: lambdaExecutionRole,
    environment: {
        WS_CONNECTIONS_TABLE_NAME: wsConnectionsTableName,
        TABLE_NAME: userTableName,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
    layers: [websocketLambdaLayerArn],
});
