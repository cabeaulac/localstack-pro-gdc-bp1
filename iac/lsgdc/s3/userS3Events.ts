import * as aws from "@pulumi/aws";
import {mkItemName, PulumiUtil} from "../../iac-shared";
import {userBucket} from "./userBucket";
import {s3ItemsUploaded} from "../lambda/s3ItemsUploaded";

const userItemsUploadInvokePermission = new aws.lambda.Permission(
    mkItemName("vitems-upload-perm"),
    {
        action: "lambda:InvokeFunction",
        function: s3ItemsUploaded,
        principal: "s3.amazonaws.com",
        sourceArn: userBucket.arn,
    },
    {provider: PulumiUtil.instance().awsProvider}
);


export const userBucketNotifications = new aws.s3.BucketNotification(
    mkItemName("cusp-users-bucket-events"),
    {
        bucket: userBucket.bucket,
        lambdaFunctions: [
            {
                lambdaFunctionArn: s3ItemsUploaded.arn,
                events: ["s3:ObjectCreated:*"],
                filterPrefix: "users/s3_upload/",
            },
        ],
    },
    {
        dependsOn: [
            userItemsUploadInvokePermission,
        ],
        provider: PulumiUtil.instance().awsProvider,
    }
);
