import * as aws from "@pulumi/aws";
import {mkItemName, PulumiUtil} from "../../iac-shared";
import {snsFailureLogsRole} from "./snsShared";

export const wsDisconnectTopic = new aws.sns.Topic(
    mkItemName("wsDisconnectTopic"),
    {
        sqsFailureFeedbackRoleArn: snsFailureLogsRole.arn,
        sqsSuccessFeedbackRoleArn: snsFailureLogsRole.arn,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const wsDisconnectSNSTopicArn = wsDisconnectTopic.arn;
