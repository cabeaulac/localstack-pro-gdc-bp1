import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {PulumiUtil, mkItemName} from '../iac-shared';

export const apigwCloudwatchRole = new aws.iam.Role(mkItemName("apigwCloudwatchRole"), {
        assumeRolePolicy: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
`
    },
    {provider: PulumiUtil.instance().awsProvider});

export const apigwCloudwatchRolePolicy = new aws.iam.RolePolicy(mkItemName("apigwCloudwatchRolePolicy"), {
    role: apigwCloudwatchRole.id,
    policy: `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
`,
}, {provider: PulumiUtil.instance().awsProvider});

export const usahlApigwAccount = new aws.apigateway.Account(mkItemName("apigwAccountConfig"), {cloudwatchRoleArn: apigwCloudwatchRole.arn}, {provider: PulumiUtil.instance().awsProvider});
