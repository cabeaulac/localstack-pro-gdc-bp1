import {interpolate} from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import {getOriginAccessIdentity, mkItemName, PulumiUtil} from "../../iac-shared";
import {siteBucket} from "../s3";

export const accessIdentity = getOriginAccessIdentity("site");

const allowAccessFromAnotherAccountPolicyDocument =
    aws.iam.getPolicyDocumentOutput(
        {
            statements: [
                {
                    effect: "Allow",
                    principals: [
                        {
                            type: "Service",
                            identifiers: ["delivery.logs.amazonaws.com"],
                        },
                    ],
                    actions: ["s3:PutObject"],
                    resources: [interpolate`arn:aws:s3:::${siteBucket.bucket}/logs/*`],
                },
                {
                    principals: [
                        {
                            type: "AWS",
                            identifiers: [accessIdentity.iamArn],
                        },
                    ],
                    actions: ["s3:GetObject"],
                    resources: [interpolate`${siteBucket.arn}/*`],
                },
            ],
        },
        {provider: PulumiUtil.instance().awsProvider}
    );

export const allowAccessFromOai = new aws.s3.BucketPolicy(
    mkItemName("cf-site-origin-cf-policy"),
    {
        bucket: siteBucket.bucket,
        policy: allowAccessFromAnotherAccountPolicyDocument.json,
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const siteOrigin = {
    domainName: siteBucket.bucketRegionalDomainName,
    originId: "cloudfront-site-origin-s3-origin",
    originPath: "/ui",
    customHeaders: [],
    s3OriginConfig: {
        originAccessIdentity: accessIdentity.cloudfrontAccessIdentityPath,
    },
    originShield: {
        // better caching
        enabled: true,
        originShieldRegion: PulumiUtil.instance().region || "",
    },
};
