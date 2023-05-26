import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {Route} from "@pulumi/awsx/classic/apigateway/api";
import * as pulumi from "@pulumi/pulumi";
import {all, interpolate} from "@pulumi/pulumi";
import * as lambdaAuthorizer from "@pulumi/awsx/classic/apigateway/lambdaAuthorizer";
import {mkItemName, mkLogGroup, PulumiUtil, apiVersion, apiStage, apiName} from "../../iac-shared";
import {apiGwAuthorizerLambda} from "../lambda/apiGwAuthorizer";

import {corsRoute} from "./cors";
import {gatewayResponses} from "./responses";
import {getUserLambdaRest} from "../lambda/getUser";
import {s3UserUploadFilesLambda} from "../lambda/getS3UploadUrls";
import {s3BaseLambda} from "../lambda/s3Base";
import {deleteS3ItemRest} from "../lambda/deleteS3Item";
import {updateS3ItemTagsRest} from "../lambda/updateS3ItemTags";

console.log('apiStage', apiStage);
console.log('apiVersion', apiVersion);

const userApiAuthorizers: lambdaAuthorizer.LambdaAuthorizer =
    awsx.classic.apigateway.getTokenLambdaAuthorizer({
        authorizerName: mkItemName(`${apiName}-authorizer`),
        header: "Authorization",
        identityValidationExpression: "^Bearer [-0-9a-zA-Z._]*$",
        authorizerResultTtlInSeconds: 3600,
        handler: apiGwAuthorizerLambda,
    });

const routes: Route[] = [
    ...corsRoute,
    {
        path: `/${apiVersion}/user`,
        method: "GET",
        eventHandler: getUserLambdaRest,
        authorizers: userApiAuthorizers,
    },
    {
        path: `/${apiVersion}/s3`,
        method: "GET",
        eventHandler: s3BaseLambda,
        authorizers: userApiAuthorizers,
    },
    {
        path: `/${apiVersion}/s3/{rk}`,
        method: "DELETE",
        eventHandler: deleteS3ItemRest,
        authorizers: userApiAuthorizers,
    },
    {
        path: `/${apiVersion}/s3/{rk}/tags`,
        method: "PATCH",
        eventHandler: updateS3ItemTagsRest,
        authorizers: userApiAuthorizers,
    },
    {
        path: `/${apiVersion}/upload`,
        method: "POST",
        eventHandler: s3UserUploadFilesLambda,
        authorizers: userApiAuthorizers,
    },

];

export const userApi = new awsx.classic.apigateway.API(
    mkItemName(`${apiName}-rest-api`),
    {
        deploymentArgs: {
            description: `API for ${apiName} SoR`,
        },
        routes: routes,
        gatewayResponses: gatewayResponses,

        stageArgs: {
            description: `Stage ${apiName} api`,
            accessLogSettings: {
                destinationArn: mkLogGroup("/api-gw/" + mkItemName(`${apiName}`)).arn,
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
        },
        stageName: apiStage,
        restApiArgs: {
            minimumCompressionSize: 1024,
            endpointConfiguration: {
                types: 'REGIONAL'
            },
            binaryMediaTypes: [
                'image/png',
                'image/jpeg'
            ]
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const userAuthorizerPermission = new aws.lambda.Permission(
    mkItemName(`${apiName}-allow-auth-lambda`),
    {
        action: "lambda:InvokeFunction",
        function: apiGwAuthorizerLambda,
        principal: "apigateway.amazonaws.com",
        sourceArn: interpolate`${userApi.deployment.executionArn}*`,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const restApiInvokeUrl = userApi.deployment.invokeUrl;
export const restApiId = userApi.restAPI.id;
export const restApiStageId = userApi.stage.id;
// remove stage and protocol from url
export const apiDomain = userApi.url.apply(url => (url || '').match(/([0-9a-zA-Z\._-]+)\//)?.[1] || '');

let endpoint;
if (!PulumiUtil.instance().isLocal) {
    endpoint = pulumi.interpolate`${userApi.deployment.invokeUrl}`;
} else {
    endpoint = pulumi.interpolate`http://host.docker.internal:4566/restapis/${userApi.stage.restApi}/${apiStage}/_user_request_`;
}

export const apiEndpoint = endpoint;
