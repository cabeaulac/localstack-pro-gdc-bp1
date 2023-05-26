import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import {all, log} from "@pulumi/pulumi";
// import { wsConnectionsTableName,} from "../dynamodb";
import {mkItemName, mkLogGroup, mkTagsWithName, PulumiUtil} from "../../iac-shared";
import {lambdaExecutionRole} from "../iam";

import {basicPythonLambda} from "../lambda-shared";
import {apiGwAuthorizerLambda} from "../lambda/apiGwAuthorizer";
import {websocketProcessorLambda} from "../lambda/websocketProcessor";
import {websocketUser} from "../lambda/websocketUser";

export const wsApi = new aws.apigatewayv2.Api(
    mkItemName("cuspws-api"),
    {
        protocolType: "WEBSOCKET",
        // websocket message body needs to have action member so we know where to route the message.
        // in our case we use a single lambda to handle everything but messages could be routed to multiple targets.
        routeSelectionExpression: "$request.body.action",
        tags: mkTagsWithName("ws-api"),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

const getConnectionAuthorizer = () => {

    return new aws.apigatewayv2.Authorizer(
        mkItemName("cuspws-auth"),
        {
            apiId: wsApi.id,
            authorizerType: "REQUEST",
            authorizerUri: apiGwAuthorizerLambda.invokeArn,
        },
        {provider: PulumiUtil.instance().awsProvider}
    );
};

export const connectionAuthorizer = getConnectionAuthorizer();

export const wsProcInvokePermission = new aws.lambda.Permission(
    mkItemName(`cuspws-proc-lambda-perm`),
    {
        action: "lambda:InvokeFunction",
        function: websocketProcessorLambda,
        principal: "apigateway.amazonaws.com",
        sourceArn: pulumi.interpolate`${wsApi.executionArn}/*`,
    },
    {provider: PulumiUtil.instance().awsProvider}
);


export const wsCuspInvokePermission = new aws.lambda.Permission(
    mkItemName(`cusp-inv-lambda-perm`),
    {
        action: "lambda:InvokeFunction",
        function: websocketUser,
        principal: "apigateway.amazonaws.com",
        sourceArn: pulumi.interpolate`${wsApi.executionArn}/*`,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const wsAuthInvokePermission = new aws.lambda.Permission(
    mkItemName(`cuspws-auth-lambda-perm`),
    {
        action: "lambda:InvokeFunction",
        function: apiGwAuthorizerLambda,
        principal: "apigateway.amazonaws.com",
        sourceArn: pulumi.interpolate`${wsApi.executionArn}/*`,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const wsProcIntegration = new aws.apigatewayv2.Integration(
    mkItemName(`ws-proc-proxy-integration`),
    {
        apiId: wsApi.id,
        integrationType: "AWS_PROXY",
        contentHandlingStrategy: "CONVERT_TO_TEXT",
        description: "cusp websocket integration",
        integrationMethod: "POST", // proxy method must be POST
        integrationUri: websocketProcessorLambda.invokeArn,
        passthroughBehavior: "WHEN_NO_MATCH",
    },
    {
        dependsOn: [wsAuthInvokePermission, wsProcInvokePermission],
        provider: PulumiUtil.instance().awsProvider,
    }
);

export const wsCuspIntegration = new aws.apigatewayv2.Integration(
    mkItemName(`ws-cusp-proxy-integration`),
    {
        apiId: wsApi.id,
        integrationType: "AWS_PROXY",
        contentHandlingStrategy: "CONVERT_TO_TEXT",
        description: "cusp websocket integration",
        integrationMethod: "POST", // proxy method must be POST
        integrationUri: websocketUser.invokeArn,
        passthroughBehavior: "WHEN_NO_MATCH",
    },
    {
        dependsOn: [wsAuthInvokePermission, wsCuspInvokePermission],
        provider: PulumiUtil.instance().awsProvider,
    }
);

const getRoute = (
    name: string,
    routeKey: string,
    integration: aws.apigatewayv2.Integration
): aws.apigatewayv2.Route => {
    return new aws.apigatewayv2.Route(
        mkItemName(name),
        {
            apiId: wsApi.id,
            routeKey: routeKey,
            target: integration.id.apply((id) => "integrations/" + id),
        },
        {provider: PulumiUtil.instance().awsProvider}
    );
};

// this route is special since it's the only one that deals with authorizer and api-key
const getConnectRoute = (name: string): aws.apigatewayv2.Route => {
    const args: any = {
        apiId: wsApi.id,
        routeKey: `$connect`,
        target: wsProcIntegration.id.apply((id) => "integrations/" + id),
        apiKeyRequired: true,
    };
    // This is fixes issue with not working LambdaAuthorizers at LocalStack version dated: 2022-05-12 (remove if they fix it)
    // if (!PulumiUtil.instance().isLocal) {
    args.authorizationType = "CUSTOM";
    args.authorizerId = connectionAuthorizer?.id;
    // }
    return new aws.apigatewayv2.Route(`${name}-connect-route`, args, {
        provider: PulumiUtil.instance().awsProvider,
    });
};

// this route gets called when no other routes match
const defaultRoute = getRoute(
    "ws-api-default-route",
    "$default",
    wsProcIntegration
);
// this route is special since it's the only one that deals with authorizer and api-key
const connectRoute = getConnectRoute("ws-api");
// called once on websocket disconnect
const disconnectRoute = getRoute(
    "ws-api-disconnect-route",
    "$disconnect",
    wsProcIntegration
);
// used for keep alive responds with PONG
const pingRoute = getRoute("ws-api-ping-route", "ping", wsProcIntegration);


export const wsApiStage = new aws.apigatewayv2.Stage(
    mkItemName("ws-api-stage"),
    {
        apiId: wsApi.id,
        name: "ws",
        autoDeploy: true,
        // known issue with cloudformation defaults of 0 causing problems with websockets so
        // we specify reasonable defaults
        defaultRouteSettings: {
            throttlingRateLimit: 100,
            throttlingBurstLimit: 50,
            dataTraceEnabled: false,
            loggingLevel: "ERROR",
        },
        accessLogSettings: {
            destinationArn: mkLogGroup(mkItemName("ws-api-log-group")).arn,
            format: JSON.stringify({
                requestId: "$context.requestId",
                ip: "$context.identity.sourceIp",
                caller: "$context.identity.caller",
                user: "$context.identity.user",
                requestTime: "$context.requestTime",
                httpMethod: "$context.httpMethod",
                resourcePath: "$context.resourcePath",
                status: "$context.status",
                protocol: "$context.protocol",
                responseLength: "$context.responseLength",
            }),
        },
        tags: mkTagsWithName("ws-api-stage"),
    },
    {
        dependsOn: [
            defaultRoute,
            connectRoute,
            disconnectRoute,
            pingRoute,
        ],
        provider: PulumiUtil.instance().awsProvider,
    }
);

const getApiKeys = () => {
    if (PulumiUtil.instance().isLocal) {
        return null;
    }
    return awsx.classic.apigateway.createAssociatedAPIKeys(
        mkItemName(`ws-api-stage`),
        {
            usagePlan: {
                apiStages: [
                    {
                        apiId: wsApi.id,
                        stage: wsApiStage.name,
                    },
                ],
            },
            apiKeys: [
                {
                    name: "the-key",
                },
            ],
        },
        {provider: PulumiUtil.instance().awsProvider}
    );
};

// api keys are required for access
export const wsApiKeys = getApiKeys();
export const wsStageInvokeUrl = wsApiStage.invokeUrl;
export const wsApiEndpoint = wsApi.apiEndpoint;
// remove stage name and protocol from url to get domain
export const wsApiDomain = all([wsApiStage.invokeUrl, wsApiStage.name]).apply(
    ([url, stage]) => url.replace("/" + stage, "").replace(/(\/|wss?:)/gi, "")
);

export const managementApiEndpoint = all([wsApiDomain, wsApiStage.name]).apply(
    ([domain, stageName]: string[]) => {
        if (PulumiUtil.instance().isLocal) {
            return "http://host.docker.internal:4566"
        }
        let result = `https://${domain}/`;
        if (stageName) {
            result += stageName;
        }
        log.info("managementApiEndpoint result: " + result);
        log.info("managementApiEndpoint endpoint: " + domain);
        log.info("managementApiEndpoint stagename: " + stageName);
        return result;
    }
);

