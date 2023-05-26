import {basicPythonLambda, websocketLambdaLayerArn} from "../lambda-shared";
import {PulumiUtil} from "../../iac-shared";
import {lambdaExecutionRole} from "../iam";
import {userTableName} from "../index";
import {
    wsConnectionsTableName,
} from "../dynamodb";
import {wsDisconnectSNSTopicArn} from "../sns/wsDisconnectSNSTopic";

// all core websocket messages flow through this
export const websocketProcessorLambda = basicPythonLambda("ws-processor", {
    archiveName: "../../src/websocket_processor/websocket_processor.zip",
    executionRole: lambdaExecutionRole,
    environment: {
        WS_CONNECTIONS_TABLE_NAME: wsConnectionsTableName,
        USER_TABLE_NAME: userTableName,
        WS_DISCONNECT_SNS_TOPIC_ARN: wsDisconnectSNSTopicArn,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
    layers: [websocketLambdaLayerArn],
});
