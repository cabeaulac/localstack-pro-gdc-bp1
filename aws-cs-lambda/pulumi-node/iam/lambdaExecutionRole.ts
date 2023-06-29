import * as aws from "@pulumi/aws";
import {PulumiUtil, mkItemName} from "../../iac-shared";

export const lambdaExecutionRole = new aws.iam.Role(
    mkItemName("lambda-execution-role"),
    {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "lambda.amazonaws.com",
        }),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const startEmailFlowLambdaExecutionRole = new aws.iam.Role(
    mkItemName("start-email-flow-lambda-execution-role"),
    {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "lambda.amazonaws.com",
        }),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const lambdaExecutionPolicy = new aws.iam.RolePolicy(
    mkItemName("lambda-execution-role-policy"),
    {
        role: lambdaExecutionRole.id,
        policy: {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "AllowLambdaFunctionInvocation",
                    Effect: "Allow",
                    Action: ["lambda:InvokeFunction"],
                    Resource: ["*"],
                },
                {
                    Sid: "AllowWsManagementInvocation",
                    Effect: "Allow",
                    Action: ["execute-api:Invoke", "execute-api:ManageConnections"],
                    Resource: ["arn:aws:execute-api:*:*:*/*"],
                },
                {
                    Sid: "Logs",
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams",
                        "logs:PutLogEvents",
                        "logs:GetLogEvents",
                        "logs:FilterLogEvents",
                    ],
                    Resource: "arn:aws:logs:*:*:*",
                },
                {
                    Sid: "StateMachines",
                    Effect: "Allow",
                    Action: [
                        "states:DescribeStateMachine",
                        "states:StartExecution",
                        "states:SendTaskSuccess",
                        "states:SendTaskFailure",
                        "states:ListExecution",
                        "states:DescribeExecution",
                        "states:DescribeStateMachineForExecution",
                        "states:GetExecutionHistory",
                        "states:SendTaskHeartbeat",
                        "states:GetActivityTask",
                    ],
                    Resource: "arn:aws:states:*:*:*:*",
                },
                {
                    Sid: "AllowAccessObjectsToS3",
                    Effect: "Allow",
                    Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:GetObjectAttributes"],
                    Resource: "*",
                },
                {
                    Sid: "AllowSqsAccess",
                    Effect: "Allow",
                    Action: [
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes",
                        "sqs:ReceiveMessage",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "AllowAssumeRole",
                    Effect: "Allow",
                    Action: "sts:AssumeRole",
                    Resource: "*",
                },
                {
                    Sid: "DDB",
                    Effect: "Allow",
                    Action: [
                        "dynamodb:BatchGet*",
                        "dynamodb:BatchGetItem",
                        "dynamodb:BatchWriteItem",
                        "dynamodb:ConditionCheckItem",
                        "dynamodb:DescribeTable",
                        "dynamodb:GetRecords",
                        "dynamodb:DeleteItem",
                        "dynamodb:DescribeTable",
                        "dynamodb:DescribeStream",
                        "dynamodb:DescribeGlobalTable",
                        "dynamodb:GetShardIterator",
                        "dynamodb:ListStreams",
                        "dynamodb:Query",
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Scan",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "TextractAccess",
                    Effect: "Allow",
                    Action: "textract:*",
                    Resource: "*",
                },
                {
                    Sid: "sns",
                    Effect: "Allow",
                    Action: "sns:*",
                    Resource: ["*"],
                },
            ],
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);

new aws.iam.RolePolicyAttachment(
    mkItemName(`lambdaBasicExecPolicyAtch`),
    {
        role: lambdaExecutionRole,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    },
    {provider: PulumiUtil.instance().awsProvider}
);
// allow services to execute this lambda
new aws.iam.RolePolicyAttachment(
    mkItemName("lambdaExecPolicyAtch"),
    {
        role: lambdaExecutionRole,
        policyArn: aws.iam.ManagedPolicies.AWSLambdaExecute,
    },
    {provider: PulumiUtil.instance().awsProvider}
);


export const startEmailFlowLambdaExecutionPolicy = new aws.iam.RolePolicy(
    mkItemName("start-email-flow-lambda-execution-role-policy"),
    {
        role: startEmailFlowLambdaExecutionRole.id,
        policy: {
            Version: "2012-10-17",
            Statement: [
                {
                    "Sid": "SesAccess",
                    "Effect": "Allow",
                    "Action": [
                        "ses:SendEmail",
                        "ses:SendRawEmail"
                    ],
                    "Resource": [
                        "arn:aws:ses:*:*:identity/*",
                        "arn:aws:ses:*:*:configuration-set/*"
                    ]
                },
                {
                    Sid: "AllowAccessObjectsToS3",
                    Effect: "Allow",
                    Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                    Resource: "*",
                },
                {
                    Sid: "DDB",
                    Effect: "Allow",
                    Action: [
                        "dynamodb:BatchGet*",
                        "dynamodb:BatchGetItem",
                        "dynamodb:BatchWriteItem",
                        "dynamodb:ConditionCheckItem",
                        "dynamodb:DescribeTable",
                        "dynamodb:GetRecords",
                        "dynamodb:DeleteItem",
                        "dynamodb:DescribeTable",
                        "dynamodb:DescribeStream",
                        "dynamodb:DescribeGlobalTable",
                        "dynamodb:GetShardIterator",
                        "dynamodb:ListStreams",
                        "dynamodb:Query",
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Scan",
                    ],
                    Resource: "*",
                },
            ],
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);

new aws.iam.RolePolicyAttachment(
    mkItemName(`startEmailFlowLambdaBasicExecPolicyAtch`),
    {
        role: startEmailFlowLambdaExecutionRole,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    },
    {provider: PulumiUtil.instance().awsProvider}
);
// allow services to execute this lambda
new aws.iam.RolePolicyAttachment(
    mkItemName("startLambdaFLambdaExecPolicyAtch"),
    {
        role: startEmailFlowLambdaExecutionRole,
        policyArn: aws.iam.ManagedPolicies.AWSLambdaVPCAccessExecutionRole,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const lambdaExecutionRoleArn = lambdaExecutionRole.arn;
export const lambdaExecutionPolicyName = lambdaExecutionRole.name;
