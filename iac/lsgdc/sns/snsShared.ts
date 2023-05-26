import * as aws from "@pulumi/aws";
import {mkItemName, PulumiUtil} from "../../iac-shared";

export const snsFailureLogsRole = new aws.iam.Role(
    mkItemName("sns-failure-log-role"),
    {
        assumeRolePolicy: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "sts:AssumeRole",
                    Principal: {
                        Service: "sns.amazonaws.com",
                    },
                    Effect: "Allow",
                },
            ],
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);
export const snsFailureLogsPolicy = new aws.iam.RolePolicy(
    mkItemName("sns-failure-log-policy"),
    {
        role: snsFailureLogsRole,
        policy: {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: ["logs:*"],
                    Resource: ["arn:aws:logs:*:*:*"],
                },
            ],
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);
