import {mkItemName, PulumiUtil} from "../../iac-shared";
import {basicPythonLambda} from "../lambda-shared";
import {userBucket} from "../s3";
import {interpolate} from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {lambdaExecutionRole} from "../iam";

const userUploadRole = new aws.iam.Role(
    mkItemName("user-upload-role"),
    {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            AWS: lambdaExecutionRole.arn,
        }),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

const userUploadPolicy = new aws.iam.RolePolicy(
    mkItemName("user-upload-policy"),
    {
        role: userUploadRole.id,
        policy: {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "UserUploadAllowPutObjectsToS3",
                    Effect: "Allow",
                    Action: "s3:PutObject",
                    Resource: interpolate`${userBucket.arn}/users/*`,
                },
            ],
        },
    },
    {provider: PulumiUtil.instance().awsProvider}
);


export const s3UserUploadFilesLambda = basicPythonLambda("upload-user-files", {
    archiveName: "../../src/get_s3_upload_urls/get_s3_upload_urls.zip",
    executionRole: lambdaExecutionRole,
    timeout: 30,
    environment: {
        BUCKET_NAME: userBucket.bucket,
        UPLOAD_ROLE: userUploadRole.arn,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
    },
    dependsOn: [userUploadPolicy],
});
